import json
import sys
sys.path.insert(0, '..')

from amprem_client import send_link, verify_link

def handler(request):
    path = request.get('path', '/')
    method = request.get('method', 'GET')
    query = request.get('query', {})
    body = request.get('body', '')
    headers = request.get('headers', {})

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': ''
        }

    if path == '/api/health' and method == 'GET':
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'status': 'ok',
                'service': 'kograph-activator',
                'version': '1.0.1',
                'runtime': 'python',
                'endpoints': ['/api/send-link', '/api/verify-link']
            })
        }

    if path == '/api/send-link' and method == 'POST':
        try:
            if isinstance(body, str):
                body_data = json.loads(body) if body else {}
            elif isinstance(body, dict):
                body_data = body
            else:
                body_data = {}
        except Exception as e:
            print(f'Body parse error: {e}')
            body_data = {}

        email = body_data.get('email', '').strip()

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
                    'debug': {'email': email or '(empty)', 'body': str(body_data)}
                })
            }

        try:
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

    if path == '/api/verify-link' and method == 'POST':
        try:
            if isinstance(body, str):
                body_data = json.loads(body) if body else {}
            elif isinstance(body, dict):
                body_data = body
            else:
                body_data = {}
        except Exception as e:
            print(f'Body parse error: {e}')
            body_data = {}

        email = body_data.get('email', '').strip()
        link = body_data.get('link', '').strip()

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
                        'body': str(body_data)
                    }
                })
            }

        try:
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

    return {
        'statusCode': 404,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'status': False, 'message': 'Not found'})
    }
