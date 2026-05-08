#!/usr/bin/env python3
"""
Script para migrar dados existentes para o novo sistema de criptografia
"""

from backend.database import create_app
from backend.models import db, Usuario
import os

def migrate_existing_data():
    """Migra dados existentes para criptografia"""
    app = create_app()

    with app.app_context():
        # Buscar usuários existentes
        usuarios = Usuario.query.all()

        for usuario in usuarios:
            # Se email/telefone não estão criptografados (não contêm caracteres especiais)
            if usuario.email and not any(c in usuario.email for c in ['/', '+', '=']):
                print(f"Migrando usuário: {usuario.email}")
                # Re-setar para acionar criptografia
                email_temp = usuario.email
                telefone_temp = usuario.telefone

                # Limpar campos
                usuario.email_criptografado = None
                usuario.telefone_criptografado = None

                # Re-atribuir para criptografar
                usuario.email = email_temp
                usuario.telefone = telefone_temp

        try:
            db.session.commit()
            print("Migração concluída com sucesso!")
        except Exception as e:
            db.session.rollback()
            print(f"Erro na migração: {e}")

if __name__ == '__main__':
    migrate_existing_data()