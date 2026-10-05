import json
import os
import re
import boto3
from botocore.exceptions import ClientError

dynamodb = boto3.resource('dynamodb')
TABLE_NAME = os.environ.get('TABLE_NAME', 'url-shortner')
table = dynamodb.Table(TABLE_NAME)

def lambda_handler(event, context):
    # 1. Extract User ID from HTTP API JWT Claims
    try:
        # HTTP API structure for JWT
        user_id = event['requestContext']['authorizer']['jwt']['claims']['sub']
    except (KeyError, TypeError):
        return {
            'statusCode': 401,
            'body': json.dumps({'error': 'Please login to your account.'})
        }

   # 2. Get shortCode from Path Parameters
    short_code = event.get('pathParameters', {}).get('shortCode')

    # 3. Enhanced Validation: Exactly 6 alphanumeric characters
    # ^[a-zA-Z0-9]{6}$ ensures start-to-finish match of exactly 6 chars
    if not short_code or not re.match(r'^[a-zA-Z0-9]{6}$', short_code):
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Invalid shortCode.'})
        }

    # 4. Perform Secure Conditional Delete
    try:
        table.delete_item(
            Key={'shortCode': short_code},
            ConditionExpression="userId = :owner",
            ExpressionAttributeValues={":owner": user_id}
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({'message': f'Successfully deleted {short_code}'})
        }
        
    except ClientError as e:
        if e.response['Error']['Code'] == "ConditionalCheckFailedException":
            # Either the link doesn't exist, or it belongs to someone else
            return {
                'statusCode': 403,
                'body': json.dumps({'error': 'link not found.'})
            }
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
