from flask import Blueprint, request, jsonify
from ..models import db, MensagemContato
from flask_jwt_extended import jwt_required

contato_bp = Blueprint('contato', __name__)

@contato_bp.route('/contato', methods=['POST'])
def enviar_mensagem():
    """Enviar mensagem de contato"""
    try:
        data = request.get_json()

        required_fields = ['email', 'mensagem']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({"error": f"Campo {field} é obrigatório"}), 400

        mensagem = MensagemContato(
            email=data['email'],
            nome=data.get('nome'),
            telefone=data.get('telefone'),
            assunto=data.get('assunto'),
            mensagem=data['mensagem']
        )

        db.session.add(mensagem)
        db.session.commit()

        return jsonify({
            "message": "Mensagem enviada com sucesso",
            "id": mensagem.id
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Erro interno do servidor"}), 500

@contato_bp.route('/contato', methods=['GET'])
@jwt_required()
def listar_mensagens():
    """Listar mensagens de contato (admin)"""
    try:
        mensagens = MensagemContato.query.order_by(MensagemContato.data.desc()).all()
        return jsonify([msg.to_dict() for msg in mensagens]), 200

    except Exception as e:
        return jsonify({"error": "Erro interno do servidor"}), 500

@contato_bp.route('/contato/<int:id>', methods=['PUT'])
@jwt_required()
def marcar_lida(id):
    """Marcar mensagem como lida"""
    try:
        mensagem = MensagemContato.query.get_or_404(id)
        mensagem.lida = True
        db.session.commit()

        return jsonify({"message": "Mensagem marcada como lida"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Erro interno do servidor"}), 500