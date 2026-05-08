from flask_jwt_extended import JWTManager, create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from .models import Usuario
from werkzeug.security import generate_password_hash
import re

jwt = JWTManager()

def validar_email(email):
    """Valida formato de email"""
    pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    return re.match(pattern, email) is not None

def criar_usuario(email, senha, nome, telefone=None):
    """Cria novo usuário com validações"""
    if not validar_email(email):
        raise ValueError("Email inválido")

    if len(senha) < 6:
        raise ValueError("Senha deve ter pelo menos 6 caracteres")

    if Usuario.query.filter_by(email=email.lower()).first():
        raise ValueError("Email já cadastrado")

    usuario = Usuario(
        email=email.lower(),
        nome=nome,
        telefone=telefone
    )
    usuario.set_senha(senha)

    return usuario

def autenticar_usuario(email, senha):
    """Autentica usuário"""
    usuario = Usuario.query.filter_by(email=email.lower()).first()
    if usuario and usuario.check_senha(senha) and usuario.status == 'ativo':
        return usuario
    return None

def gerar_tokens(usuario):
    """Gera access e refresh tokens"""
    identity = str(usuario.id)
    access_token = create_access_token(identity=identity)
    refresh_token = create_refresh_token(identity=identity)
    return access_token, refresh_token