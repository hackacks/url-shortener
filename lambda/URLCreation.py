import json
import os
import hashlib
import boto3
import urllib.request
import urllib.error
import socket
import ipaddress
import re
from urllib.parse import urlparse, unquote
from datetime import datetime, timezone
from botocore.exceptions import ClientError

# Initialize DynamoDB resource outside the handler for connection reuse
dynamodb = boto3.resource("dynamodb")
TABLE_NAME = os.environ.get("TABLE_NAME", "url-shortner")
table = dynamodb.Table(TABLE_NAME)

BASE62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

# Security config
SAFE_BROWSING_API_KEY = os.environ.get("SAFE_BROWSING_API_KEY", "")
SHORT_DOMAIN = os.environ.get("SHORT_DOMAIN", "")
APP_CLIENT_ID = os.environ.get("APP_CLIENT_ID", "url-shortener")

FORBIDDEN_DOMAINS = {
    "bit.ly",
    "tinyurl.com",
    "t.co",
    "goo.gl",
    "is.gd",
    "buff.ly",
    "ow.ly",
    "cutt.ly",
}
if SHORT_DOMAIN:
    FORBIDDEN_DOMAINS.add(SHORT_DOMAIN)

MAX_URL_LENGTH = 2048
MAX_REDIRECTS = 5
HTTP_TIMEOUT_SECONDS = 4

UNSAFE_CHARS = {"<", ">", '"', "'", "`"}
CONTROL_CHAR_RE = re.compile(r"[\x00-\x1f\x7f]")


def response(status_code, payload):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
        },
        "body": json.dumps(payload),
    }


def encode_base62(num):
    """Converts an integer to a Base62 string."""
    if num == 0:
        return BASE62[0]

    arr = []
    base = len(BASE62)
    while num:
        num, rem = divmod(num, base)
        arr.append(BASE62[rem])

    arr.reverse()
    return "".join(arr)


def generate_short_code(url, user_id, salt=0):
    """Generates a 6-character deterministic shortcode specific to the user."""
    normalized_url = url.strip()
    base_string = f"{normalized_url}-{user_id}"
    salted_string = f"{base_string}-{salt}" if salt > 0 else base_string

    hash_obj = hashlib.sha256(salted_string.encode("utf-8"))
    hash_int = int(hash_obj.hexdigest()[:8], 16)
    base62_str = encode_base62(hash_int)

    return base62_str.zfill(6)[:6]


def recursively_unquote(value, max_rounds=2):
    """Decode percent-encoding a small number of times to expose hidden payloads."""
    current = value
    for _ in range(max_rounds):
        decoded = unquote(current)
        if decoded == current:
            break
        current = decoded
    return current


def contains_unsafe_chars(text):
    if any(ch in text for ch in UNSAFE_CHARS):
        return True
    if CONTROL_CHAR_RE.search(text):
        return True
    return False


def normalize_hostname(hostname):
    """Lowercase and convert IDN to ASCII to avoid Unicode spoofing issues."""
    if not hostname:
        return ""

    host = hostname.strip().lower()

    # Convert Unicode domain names to punycode ASCII if possible
    try:
        host = host.encode("idna").decode("ascii")
    except Exception:
        return ""

    if host.startswith("www."):
        host = host[4:]

    return host


def is_ip_literal(hostname):
    try:
        ipaddress.ip_address(hostname)
        return True
    except Exception:
        return False


def is_loopback_or_private_host(hostname):
    """
    Blocks obvious internal targets.
    This does not resolve DNS; it only checks literal IPs and obvious local names.
    """
    if not hostname:
        return True

    local_names = {
        "localhost",
        "localhost.localdomain",
        "ip6-localhost",
        "ip6-loopback",
    }

    if hostname in local_names:
        return True

    if is_ip_literal(hostname):
        ip = ipaddress.ip_address(hostname)
        return (
            ip.is_private
            or ip.is_loopback
            or ip.is_link_local
            or ip.is_reserved
            or ip.is_multicast
            or ip.is_unspecified
        )

    return False


def is_valid_url(url):
    """
    Strict URL validation:
    - only http/https
    - blocks unsafe characters
    - blocks control chars and encoded payloads
    - requires a hostname
    - blocks userinfo tricks like user:pass@host
    """
    if not isinstance(url, str):
        return False, "URL must be a string."

    raw = url.strip()
    if not raw:
        return False, "URL is empty."

    if len(raw) > MAX_URL_LENGTH:
        return False, "URL is too long."

    decoded = recursively_unquote(raw)

    if contains_unsafe_chars(decoded):
        return False, "URL contains unsafe characters."

    parsed = urlparse(decoded)

    if parsed.scheme not in ("http", "https"):
        return False, "Only http and https URLs are allowed."

    if not parsed.netloc:
        return False, "URL is missing a hostname."

    if parsed.username or parsed.password:
        return False, "URLs with embedded credentials are not allowed."

    host = normalize_hostname(parsed.hostname)
    if not host:
        return False, "Invalid hostname."

    if is_loopback_or_private_host(host):
        return False, "Private, loopback, or local hosts are not allowed."

    return True, decoded


def is_forbidden_domain(url):
    """Checks whether the hostname is a forbidden domain or its subdomain."""
    try:
        parsed_url = urlparse(url)
        hostname = normalize_hostname(parsed_url.hostname)

        if not hostname:
            return True

        for domain in FORBIDDEN_DOMAINS:
            d = normalize_hostname(domain)
            if hostname == d or hostname.endswith("." + d):
                return True

        return False
    except Exception as e:
        print(f"Error parsing domain: {e}")
        return True


