from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import db, ChamadoSuporte, Notificacao

suporte_bp = Blueprint('suporte', __name__)

@suporte_bp.route('/chamados', methods=['GET'])
@jwt_required()
def get_chamados():
    current_user_id = int(get_jwt_identity())
    chamados = ChamadoSuporte.query.filter_by(usuario_id=current_user_id).all()
    return jsonify([chamado.to_dict() for chamado in chamados]), 200

@suporte_bp.route('/chamados', methods=['POST'])
@jwt_required()
def create_chamado():
    current_user_id = int(get_jwt_identity())
    data = request.get_json()

    required_fields = ['titulo', 'descricao']
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({"error": f"Campo {field} é obrigatório"}), 400

    try:
        chamado = ChamadoSuporte(
            usuario_id=current_user_id,
            titulo=data['titulo'],
            descricao=data['descricao']
        )

        db.session.add(chamado)
        db.session.commit()

        # Criar notificação
        notificacao = Notificacao(
            usuario_id=current_user_id,
            tipo='suporte',
            mensagem=f'Chamado de suporte aberto: {chamado.titulo}'
        )
        db.session.add(notificacao)
        db.session.commit()

        return jsonify({
            "message": "Chamado criado com sucesso",
            "chamado": chamado.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Erro ao criar chamado"}), 500

@suporte_bp.route('/suporte', methods=['POST'])
@jwt_required()
def create_suporte():
    return create_chamado()

@suporte_bp.route('/chamados/<int:chamado_id>', methods=['PUT'])
@jwt_required()
def update_chamado(chamado_id):
    current_user_id = int(get_jwt_identity())
    chamado = ChamadoSuporte.query.get(chamado_id)

    if not chamado or chamado.usuario_id != current_user_id:
        return jsonify({"error": "Chamado não encontrado"}), 404

    data = request.get_json()

    # Campos que podem ser atualizados pelo usuário
    allowed_fields = ['status']  # Usuário pode fechar chamado

    for field in allowed_fields:
        if field in data:
            setattr(chamado, field, data[field])

    try:
        db.session.commit()
        return jsonify({
            "message": "Chamado atualizado com sucesso",
            "chamado": chamado.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Erro ao atualizar chamado"}), 500

@suporte_bp.route('/chamados/<int:chamado_id>/classificar', methods=['PUT'])
@jwt_required()
def classificar_chamado(chamado_id):
    # Este endpoint será usado pelo ML para classificar chamados
    chamado = ChamadoSuporte.query.get(chamado_id)

    if not chamado:
        return jsonify({"error": "Chamado não encontrado"}), 404

    data = request.get_json()

    if 'categoria' in data:
        chamado.categoria_classificada = data['categoria']
    if 'prioridade' in data:
        chamado.prioridade = data['prioridade']

    try:
        db.session.commit()
        return jsonify({
            "message": "Chamado classificado com sucesso",
            "chamado": chamado.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Erro ao classificar chamado"}), 500