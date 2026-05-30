from flask import Flask
import os

from .models import db
from .config import Config

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)

    with app.app_context():
        db.create_all()

        # Seed do admin padrão (para ambientes limpos como Render)
        from .auth import criar_usuario

        ADMIN_EMAIL = os.getenv('DEFAULT_ADMIN_EMAIL', 'admin@sip.local').lower()
        ADMIN_NOME = os.getenv('DEFAULT_ADMIN_NAME', 'Administrador')
        ADMIN_SENHA = os.getenv('DEFAULT_ADMIN_PASSWORD', 'senha123')
        ADMIN_ROLE = os.getenv('DEFAULT_ADMIN_ROLE', 'admin')

        def _admin_exists():
            # Busca por email descriptografado usando lógica do projeto
            from .utils import find_user_by_email
            return find_user_by_email(ADMIN_EMAIL)

        if not _admin_exists():
            usuario_admin = criar_usuario(
                email=ADMIN_EMAIL,
                senha=ADMIN_SENHA,
                nome=ADMIN_NOME,
                telefone=None,
            )
            usuario_admin.role = ADMIN_ROLE
            # Garantir que o admin esteja ativo
            usuario_admin.status = 'ativo'
            db.session.add(usuario_admin)
            db.session.commit()

    return app


