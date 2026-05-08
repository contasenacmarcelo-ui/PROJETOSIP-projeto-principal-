from flask import Blueprint, request, jsonify
from ..models import db, Usuario
from ..auth import criar_usuario, autenticar_usuario, gerar_tokens
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    current_user_id = int(get_jwt_identity())
    usuario = Usuario.query.get(current_user_id)
    if not usuario:
        return jsonify({"error": "Usuário não encontrado"}), 404
    return jsonify(usuario.to_dict()), 200

@auth_bp.route('/cadastro', methods=['POST'])
def cadastro():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "JSON inválido ou corpo vazio"}), 400

        required_fields = ['email', 'senha', 'nome']

        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({"error": f"Campo {field} é obrigatório"}), 400

        usuario = criar_usuario(
            email=data['email'],
            senha=data['senha'],
            nome=data['nome'],
            telefone=data.get('telefone')
        )

        db.session.add(usuario)
        db.session.commit()

        access_token, refresh_token = gerar_tokens(usuario)

        return jsonify({
            "message": "Usuário cadastrado com sucesso",
            "user": usuario.to_dict(),
            "access_token": access_token,
            "refresh_token": refresh_token
        }), 201

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Erro interno do servidor"}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "JSON inválido ou corpo vazio"}), 400

        email = data.get('email')
        senha = data.get('senha')

        if not email or not senha:
            return jsonify({"error": "Email e senha são obrigatórios"}), 400

        usuario = autenticar_usuario(email, senha)
        if not usuario:
            return jsonify({"error": "Credenciais inválidas"}), 401

        access_token, refresh_token = gerar_tokens(usuario)

        return jsonify({
            "message": "Login realizado com sucesso",
            "user": usuario.to_dict(),
            "access_token": access_token,
            "refresh_token": refresh_token
        }), 200

    except Exception as e:
        return jsonify({"error": "Erro interno do servidor"}), 500

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    # Em JWT, logout é principalmente client-side (remover token)
    # Aqui podemos implementar blacklist se necessário
    return jsonify({"message": "Logout realizado com sucesso"}), 200

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    current_user_id = get_jwt_identity()
    usuario = Usuario.query.get(current_user_id)

    if not usuario:
        return jsonify({"error": "Usuário não encontrado"}), 404

    access_token = create_access_token(identity=str(usuario.id))
    return jsonify({"access_token": access_token}), 200