from flask import Blueprint, request, jsonify
from ..models import db, Notificacao
from flask_jwt_extended import jwt_required, get_jwt_identity

notificacoes_bp = Blueprint('notificacoes', __name__)

@notificacoes_bp.route('/notificacoes', methods=['GET'])
@jwt_required()
def listar_notificacoes():
    """Listar notificações do usuário"""
    try:
        current_user_id = get_jwt_identity()
        notificacoes = Notificacao.query.filter_by(usuario_id=current_user_id).order_by(Notificacao.data.desc()).all()

        return jsonify([n.to_dict() for n in notificacoes]), 200

    except Exception as e:
        return jsonify({"error": "Erro interno do servidor"}), 500

@notificacoes_bp.route('/notificacoes/<int:id>/lido', methods=['PUT'])
@jwt_required()
def marcar_lida(id):
    """Marcar notificação como lida"""
    try:
        current_user_id = get_jwt_identity()
        notificacao = Notificacao.query.filter_by(id=id, usuario_id=current_user_id).first_or_404()

        notificacao.lida = True
        db.session.commit()

        return jsonify({"message": "Notificação marcada como lida"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Erro interno do servidor"}), 500

@notificacoes_bp.route('/notificacoes/<int:id>', methods=['DELETE'])
@jwt_required()
def deletar_notificacao(id):
    """Deletar notificação"""
    try:
        current_user_id = get_jwt_identity()
        notificacao = Notificacao.query.filter_by(id=id, usuario_id=current_user_id).first_or_404()

        db.session.delete(notificacao)
        db.session.commit()

        return jsonify({"message": "Notificação deletada"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Erro interno do servidor"}), 500

def criar_notificacao(usuario_id, tipo, mensagem):
    """Função auxiliar para criar notificações"""
    notificacao = Notificacao(
        usuario_id=usuario_id,
        tipo=tipo,
        mensagem=mensagem
    )
    db.session.add(notificacao)
    db.session.commit()
    return notificacao