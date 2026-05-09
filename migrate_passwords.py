#!/usr/bin/env python3
"""
Script para criar admin com senha Argon2
"""

from backend.database import create_app
from backend.models import db, Usuario

def criar_admin_argon2():
    """Cria admin com senha Argon2"""
    app = create_app()

    with app.app_context():
        # Verificar se admin já existe
        from cryptography.fernet import Fernet
        import base64
        import os

        def get_encryption_key():
            key = os.getenv('ENCRYPTION_KEY', 'default-encryption-key-change-in-production-32-chars')
            return base64.urlsafe_b64encode(key.encode()[:32])

        cipher = Fernet(get_encryption_key())
        email_criptografado = cipher.encrypt('admin@sip.com'.encode()).decode()

        admin_existente = Usuario.query.filter_by(email_criptografado=email_criptografado).first()

        if admin_existente:
            print(f"✅ Admin já existe: {admin_existente.email}")
            # Re-hash senha se necessário
            if not admin_existente.senha_hash.startswith('$argon2'):
                print("🔄 Re-hash senha do admin...")
                admin_existente.set_senha('admin123')
                db.session.commit()
                print("✅ Senha do admin atualizada")
        else:
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

if __name__ == '__main__':
    criar_admin_argon2()