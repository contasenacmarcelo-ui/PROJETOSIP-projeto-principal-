#!/usr/bin/env python3
"""
Script para criar usuário admin no banco de dados
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backend.database import create_app
from backend.models import db, Usuario

def criar_admin():
    """Cria um usuário admin no banco de dados"""
    app = create_app()
    
    with app.app_context():
        # Verificar se admin já existe
        admin_existente = Usuario.query.filter_by(email='admin@sip.com').first()
        if admin_existente:
            print("✓ Admin já existe no banco de dados")
            print(f"  Email: {admin_existente.email}")
            print(f"  Nome: {admin_existente.nome}")
            print(f"  Role: {admin_existente.role}")
            return
        
        # Criar novo admin
        admin = Usuario(
            email='admin@sip.com',
            nome='Administrador SIP',
            telefone='+55 11 9999-9999',
            status='ativo',
            role='admin'
        )
        admin.set_senha('admin123')  # Senha padrão - MUDAR EM PRODUÇÃO
        
        db.session.add(admin)
        db.session.commit()
        
        print("✓ Usuário admin criado com sucesso!")
        print(f"  Email: admin@sip.com")
        print(f"  Senha: admin123")
        print(f"  URL admin: http://localhost:5000/public/pages/admia.html")

if __name__ == '__main__':
    criar_admin()
