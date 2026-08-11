import json
import sys
sys.path.insert(0, '..')

from amprem_client import verify_link

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
        link = body.get('link', '').strip()
        
        if not email or not link:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'status': False,
                    'message': 'Email dan Magic Link wajib diisi',
                    'debug': {
                        'email': email or '(empty)',
                        'link': link or '(empty)',
                        'body': str(body)
                    }
                })
            }
        
        print(f'Verifying link for: {email}')
        result = verify_link(email, link)
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
        print(f'verify-link error: {e}', exc_info=True)
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'status': False,
                'message': str(e) or 'Gagal memverifikasi link'
            })
        }
