import json
import sys
sys.path.insert(0, '..')

from amprem_client import send_link

def handler(request):
    try:
        if request.method != 'POST':
            return {
                'statusCode': 405,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                },
                'body': json.dumps({'status': False, 'message': 'Method not allowed'})
            }
        
        if request.method == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                },
                'body': ''
            }
        
        body = {}
        try:
            if hasattr(request, 'body') and request.body:
                if isinstance(request.body, str):
                    body = json.loads(request.body)
                elif isinstance(request.body, dict):
                    body = request.body
        except Exception as e:
            print(f'Body parse error: {e}')
            body = {}
        
        email = body.get('email', '').strip()
        
        if not email or '@' not in email:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'status': False,
                    'message': 'Email tidak valid atau kosong',
                    'debug': {'email': email or '(empty)', 'body': str(body)}
                })
            }
        
        print(f'Sending link to: {email}')
        result = send_link(email)
        print(f'Result: {result}')
        
        return {
            'statusCode': 200 if result.get('status') else 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(result)
        }
        
    except Exception as e:
        print(f'send-link error: {e}', exc_info=True)
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'status': False,
                'message': str(e) or 'Gagal mengirim link'
            })
        }
