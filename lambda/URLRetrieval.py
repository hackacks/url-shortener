# URLRetrieval.py
import json
import os
import boto3
import decimal
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError

# Helper class to convert DynamoDB Decimals to standard Python numbers ---
class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, decimal.Decimal):
            # Convert to int if it's a whole number (like our click counts)
            if obj % 1 == 0:
                return int(obj)
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

dynamodb = boto3.resource('dynamodb')
TABLE_NAME = os.environ.get('TABLE_NAME', 'url-shortner')
table = dynamodb.Table(TABLE_NAME)

def lambda_handler(event, context):
    try:
        claims = event['requestContext']['authorizer']['jwt']['claims']
        user_id = claims['sub']
    except (KeyError, TypeError):
        return {
            'statusCode': 401,
            'body': json.dumps({'error': 'Unauthorized. Please valid login.'})
        }
    
    try:
        response = table.query(
            IndexName='userId-index',
            KeyConditionExpression=Key('userId').eq(user_id),
            # --- NEW: Added clickCount to the projection string ---
            ProjectionExpression="shortCode, long_url, createdAt, clickCount", 
            ScanIndexForward=False
        )

        items = response.get('Items', [])

        # Format missing clickCounts for older URLs that were created before this update
        for item in items:
            if 'clickCount' not in item:
                item['clickCount'] = 0

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
            },
            'body': json.dumps({
                'message': 'Success',
                'urls': items
            }, cls=DecimalEncoder)
        }
        
    except ClientError as e:
        print(f"DynamoDB Error: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Failed to retrieve URLs.'})
        }
    except Exception as e:
        print(f"Unexpected Error: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'An internal server error occurred.'})
        }
