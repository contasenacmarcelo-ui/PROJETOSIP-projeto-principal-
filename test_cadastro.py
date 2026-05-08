#!/usr/bin/env python3
"""
Script para testar o cadastro de usuários
"""

import requests
import json

def testar_cadastro():
    url = "http://localhost:5000/api/auth/cadastro"

    dados = {
        "nome": "Usuário Teste",
        "email": "teste@exemplo.com",
        "telefone": "11999999999",
        "senha": "123456"
    }

    try:
        response = requests.post(url, json=dados, headers={'Content-Type': 'application/json'})

        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")

        if response.status_code == 201:
            print("✅ Cadastro realizado com sucesso!")
        else:
            print("❌ Erro no cadastro")

    except Exception as e:
        print(f"Erro: {e}")

def testar_login():
    url = "http://localhost:5000/api/auth/login"

    dados = {
        "email": "teste@exemplo.com",
        "senha": "123456"
    }

    try:
        response = requests.post(url, json=dados, headers={'Content-Type': 'application/json'})

        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")

        if response.status_code == 200:
            print("✅ Login realizado com sucesso!")
            return response.json().get('access_token')
        else:
            print("❌ Erro no login")

    except Exception as e:
        print(f"Erro: {e}")

if __name__ == "__main__":
    print("🧪 Testando cadastro...")
    testar_cadastro()

    print("\n🔐 Testando login...")
    token = testar_login()

    if token:
        print(f"Token obtido: {token[:50]}...")