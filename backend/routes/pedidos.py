from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import db, Pedido, Notificacao
from datetime import datetime

pedidos_bp = Blueprint('pedidos', __name__)

@pedidos_bp.route('/pedidos', methods=['GET'])
@jwt_required()
def get_pedidos():
    current_user_id = int(get_jwt_identity())
    pedidos = Pedido.query.filter_by(usuario_id=current_user_id).all()
    return jsonify([pedido.to_dict() for pedido in pedidos]), 200

@pedidos_bp.route('/pedidos', methods=['POST'])
@jwt_required()
def create_pedido():
    current_user_id = int(get_jwt_identity())
    data = request.get_json()

    required_fields = ['tipo_servico', 'descricao']
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({"error": f"Campo {field} é obrigatório"}), 400

    try:
        prazo = None
        if 'prazo' in data and data['prazo']:
            prazo = datetime.strptime(data['prazo'], '%Y-%m-%d').date()

        pedido = Pedido(
            usuario_id=current_user_id,
            tipo_servico=data['tipo_servico'],
            descricao=data['descricao'],
            valor_estimado=data.get('valor_estimado'),
            prazo=prazo
        )

        db.session.add(pedido)
        db.session.commit()

        # Criar notificação
        notificacao = Notificacao(
            usuario_id=current_user_id,
            tipo='pedido',
            mensagem=f'Novo pedido criado: {pedido.tipo_servico}'
        )
        db.session.add(notificacao)
        db.session.commit()

        return jsonify({
            "message": "Pedido criado com sucesso",
            "pedido": pedido.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Erro ao criar pedido"}), 500

@pedidos_bp.route('/pedidos/<int:pedido_id>', methods=['GET'])
@jwt_required()
def get_pedido(pedido_id):
    current_user_id = int(get_jwt_identity())
    pedido = Pedido.query.get(pedido_id)

    if not pedido or pedido.usuario_id != current_user_id:
        return jsonify({"error": "Pedido não encontrado"}), 404

    return jsonify(pedido.to_dict()), 200

@pedidos_bp.route('/pedidos/<int:pedido_id>', methods=['PUT'])
@jwt_required()
def update_pedido(pedido_id):
    current_user_id = int(get_jwt_identity())
    pedido = Pedido.query.get(pedido_id)

    if not pedido or pedido.usuario_id != current_user_id:
        return jsonify({"error": "Pedido não encontrado"}), 404

    data = request.get_json()

    # Campos que podem ser atualizados
    allowed_fields = ['status', 'valor_estimado']

    for field in allowed_fields:
        if field in data:
            setattr(pedido, field, data[field])

    try:
        db.session.commit()
        return jsonify({
            "message": "Pedido atualizado com sucesso",
            "pedido": pedido.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Erro ao atualizar pedido"}), 500