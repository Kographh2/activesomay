import re
import json
import requests
from Crypto.Cipher import AES

BASE_URL = 'https://alight-motion-premium.site.je'
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
}

def to_numbers(hex_str):
    return bytes.fromhex(hex_str)

def to_hex(data):
    return data.hex()

def extract_aes_params(html):
    patterns = {
        'key': r'a=toNumbers\("([^"]+)"\)',
        'iv': r'b=toNumbers\("([^"]+)"\)',
        'encrypted': r'c=toNumbers\("([^"]+)"\)'
    }
    
    params = {}
    for name, pattern in patterns.items():
        match = re.search(pattern, html)
        if not match:
            raise Exception(f'Gagal mengekstrak parameter AES ({name}) dari server')
        params[name] = match.group(1)
    
    return params['key'], params['iv'], params['encrypted']

def decrypt_aes(key_hex, iv_hex, encrypted_hex):
    try:
        key = to_numbers(key_hex)
        iv = to_numbers(iv_hex)
        encrypted = to_numbers(encrypted_hex)
        
        cipher = AES.new(key, AES.MODE_CBC, iv)
        decrypted = cipher.decrypt(encrypted)
        return to_hex(decrypted)
    except Exception as e:
        raise Exception(f'Gagal decrypt AES: {str(e)}')

def get_cookie():
    try:
        session = requests.Session()
        session.headers.update(HEADERS)
        
        resp = session.get(BASE_URL, timeout=30)
        resp.raise_for_status()
        
        key, iv, encrypted = extract_aes_params(resp.text)
        decrypted_hex = decrypt_aes(key, iv, encrypted)
        return decrypted_hex
    except Exception as e:
        raise Exception(f'Gagal mendapatkan cookie: {str(e)}')

def send_link(email):
    try:
        cookie = get_cookie()
        
        session = requests.Session()
        session.headers.update({
            **HEADERS,
            'Cookie': f'__test={cookie}',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Origin': BASE_URL,
            'Referer': BASE_URL + '/'
        })
        
        resp = session.post(
            BASE_URL + '/index.php?action=send_eceran',
            data={'email': email},
            timeout=30
        )
        
        text = resp.text.strip()
        
        try:
            data = json.loads(text)
            if isinstance(data, dict):
                if data.get('status') == True or data.get('status') == 'true':
                    return {
                        'status': True,
                        'message': data.get('message', 'Link verifikasi berhasil dikirim'),
                        'email': email
                    }
                else:
                    return {
                        'status': False,
                        'message': data.get('message', 'Gagal mengirim link')
                    }
        except json.JSONDecodeError:
            pass
        
        if 'success' in text.lower() or 'sent' in text.lower() or 'terkirim' in text.lower():
            return {
                'status': True,
                'message': 'Link verifikasi berhasil dikirim',
                'email': email
            }
        elif 'error' in text.lower() or 'gagal' in text.lower() or 'already' in text.lower():
            return {
                'status': False,
                'message': text
            }
        
        return {
            'status': False,
            'message': text or 'Gagal mengirim link'
        }
        
    except Exception as e:
        raise Exception(f'Gagal mengirim link: {str(e)}')

def verify_link(email, link):
    try:
        cookie = get_cookie()
        
        session = requests.Session()
        session.headers.update({
            **HEADERS,
            'Cookie': f'__test={cookie}',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Origin': BASE_URL,
            'Referer': BASE_URL + '/'
        })
        
        resp = session.post(
            BASE_URL + '/index.php?action=verify_eceran',
            data={'email': email, 'link': link},
            timeout=30
        )
        
        text = resp.text.strip()
        
        try:
            data = json.loads(text)
            if isinstance(data, dict):
                if data.get('status') == True or data.get('status') == 'true':
                    return {
                        'status': True,
                        'message': data.get('message', 'Lisensi premium berhasil diaktifkan'),
                        'premium': data.get('premium', True),
                        'expiryDate': data.get('expiryDate')
                    }
                else:
                    return {
                        'status': False,
                        'message': data.get('message', 'Verifikasi gagal')
                    }
        except json.JSONDecodeError:
            pass
        
        if 'success' in text.lower() or 'activated' in text.lower() or 'premium' in text.lower():
            return {
                'status': True,
                'message': 'Lisensi premium berhasil diaktifkan',
                'premium': True
            }
        elif 'error' in text.lower() or 'gagal' in text.lower() or 'invalid' in text.lower() or 'expired' in text.lower():
            return {
                'status': False,
                'message': text
            }
        
        return {
            'status': False,
            'message': text or 'Verifikasi gagal'
        }
        
    except Exception as e:
        raise Exception(f'Gagal memverifikasi link: {str(e)}')
