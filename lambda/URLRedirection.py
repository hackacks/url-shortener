# URLRedirection.py
import os
import boto3
from botocore.exceptions import ClientError

dynamodb = boto3.resource('dynamodb')
TABLE_NAME = os.environ.get('TABLE_NAME', 'url-shortner')
table = dynamodb.Table(TABLE_NAME)

FALLBACK_URL = os.environ.get('FALLBACK_URL', '')

def create_redirect_response(destination_url, cache=False):
    if cache:
        headers = {
            'Location': destination_url,
            'Cache-Control': 'public, max-age=86400' 
        }
    else:
        headers = {
            'Location': destination_url,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }
        
    return {
        'statusCode': 302,
        'headers': headers
    }

def lambda_handler(event, context):
    short_code = None
    
    path_parameters = event.get('pathParameters')
    if path_parameters and 'shortCode' in path_parameters:
        short_code = path_parameters['shortCode']
    else:
        raw_path = event.get('rawPath', '')
        short_code = raw_path.strip('/') 

    if not short_code or len(short_code) != 6:
        print(f"Gatekeeper blocked invalid path: '/{short_code}'.")
        return create_redirect_response(FALLBACK_URL, cache=True)

    try:
        response = table.update_item(
            Key={'shortCode': short_code},
            UpdateExpression="SET clickCount = if_not_exists(clickCount, :start) + :inc",
            ConditionExpression="attribute_exists(shortCode)",
            ExpressionAttributeValues={
                ':inc': 1,
                ':start': 0
            },
            ReturnValues="ALL_NEW" 
        )
        
        long_url = response['Attributes'].get('long_url')
        return create_redirect_response(long_url, cache=False)
            
    except ClientError as e:
        if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
            print(f"URL not found for shortCode: {short_code}")
            return create_redirect_response(FALLBACK_URL, cache=False)
        else:
            print(f"DynamoDB Error: {e}")
            return create_redirect_response(FALLBACK_URL, cache=False)
