"""
Utilitários comuns para o projeto SIP
"""

from flask_jwt_extended import get_jwt_identity
from flask import jsonify
from functools import wraps
from .models import Usuario
from .crypto import decrypt_value


def get_current_user():
    """Retorna o usuário atual baseado no token JWT"""
    user_id = int(get_jwt_identity())
    return Usuario.query.get(user_id)


def verificar_admin(user_id=None):
    """Verifica se o usuário é admin"""
    if user_id is None:
        user_id = int(get_jwt_identity())
    usuario = Usuario.query.get(user_id)
    return bool(usuario and usuario.role == "admin")


def require_admin():
    """Decorator para verificar se usuário é admin"""

    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                is_admin = verificar_admin()
            except Exception:
                return jsonify({"error": "Não autenticado"}), 401

            if not is_admin:
                return jsonify({"error": "Acesso negado. Apenas admin."}), 403

            return f(*args, **kwargs)

        return decorated_function

    return decorator


def find_user_by_email(email):
    """Busca usuário pelo email descriptografado."""
    email_lower = email.lower()
    for usuario in Usuario.query.all():
        try:
            if decrypt_value(usuario.email_criptografado).lower() == email_lower:
                return usuario
        except Exception:
            continue
    return None