def resolve_final_url(url):
    """
    Follow redirects and return the final destination URL.
    Uses HEAD first, then falls back to GET if needed.
    """
    current = url

    for _ in range(MAX_REDIRECTS):
        try:
            req = urllib.request.Request(
                current,
                method="HEAD",
                headers={
                    "User-Agent": "Mozilla/5.0",
                    "Accept": "*/*",
                    "Connection": "close",
                },
            )
            with urllib.request.urlopen(req, timeout=HTTP_TIMEOUT_SECONDS) as resp:
                final_url = resp.geturl()
                if final_url == current:
                    return current
                current = final_url
        except urllib.error.HTTPError as e:
            # Some servers reject HEAD. Try GET once for that hop.
            if e.code in (405, 403):
                try:
                    req = urllib.request.Request(
                        current,
                        method="GET",
                        headers={
                            "User-Agent": "Mozilla/5.0",
                            "Accept": "*/*",
                            "Connection": "close",
                        },
                    )
                    with urllib.request.urlopen(req, timeout=HTTP_TIMEOUT_SECONDS) as resp:
                        final_url = resp.geturl()
                        if final_url == current:
                            return current
                        current = final_url
                except Exception:
                    raise
            else:
                raise
        except Exception:
            raise

    return current


def safe_browsing_check(url):
    """
    Returns:
        (True, None)  => safe enough for shortening
        (False, reason) => block shortening
    """
    if not SAFE_BROWSING_API_KEY:
        return False, "Security scanning is unavailable."

    api_url = f"https://safebrowsing.googleapis.com/v4/threatMatches:find?key={SAFE_BROWSING_API_KEY}"

    payload = {
        "client": {
            "clientId": APP_CLIENT_ID,
            "clientVersion": "1.0.0",
        },
        "threatInfo": {
            "threatTypes": ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"],
            "platformTypes": ["ANY_PLATFORM"],
            "threatEntryTypes": ["URL"],
            "threatEntries": [{"url": url}],
        },
    }

    try:
        req = urllib.request.Request(
            api_url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=HTTP_TIMEOUT_SECONDS) as response:
            result = json.loads(response.read().decode("utf-8"))

            if "matches" in result and result["matches"]:
                return False, "This URL has been flagged as malicious."

            return True, None

    except Exception as e:
        print(f"Safe Browsing check failed: {e}")
        return False, "Security scanning failed."


def validate_and_scan_url(input_url):
    """
    Full security pipeline:
    - strict URL validation
    - forbidden domain check on original URL
    - follow redirects
    - forbidden domain check on final destination
    - Safe Browsing check on original and final URLs
    """
    is_valid, cleaned_url_or_reason = is_valid_url(input_url)
    if not is_valid:
        return False, cleaned_url_or_reason, None

    cleaned_url = cleaned_url_or_reason

    # Check original URL
    if is_forbidden_domain(cleaned_url):
        return False, "Shortening links from this domain is not allowed.", None

    safe, reason = safe_browsing_check(cleaned_url)
    if not safe:
        return False, reason, None

    # Follow redirects and verify final destination
    try:
        final_url = resolve_final_url(cleaned_url)
    except Exception as e:
        print(f"Redirect resolution failed: {e}")
        return False, "Could not verify the final destination URL.", None

    # Validate final destination structure as well
    final_valid, final_result = is_valid_url(final_url)
    if not final_valid:
        return False, "Final destination URL is invalid.", None

    final_cleaned_url = final_result

    if is_forbidden_domain(final_cleaned_url):
        return False, "Final destination is from a blocked domain.", None

    safe, reason = safe_browsing_check(final_cleaned_url)
    if not safe:
        return False, reason, None

    return True, None, final_cleaned_url


def lambda_handler(event, context):
    # --- HTTP API Gateway JWT Extraction ---
    user_id = "anonymous"
    user_email = "unknown"

    try:
        claims = event["requestContext"]["authorizer"]["jwt"]["claims"]
        user_id = claims.get("sub", "anonymous")
        user_email = claims.get("email", "unknown")
    except (KeyError, TypeError):
        print("Warning: Could not extract JWT claims. Proceeding as anonymous.")
    # ------------------------------------------------

    # 1. Parse the long_url from the event
    try:
        if "body" in event and event["body"]:
            body = json.loads(event["body"])
            long_url = body["long_url"]
        else:
            long_url = event["long_url"]
    except (KeyError, TypeError, json.JSONDecodeError):
        return response(400, {"error": "Please provide a valid URL."})

    # 2. Validate and scan
    ok, reason, verified_url = validate_and_scan_url(long_url)
    if not ok:
        return response(400, {"error": reason})

    # Use the verified final URL for storage and code generation
    long_url = verified_url

    salt = 0
    max_retries = 10

    # 3. Collision handling loop
    while salt < max_retries:
        short_code = generate_short_code(long_url, user_id, salt)
        db_response = table.get_item(Key={"shortCode": short_code})

        if "Item" in db_response:
            item = db_response["Item"]
            if item.get("long_url") == long_url and item.get("userId") == user_id:
                return response(
                    200,
                    {
                        "short_code": short_code,
                        "long_url": long_url,
                        "message": "exist",
                    },
                )
            else:
                salt += 1
                continue

        try:
            current_timestamp = datetime.now(timezone.utc).isoformat()
            table.put_item(
                Item={
                    "shortCode": short_code,
                    "long_url": long_url,
                    "userId": user_id,
                    "userEmail": user_email,
                    "createdAt": current_timestamp,
                },
                ConditionExpression="attribute_not_exists(shortCode)",
            )

            return response(
                201,
                {
                    "short_code": short_code,
                    "long_url": long_url,
                    "message": "new",
                },
            )

        except ClientError as e:
            if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
                salt += 1
                continue
            raise e

    # 4. Fallback
    return response(
        500,
        {"error": "Failed to generate a unique short code after multiple attempts."},
    )