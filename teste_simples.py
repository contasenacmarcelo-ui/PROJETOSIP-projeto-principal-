#!/usr/bin/env python3
"""
Teste simples
"""

print("Teste 1: Importando módulos...")
try:
    from backend.database import create_app
    from backend.models import db, Usuario
    print("✅ Módulos importados com sucesso")
except Exception as e:
    print(f"❌ Erro ao importar: {e}")
    exit(1)

print("Teste 2: Criando app...")
try:
    app = create_app()
    print("✅ App criado com sucesso")
except Exception as e:
    print(f"❌ Erro ao criar app: {e}")
    exit(1)

print("Teste 3: Testando contexto...")
try:
    with app.app_context():
        # Verificar se admin existe
        from cryptography.fernet import Fernet
        import base64
        import os

        def get_encryption_key():
            key = os.getenv('ENCRYPTION_KEY', 'default-encryption-key-change-in-production-32-chars')
            return base64.urlsafe_b64encode(key.encode()[:32])

        cipher = Fernet(get_encryption_key())
        email_criptografado = cipher.encrypt('admin@sip.com'.encode()).decode()

        admin = Usuario.query.filter_by(email_criptografado=email_criptografado).first()
        if admin:
            print(f"✅ Admin encontrado: {admin.email} (ID: {admin.id})")
        else:
            print("❌ Admin não encontrado, criando...")
            admin = Usuario(
                email='admin@sip.com',
                nome='Administrador',
                role='admin'
            )
            admin.set_senha('admin123')
            db.session.add(admin)
            db.session.commit()
            print(f"✅ Admin criado: {admin.email} (ID: {admin.id})")
except Exception as e:
    print(f"❌ Erro no contexto: {e}")

print("Teste concluído!")