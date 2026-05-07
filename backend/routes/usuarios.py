from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Usuario

usuarios_bp = Blueprint('usuarios', __name__)

@usuarios_bp.route('/usuario/<int:user_id>', methods=['GET'])
@jwt_required()
def get_usuario(user_id):
    current_user_id = int(get_jwt_identity())

    # Usuário só pode ver seu próprio perfil
    if current_user_id != user_id:
        return jsonify({"error": "Acesso negado"}), 403

    usuario = Usuario.query.get(user_id)
    if not usuario:
        return jsonify({"error": "Usuário não encontrado"}), 404

    return jsonify(usuario.to_dict()), 200

@usuarios_bp.route('/usuario/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_usuario(user_id):
    current_user_id = int(get_jwt_identity())

    if current_user_id != user_id:
        return jsonify({"error": "Acesso negado"}), 403

    usuario = Usuario.query.get(user_id)
    if not usuario:
        return jsonify({"error": "Usuário não encontrado"}), 404

    data = request.get_json()

    # Campos que podem ser atualizados
    allowed_fields = ['nome', 'telefone']

    for field in allowed_fields:
        if field in data:
            setattr(usuario, field, data[field])

    try:
        db.session.commit()
        return jsonify({
            "message": "Usuário atualizado com sucesso",
            "user": usuario.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Erro ao atualizar usuário"}), 500