#!/usr/bin/env python3
"""
Script para iniciar o servidor Flask da API SIP
"""

from backend.app import app

if __name__ == '__main__':
    print("🚀 Iniciando SIP Backend API...")
    print("📍 URL: http://localhost:5000")
    print("📚 Documentação: http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)