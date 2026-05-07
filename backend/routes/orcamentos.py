from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Orcamento, Notificacao
import json

orcamentos_bp = Blueprint('orcamentos', __name__)

@orcamentos_bp.route('/orcamentos', methods=['GET'])
@jwt_required()
def get_orcamentos():
    current_user_id = int(get_jwt_identity())
    orcamentos = Orcamento.query.filter_by(usuario_id=current_user_id).all()
    return jsonify([orcamento.to_dict() for orcamento in orcamentos]), 200

@orcamentos_bp.route('/orcamentos', methods=['POST'])
@jwt_required()
def create_orcamento():
    current_user_id = int(get_jwt_identity())
    data = request.get_json()

    required_fields = ['tipo']
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({"error": f"Campo {field} é obrigatório"}), 400

    try:
        parametros = json.dumps(data.get('parametros', {})) if data.get('parametros') else None

        orcamento = Orcamento(
            usuario_id=current_user_id,
            tipo=data['tipo'],
            parametros=parametros,
            valor_estimado=data.get('valor_estimado')
        )

        db.session.add(orcamento)
        db.session.commit()

        # Criar notificação
        notificacao = Notificacao(
            usuario_id=current_user_id,
            tipo='orcamento',
            mensagem=f'Orçamento solicitado: {orcamento.tipo}'
        )
        db.session.add(notificacao)
        db.session.commit()

        return jsonify({
            "message": "Orçamento criado com sucesso",
            "orcamento": orcamento.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Erro ao criar orçamento"}), 500

@orcamentos_bp.route('/orcamentos/<int:orcamento_id>', methods=['GET'])
@jwt_required()
def get_orcamento(orcamento_id):
    current_user_id = int(get_jwt_identity())
    orcamento = Orcamento.query.get(orcamento_id)

    if not orcamento or orcamento.usuario_id != current_user_id:
        return jsonify({"error": "Orçamento não encontrado"}), 404

    return jsonify(orcamento.to_dict()), 200