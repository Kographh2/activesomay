import json

def handler(request):
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
