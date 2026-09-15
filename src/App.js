import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "react-oidc-context";
import myLogo from "./logo.png";

// ENV Vars
const API_ENDPOINT = process.env.REACT_APP_API_ENDPOINT;
const GET_URLS_ENDPOINT = process.env.REACT_APP_GET_URLS_ENDPOINT;
const DELETE_ENDPOINT = process.env.REACT_APP_DELETE_ENDPOINT;

const THEME_STORAGE_KEY = "hackack-theme";

const getInitialTheme = () => {
  if (typeof window === "undefined") return "dark";

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
};

const createStyles = (theme) => {
  const isDark = theme === "dark";

  return {
    container: {
      minHeight: "100vh",
      backgroundColor: isDark ? "#0b0f19" : "#f4f7fb",
      color: isDark ? "#e2e8f0" : "#111827",
      fontFamily: "'Inter', sans-serif",
      overflowX: "hidden",
    },
    nav: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "15px 20px",
      backgroundColor: isDark ? "#111827" : "#ffffff",
      borderBottom: `1px solid ${isDark ? "#1f2937" : "#dbe3ee"}`,
      boxShadow: isDark
        ? "0 4px 10px rgba(0,0,0,0.3)"
        : "0 4px 10px rgba(15,23,42,0.08)",
      flexWrap: "wrap",
      gap: "10px",
    },
    logoContainer: { display: "flex", alignItems: "center", gap: "10px" },
    logoImg: { height: "30px", width: "auto", objectFit: "contain" },
    logoText: {
      fontSize: "18px",
      fontWeight: "bold",
      color: isDark ? "#ffffff" : "#0f172a",
      letterSpacing: "1px",
    },
    bigLogoImg: {
      height: "60px",
      width: "auto",
      objectFit: "contain",
      marginBottom: "20px",
    },
    userInfo: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      color: isDark ? "#9ca3af" : "#475569",
      flexWrap: "wrap",
      justifyContent: "flex-end",
    },
    userEmail: {
      fontSize: "14px",
      wordBreak: "break-all",
      maxWidth: "150px",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    main: {
      display: "flex",
      justifyContent: "center",
      paddingTop: "30px",
      paddingBottom: "60px",
      padding: "20px 15px",
    },
    contentWrapper: {
      width: "100%",
      maxWidth: "800px",
      display: "flex",
      flexDirection: "column",
      gap: "30px",
      boxSizing: "border-box",
    },
    card: {
      width: "100%",
      backgroundColor: isDark ? "#161b2c" : "#ffffff",
      color: isDark ? "#e2e8f0" : "#0f172a",
      padding: "25px",
      borderRadius: "16px",
      boxShadow: isDark
        ? "0 20px 40px rgba(0,0,0,0.4)"
        : "0 18px 36px rgba(15,23,42,0.08)",
      border: `1px solid ${isDark ? "#2d3748" : "#dbe3ee"}`,
      boxSizing: "border-box",
    },
    title: {
      fontSize: "24px",
      color: isDark ? "#ffffff" : "#0f172a",
      marginBottom: "10px",
      textAlign: "center",
    },
    subtitle: {
      color: isDark ? "#9ca3af" : "#475569",
      textAlign: "center",
      marginBottom: "25px",
      fontSize: "14px",
    },
    form: {
      display: "flex",
      flexDirection: "column",
      gap: "15px",
      width: "100%",
    },
    input: {
      width: "100%",
      padding: "14px",
      borderRadius: "8px",
      border: `1px solid ${isDark ? "#374151" : "#cbd5e1"}`,
      backgroundColor: isDark ? "#0b0f19" : "#f8fafc",
      color: isDark ? "#ffffff" : "#0f172a",
      fontSize: "16px",
      outline: "none",
      boxSizing: "border-box",
    },
    primaryBtn: {
      width: "100%",
      padding: "14px",
      borderRadius: "8px",
      border: "none",
      backgroundImage: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
      color: "#fff",
      fontSize: "16px",
      fontWeight: "bold",
      cursor: "pointer",
      transition: "opacity 0.2s",
    },
    secondaryBtn: {
      padding: "10px 20px",
      borderRadius: "8px",
      border: "1px solid #3b82f6",
      backgroundColor: isDark
        ? "rgba(59, 130, 246, 0.1)"
        : "rgba(59, 130, 246, 0.08)",
      color: "#60a5fa",
      fontSize: "14px",
      fontWeight: "bold",
      cursor: "pointer",
      transition: "all 0.2s",
    },
    outlineBtn: {
      padding: "8px 15px",
      borderRadius: "6px",
      border: `1px solid ${isDark ? "#8b5cf6" : "#7c3aed"}`,
      color: isDark ? "#c4b5fd" : "#6d28d9",
      backgroundColor: "transparent",
      cursor: "pointer",
      fontSize: "14px",
    },
    errorBox: {
      marginTop: "20px",
      padding: "10px",
      backgroundColor: isDark
        ? "rgba(239, 68, 68, 0.1)"
        : "rgba(239, 68, 68, 0.08)",
      border: "1px solid rgba(239, 68, 68, 0.3)",
      borderRadius: "8px",
      color: isDark ? "#fca5a5" : "#b91c1c",
      fontSize: "14px",
    },
    successBox: {
      marginTop: "30px",
      padding: "20px",
      backgroundColor: isDark
        ? "rgba(139, 92, 246, 0.1)"
        : "rgba(139, 92, 246, 0.08)",
      border: "1px solid rgba(139, 92, 246, 0.3)",
      borderRadius: "8px",
      width: "100%",
      boxSizing: "border-box",
    },
    successLabel: {
      marginBottom: "10px",
      fontWeight: "bold",
      color: isDark ? "#c4b5fd" : "#6d28d9",
    },
    resultRow: { display: "flex", gap: "10px", flexWrap: "wrap" },
    resultInput: {
      flex: 1,
      minWidth: "150px",
      padding: "10px",
      border: `1px solid ${isDark ? "#374151" : "#cbd5e1"}`,
      borderRadius: "6px",
      backgroundColor: isDark ? "#0b0f19" : "#f8fafc",
      color: isDark ? "#a78bfa" : "#6d28d9",
    },
    copyBtn: {
      padding: "10px 20px",
      borderRadius: "6px",
      border: "none",
      backgroundImage: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
      color: "#fff",
      cursor: "pointer",
      minWidth: "100px",
      fontWeight: "bold",
      transition: "all 0.3s ease",
    },
    copyBtnSuccess: {
      padding: "10px 20px",
      borderRadius: "6px",
      border: "none",
      backgroundColor: "#10b981",
      color: "#fff",
      cursor: "default",
      minWidth: "100px",
      fontWeight: "bold",
      transition: "all 0.3s ease",
    },
    popAnimation: {
      transform: "scale(1.05)",
      boxShadow: "0 0 15px rgba(16, 185, 129, 0.5)",
    },
    linksCard: {
      width: "100%",
      backgroundColor: isDark ? "#161b2c" : "#ffffff",
      color: isDark ? "#e2e8f0" : "#0f172a",
      padding: "25px",
      borderRadius: "16px",
      boxShadow: isDark
        ? "0 10px 30px rgba(0,0,0,0.3)"
        : "0 10px 25px rgba(15,23,42,0.08)",
      border: `1px solid ${isDark ? "#2d3748" : "#dbe3ee"}`,
      boxSizing: "border-box",
    },
    sectionHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottom: `1px solid ${isDark ? "#2d3748" : "#dbe3ee"}`,
      paddingBottom: "15px",
      marginBottom: "20px",
      flexWrap: "wrap",
      gap: "10px",
    },
    sectionTitle: {
      fontSize: "18px",
      color: isDark ? "#ffffff" : "#0f172a",
      margin: 0,
    },
    loadingText: {
      color: isDark ? "#9ca3af" : "#475569",
      textAlign: "center",
      fontStyle: "italic",
      fontSize: "14px",
    },
    emptyText: {
      color: isDark ? "#9ca3af" : "#475569",
      textAlign: "center",
      padding: "20px 0",
      fontSize: "14px",
    },
    tableContainer: { overflowX: "auto", width: "100%" },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      textAlign: "left",
      minWidth: "500px",
    },
    th: {
      padding: "12px",
      borderBottom: `1px solid ${isDark ? "#374151" : "#dbe3ee"}`,
      color: isDark ? "#9ca3af" : "#475569",
      fontWeight: "600",
      fontSize: "14px",
      whiteSpace: "nowrap",
    },
    tr: {
      borderBottom: `1px solid ${isDark ? "#2d3748" : "#edf2f7"}`,
      transition: "background-color 0.2s",
    },
    td: { padding: "12px", fontSize: "14px", verticalAlign: "middle" },
    clickBadge: {
      display: "inline-block",
      padding: "4px 10px",
      borderRadius: "12px",
      backgroundColor: isDark
        ? "rgba(16, 185, 129, 0.15)"
        : "rgba(16, 185, 129, 0.1)",
      color: "#34d399",
      fontWeight: "bold",
      fontSize: "13px",
    },
    link: {
      color: "#60a5fa",
      textDecoration: "none",
      fontWeight: "500",
    },
    urlText: {
      display: "block",
      width: "100%",
      maxWidth: "200px",
      wordBreak: "break-all",
      whiteSpace: "normal",
      color: isDark ? "#d1d5db" : "#334155",
      fontSize: "13px",
      lineHeight: "1.4",
    },
    actionGroup: { display: "flex", gap: "8px" },
    smallOutlineBtn: {
      padding: "6px 12px",
      borderRadius: "4px",
      border: `1px solid ${isDark ? "#4b5563" : "#cbd5e1"}`,
      color: isDark ? "#e5e7eb" : "#334155",
      backgroundColor: "transparent",
      cursor: "pointer",
      fontSize: "12px",
      transition: "all 0.2s ease",
      whiteSpace: "nowrap",
    },
    smallSuccessBtn: {
      padding: "6px 12px",
      borderRadius: "4px",
      border: "none",
      color: "#fff",
      backgroundColor: "#10b981",
      cursor: "default",
      fontSize: "12px",
      transition: "all 0.2s ease",
      whiteSpace: "nowrap",
    },
    smallDeleteBtn: {
      padding: "6px 12px",
      borderRadius: "4px",
      border: "1px solid #ef4444",
      color: "#fca5a5",
      backgroundColor: "transparent",
      cursor: "pointer",
      fontSize: "12px",
      transition: "all 0.2s ease",
      whiteSpace: "nowrap",
    },
    smallDeleteDisabledBtn: {
      padding: "6px 12px",
      borderRadius: "4px",
      border: "1px solid #ef4444",
      color: "#fca5a5",
      backgroundColor: "rgba(239, 68, 68, 0.1)",
      cursor: "not-allowed",
      fontSize: "12px",
      whiteSpace: "nowrap",
    },
    smallDeleteConfirmBtn: {
      padding: "6px 12px",
      borderRadius: "4px",
      border: "none",
      color: "#fff",
      backgroundColor: "#ef4444",
      cursor: "pointer",
      fontSize: "12px",
      transition: "all 0.2s ease",
      whiteSpace: "nowrap",
    },
    loginPage: {
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      backgroundImage: isDark
        ? "linear-gradient(135deg, #0b0f19 0%, #171033 100%)"
        : "linear-gradient(135deg, #eef4ff 0%, #f8fafc 100%)",
      padding: "20px",
      boxSizing: "border-box",
      overflowX: "hidden",
    },
    loginCard: {
      width: "100%",
      maxWidth: "420px",
      textAlign: "center",
      backgroundColor: isDark ? "#161b2c" : "#ffffff",
      color: isDark ? "#e2e8f0" : "#0f172a",
      padding: "24px 20px 40px",
      borderRadius: "20px",
      border: `1px solid ${isDark ? "#2d3748" : "#dbe3ee"}`,
      boxShadow: isDark
        ? "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
        : "0 20px 40px rgba(15,23,42,0.12)",
      boxSizing: "border-box",
      position: "relative",
    },
    loginThemeRow: {
      display: "flex",
      justifyContent: "flex-end",
      marginBottom: "12px",
    },
    largeBtn: {
      width: "100%",
      padding: "16px",
      borderRadius: "30px",
      border: "none",
      backgroundImage: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
      color: "#fff",
      fontSize: "16px",
      fontWeight: "bold",
      cursor: "pointer",
      marginTop: "20px",
      transition: "all 0.3s ease",
    },
    disabledBtn: { opacity: 0.7, cursor: "not-allowed" },
    themeToggleBtn: {
      padding: "8px 14px",
      borderRadius: "999px",
      border: `1px solid ${isDark ? "#4b5563" : "#cbd5e1"}`,
      backgroundColor: isDark ? "#0f172a" : "#f8fafc",
      color: isDark ? "#e5e7eb" : "#334155",
      cursor: "pointer",
      fontSize: "13px",
      fontWeight: "600",
      transition: "all 0.2s ease",
    },
    themeToggleCompact: {
      minWidth: "110px",
      justifyContent: "center",
      display: "inline-flex",
      alignItems: "center",
    },
  };
};

