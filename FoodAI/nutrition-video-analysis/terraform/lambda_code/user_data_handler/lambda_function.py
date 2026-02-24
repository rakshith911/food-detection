"""
User Data Handler Lambda
Manages per-user data backup/restore to S3.

Routes:
  PUT  /user-data/{userId}/{dataType}  — Save JSON to S3 at UKcal/{userId}/{dataType}.json
  GET  /user-data/{userId}/{dataType}  — Read JSON from S3 at UKcal/{userId}/{dataType}.json

dataType must be one of: profile, history, settings
"""

import json
import os
import boto3
from botocore.exceptions import ClientError

s3 = boto3.client('s3')

BUCKET = os.environ.get('USER_DATA_BUCKET', 'ukcal-user-uploads')
S3_PREFIX = os.environ.get('S3_PREFIX', 'UKcal')
ALLOWED_DATA_TYPES = {'profile', 'history', 'settings'}
MAX_BODY_SIZE = 5 * 1024 * 1024  # 5 MB limit per data type


def _cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
    }


def _response(status_code, body):
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            **_cors_headers(),
        },
        'body': json.dumps(body) if not isinstance(body, str) else body,
    }


def lambda_handler(event, context):
    http_method = event.get('httpMethod', '')
    path_params = event.get('pathParameters') or {}

    # Handle CORS preflight
    if http_method == 'OPTIONS':
        return _response(200, {'message': 'OK'})

    user_id = path_params.get('userId', '')
    data_type = path_params.get('dataType', '')

    # Validate path parameters
    if not user_id:
        return _response(400, {'error': 'Missing userId'})

    if data_type not in ALLOWED_DATA_TYPES:
        return _response(400, {
            'error': f'Invalid dataType: {data_type}. Must be one of: {", ".join(sorted(ALLOWED_DATA_TYPES))}'
        })

    s3_key = f'{S3_PREFIX}/{user_id}/{data_type}.json'

    if http_method == 'PUT':
        return _handle_put(s3_key, event, user_id, data_type)
    elif http_method == 'GET':
        return _handle_get(s3_key, user_id, data_type)
    else:
        return _response(405, {'error': f'Method not allowed: {http_method}'})


def _handle_put(s3_key, event, user_id, data_type):
    """Save JSON data to S3."""
    body = event.get('body', '')
    if not body:
        return _response(400, {'error': 'Empty request body'})

    # Check size limit
    if len(body) > MAX_BODY_SIZE:
        return _response(413, {'error': f'Body too large. Max size: {MAX_BODY_SIZE} bytes'})

    # Validate JSON
    try:
        json.loads(body)
    except (json.JSONDecodeError, TypeError):
        return _response(400, {'error': 'Invalid JSON body'})

    try:
        s3.put_object(
            Bucket=BUCKET,
            Key=s3_key,
            Body=body,
            ContentType='application/json',
            ServerSideEncryption='aws:kms',
        )
        print(f'[UserData] Saved {data_type} for user {user_id} -> s3://{BUCKET}/{s3_key}')
        return _response(200, {
            'message': f'{data_type} saved successfully',
            'key': s3_key,
        })
    except ClientError as e:
        print(f'[UserData] S3 PutObject error: {e}')
        return _response(500, {'error': 'Failed to save data'})


def _handle_get(s3_key, user_id, data_type):
    """Read JSON data from S3."""
    try:
        response = s3.get_object(Bucket=BUCKET, Key=s3_key)
        body = response['Body'].read().decode('utf-8')
        print(f'[UserData] Retrieved {data_type} for user {user_id} from s3://{BUCKET}/{s3_key}')
        # Return the raw JSON body directly (it's already valid JSON)
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                **_cors_headers(),
            },
            'body': body,
        }
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == 'NoSuchKey':
            print(f'[UserData] No {data_type} found for user {user_id}')
            return _response(404, {'error': f'No {data_type} data found'})
        print(f'[UserData] S3 GetObject error: {e}')
        return _response(500, {'error': 'Failed to retrieve data'})
