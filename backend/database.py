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
        from .utils import find_user_by_email

        ADMIN_EMAIL = 'admin@sip.com'.lower()
        ADMIN_NOME = 'Administrador'
        ADMIN_SENHA = 'admin123'
        ADMIN_ROLE = 'admin'

        def _admin_exists():
            return find_user_by_email(ADMIN_EMAIL) is not None

        if not _admin_exists():
            usuario_admin = criar_usuario(
                email=ADMIN_EMAIL,
                senha=ADMIN_SENHA,
                nome=ADMIN_NOME,
                telefone=None,
            )
            usuario_admin.role = ADMIN_ROLE
            usuario_admin.status = 'ativo'
            db.session.add(usuario_admin)

            # commit explícito (obrigatório)
            db.session.commit()


    return app