function App() {
  const auth = useAuth();

  const [theme, setTheme] = useState(getInitialTheme);
  const [longUrl, setLongUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  const [myUrls, setMyUrls] = useState([]);
  const [isFetchingUrls, setIsFetchingUrls] = useState(false);
  const [showLinks, setShowLinks] = useState(false);

  const [copiedLinkId, setCopiedLinkId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const styles = createStyles(theme);

  useEffect(() => {
    document.title = "HACKACK'S URL Shortener";
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.body.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    let timer;
    if (shortUrl !== "" || errorMessage !== "") {
      timer = setTimeout(() => {
        setShortUrl("");
        setErrorMessage("");
      }, 5000);
    }

    return () => clearTimeout(timer);
  }, [shortUrl, errorMessage]);

  const fetchMyUrls = useCallback(async () => {
    setIsFetchingUrls(true);
    try {
      const response = await fetch(GET_URLS_ENDPOINT, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${auth.user?.id_token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setMyUrls(data.urls || []);
      } else {
        console.error("Failed to load URLs:", data.error);
      }
    } catch (error) {
      console.error("Error fetching URLs:", error);
    } finally {
      setIsFetchingUrls(false);
    }
  }, [auth.user?.id_token]);

  const handleLoadLinks = () => {
    setShowLinks(true);
    fetchMyUrls();
  };

  const handleShortenUrl = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    setShortUrl("");
    setCopySuccess(false);

    let isValidUrl = false;
    try {
      const parsed = new URL(longUrl);
      const isHttp = parsed.protocol === "http:" || parsed.protocol === "https:";
      const hasDot = parsed.hostname.includes(".");

      if (isHttp && hasDot) {
        isValidUrl = true;
      }
    } catch (_) {
      isValidUrl = false;
    }

    if (!isValidUrl) {
      setErrorMessage("Please enter a valid web address (e.g., https://example.com)");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.user?.id_token}`,
        },
        body: JSON.stringify({ long_url: longUrl }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to shorten URL");

      setShortUrl(`https://tiny.hackack.tech/${data.short_code}`);

      if (showLinks) {
        fetchMyUrls();
      }
      setLongUrl("");
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUrl = async (shortCode) => {
    setIsDeleting(shortCode);
    try {
      const response = await fetch(`${DELETE_ENDPOINT}/${shortCode}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${auth.user?.id_token}`,
        },
      });

      if (response.ok) {
        setMyUrls((prevUrls) => prevUrls.filter((url) => url.shortCode !== shortCode));
        setConfirmDeleteId(null);
      } else {
        const data = await response.json();
        alert(`Failed to delete: ${data.error}`);
      }
    } catch (error) {
      console.error("Error deleting URL:", error);
      alert("An unexpected error occurred while deleting.");
    } finally {
      setIsDeleting(null);
    }
  };

  const copyToClipboard = (textToCopy) => {
    navigator.clipboard.writeText(textToCopy);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const copyTableRowContent = (textToCopy, id) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedLinkId(id);
    setTimeout(() => setCopiedLinkId(null), 2000);
  };

  const handleSignOut = () => {
    auth.removeUser();
  };

  const handleLoginClick = () => {
    setIsRedirecting(true);
    auth.signinRedirect({
      extraQueryParams: {
        prompt: "login",
      },
    });
  };

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  };

  if (auth.isAuthenticated) {
    return (
      <div style={styles.container}>
        <nav style={styles.nav}>
          <div style={styles.logoContainer}>
            <img src={myLogo} alt="HackAck Logo" style={styles.logoImg} />
            <span style={styles.logoText}>HACKACK'S URL Shortener</span>
          </div>
          <div style={styles.userInfo}>
            <button
              onClick={toggleTheme}
              style={{ ...styles.themeToggleBtn, ...styles.themeToggleCompact }}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
            <span style={styles.userEmail}>{auth.user?.profile.email}</span>
            <button onClick={handleSignOut} style={styles.outlineBtn}>
              Sign Out
            </button>
          </div>
        </nav>

        <main style={styles.main}>
          <div style={styles.contentWrapper}>
            <div style={styles.card}>
              <h1 style={styles.title}>Shorten a long URL</h1>
              <p style={styles.subtitle}>
                Enter your link below to create a clean, trackable short URL.
              </p>

              <form onSubmit={handleShortenUrl} style={styles.form}>
                <input
                  type="url"
                  placeholder="https://example.com/very-long-link..."
                  value={longUrl}
                  onChange={(e) => {
                    setLongUrl(e.target.value);
                    setShortUrl("");
                    setErrorMessage("");
                  }}
                  required
                  style={styles.input}
                />
                <button type="submit" disabled={isLoading} style={styles.primaryBtn}>
                  {isLoading ? "Processing..." : "Shorten Now"}
                </button>
              </form>

              {errorMessage && <div style={styles.errorBox}>⚠️ {errorMessage}</div>}

              {shortUrl && (
                <div style={styles.successBox}>
                  <p style={styles.successLabel}>Your short link is ready:</p>
                  <div style={styles.resultRow}>
                    <input readOnly value={shortUrl} style={styles.resultInput} />
                    <button
                      onClick={() => copyToClipboard(shortUrl)}
                      style={
                        copySuccess
                          ? { ...styles.copyBtnSuccess, ...styles.popAnimation }
                          : styles.copyBtn
                      }
                    >
                      {copySuccess ? "✓ Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div style={styles.linksCard}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>My Recent Links</h2>
                {!showLinks ? (
                  <button onClick={handleLoadLinks} style={styles.secondaryBtn}>
                    Load My Links
                  </button>
                ) : (
                  <button onClick={fetchMyUrls} style={styles.smallOutlineBtn}>
                    Refresh List
                  </button>
                )}
              </div>

              {showLinks && (
                <>
                  {isFetchingUrls ? (
                    <p style={styles.loadingText}>Loading your links...</p>
                  ) : myUrls.length === 0 ? (
                    <p style={styles.emptyText}>
                      You haven't shortened any links yet.
                    </p>
                  ) : (
                    <div style={styles.tableContainer}>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th style={styles.th}>Original URL</th>
                            <th style={styles.th}>Short Link</th>
                            <th style={styles.th}>Clicks</th>
                            <th style={styles.th}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {myUrls.map((item) => {
                            const fullShortUrl = `https://tiny.hackack.tech/${item.shortCode}`;
                            const isThisRowCopied = copiedLinkId === item.shortCode;
                            const isThisRowDeleting = isDeleting === item.shortCode;

                            return (
                              <tr key={item.shortCode} style={styles.tr}>
                                <td style={styles.td}>
                                  <span style={styles.urlText} title={item.long_url}>
                                    {item.long_url}
                                  </span>
                                </td>
                                <td style={styles.td}>
                                  <a
                                    href={fullShortUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={styles.link}
                                  >
                                    {fullShortUrl}
                                  </a>
                                </td>
                                <td style={styles.td}>
                                  <span style={styles.clickBadge}>
                                    {item.clickCount || 0}
                                  </span>
                                </td>
                                <td style={styles.td}>
                                  <div style={styles.actionGroup}>
                                    <button
                                      onClick={() =>
                                        copyTableRowContent(fullShortUrl, item.shortCode)
                                      }
                                      style={
                                        isThisRowCopied
                                          ? {
                                              ...styles.smallSuccessBtn,
                                              ...styles.popAnimation,
                                            }
                                          : styles.smallOutlineBtn
                                      }
                                      disabled={isThisRowDeleting}
                                    >
                                      {isThisRowCopied ? "✓ Copied" : "Copy"}
                                    </button>

                                    {confirmDeleteId === item.shortCode ? (
                                      <>
                                        <button
                                          onClick={() => handleDeleteUrl(item.shortCode)}
                                          style={styles.smallDeleteConfirmBtn}
                                          disabled={isThisRowDeleting}
                                        >
                                          {isThisRowDeleting ? "..." : "Yes, Delete"}
                                        </button>
                                        <button
                                          onClick={() => setConfirmDeleteId(null)}
                                          style={styles.smallOutlineBtn}
                                          disabled={isThisRowDeleting}
                                        >
                                          Cancel
                                        </button>
                                      </>
                                    ) : (
                                      <button
                                        onClick={() => setConfirmDeleteId(item.shortCode)}
                                        style={
                                          isThisRowDeleting
                                            ? styles.smallDeleteDisabledBtn
                                            : styles.smallDeleteBtn
                                        }
                                        disabled={isThisRowDeleting}
                                      >
                                        {isThisRowDeleting ? "..." : "Delete"}
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  const isAuthProcessing = isRedirecting || auth.isLoading;

  return (
    <div style={styles.loginPage}>
      <div style={styles.loginCard}>
        <div style={styles.loginThemeRow}>
          <button
            onClick={toggleTheme}
            style={styles.themeToggleBtn}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
        </div>
        <img src={myLogo} alt="HackAck Logo" style={styles.bigLogoImg} />
        <h1 style={styles.title}>HACKACK'S URL Shortener</h1>
        <p style={styles.subtitle}>
          The professional URL shortener powered by React and AWS(API
          Gateway,Lambda,DynamoDB)
        </p>
        <button
          onClick={handleLoginClick}
          disabled={isAuthProcessing}
          style={
            isAuthProcessing
              ? { ...styles.largeBtn, ...styles.disabledBtn }
              : styles.largeBtn
          }
        >
          {isAuthProcessing ? "Authenticating, please wait..." : "Get Started — Sign In"}
        </button>
      </div>
    </div>
  );
}

export default App;
