#!/usr/bin/env python3
"""
Teste de cadastro e login
"""

import requests
import json

def testar_cadastro():
    print('Testando cadastro...')
    try:
        response = requests.post('http://localhost:5000/api/auth/cadastro',
                               json={'email': 'teste@teste.com', 'senha': '123456', 'nome': 'Teste'})
        print(f'Cadastro - Status: {response.status_code}')
        if response.status_code == 201:
            print('✅ Cadastro funcionando!')
            return True
        else:
            print(f'❌ Erro: {response.text}')
            return False
    except Exception as e:
        print(f'❌ Erro de conexão: {e}')
        return False

def testar_login():
    print('Testando login...')
    try:
        response = requests.post('http://localhost:5000/api/auth/login',
                               json={'email': 'teste@teste.com', 'senha': '123456'})
        print(f'Login - Status: {response.status_code}')
        if response.status_code == 200:
            print('✅ Login funcionando!')
            data = response.json()
            token = data.get('access_token')
            if token:
                print('✅ Token recebido!')
                return token
            else:
                print('❌ Token não recebido')
                return None
        else:
            print(f'❌ Erro: {response.text}')
            return None
    except Exception as e:
        print(f'❌ Erro de conexão: {e}')
        return None

def testar_login_admin():
    print('Testando login admin...')
    try:
        response = requests.post('http://localhost:5000/api/auth/login',
                               json={'email': 'admin@sip.com', 'senha': 'admin123'})
        print(f'Login Admin - Status: {response.status_code}')
        if response.status_code == 200:
            print('✅ Login admin funcionando!')
            data = response.json()
            token = data.get('access_token')
            if token:
                print('✅ Token admin recebido!')
                return token
            else:
                print('❌ Token admin não recebido')
                return None
        else:
            print(f'❌ Erro: {response.text}')
            return None
    except Exception as e:
        print(f'❌ Erro de conexão: {e}')
        return None

if __name__ == '__main__':
    testar_cadastro()
    testar_login()
    testar_login_admin()