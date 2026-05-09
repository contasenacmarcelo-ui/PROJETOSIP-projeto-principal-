#!/usr/bin/env python3
"""
Script para recriar banco com nova estrutura criptografada
"""

from backend.database import create_app
from backend.models import db, Usuario
import os
import shutil

def recriar_banco():
    """Recria o banco com nova estrutura"""
    app = create_app()

    with app.app_context():
        # Fazer backup do banco antigo
        db_path = app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')
        if os.path.exists(db_path):
            backup_path = db_path + '.backup'
            shutil.copy2(db_path, backup_path)
            print(f"✅ Backup criado: {backup_path}")

        # Dropar todas as tabelas e recriar
        print("🔄 Recriando tabelas...")
        db.drop_all()
        db.create_all()

        print("🆕 Criando admin...")
        admin = Usuario(
            email='admin@sip.com',
            nome='Administrador SIP',
            role='admin',
            status='ativo'
        )
        admin.set_senha('admin123')
        db.session.add(admin)
        db.session.commit()

        print(f"✅ Admin criado: {admin.email}")
        print("✅ Banco recriado com sucesso!")
        print("⚠️  Usuários antigos precisam se recadastrar")

if __name__ == '__main__':
    recriar_banco()