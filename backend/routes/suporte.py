from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

from ..models import db, ChamadoSuporte, Notificacao, Usuario
from ..utils import require_admin

suporte_bp = Blueprint("suporte", __name__)

# Fuso oficial do sistema: Horário de Brasília
TZ_BRAZIL = "America/Sao_Paulo"


def now_brazil():
    """Retorna datetime em horário local de Brasília.

    Mantemos a coluna como DateTime; o valor persistido será consistente com o fuso desejado.
    """
    # Usamos o componente local do próprio Python via replace do timezone não é possível sem tzinfo.
    # Portanto, convertemos para ISO local usando astimezone quando houver tzinfo.
    from zoneinfo import ZoneInfo

    return datetime.now(ZoneInfo(TZ_BRAZIL)).replace(tzinfo=None)


@suporte_bp.route("/chamados", methods=["GET"])
@jwt_required()
def get_chamados():
    """Lista de chamados do CLIENTE autenticado.

    Segurança: obrigatoriamente filtra por usuario_id = sessão JWT.
    """
    current_user_id = int(get_jwt_identity())
    chamados = (
        ChamadoSuporte.query.filter_by(usuario_id=current_user_id)
        .order_by(ChamadoSuporte.data.desc())
        .all()
    )
    return jsonify([chamado.to_dict() for chamado in chamados]), 200


@suporte_bp.route("/chamados", methods=["POST"])
@jwt_required()
def create_chamado():
    """Cria chamado de suporte do CLIENTE autenticado."""
    current_user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    required_fields = ["titulo", "descricao"]
    for field in required_fields:
        if not data.get(field):
            return jsonify({"error": f"Campo {field} é obrigatório"}), 400

    try:
        chamado = ChamadoSuporte(
            usuario_id=current_user_id,
            titulo=data["titulo"],
            descricao=data["descricao"],
            data=now_brazil(),
        )

        db.session.add(chamado)
        db.session.commit()

        # Notificação: apenas admins recebem
        admins = Usuario.query.filter_by(role="admin").all()
        for admin in admins:
            notificacao = Notificacao(
                usuario_id=admin.id,
                tipo="suporte",
                mensagem=f"Novo chamado de suporte de {chamado.usuario.nome}: {chamado.titulo}",
            )
            db.session.add(notificacao)
        db.session.commit()

        return (
            jsonify(
                {"message": "Chamado criado com sucesso", "chamado": chamado.to_dict()}
            ),
            201,
        )

    except Exception:
        db.session.rollback()
        return jsonify({"error": "Erro ao criar chamado"}), 500


@suporte_bp.route("/suporte", methods=["POST"])
@jwt_required()
def create_suporte():
    return create_chamado()


@suporte_bp.route("/chamados/<int:chamado_id>", methods=["PUT"])
@jwt_required()
def update_chamado(chamado_id):
    """Atualiza chamado apenas se pertencer ao usuário autenticado."""
    current_user_id = int(get_jwt_identity())
    chamado = ChamadoSuporte.query.get(chamado_id)

    if not chamado or chamado.usuario_id != current_user_id:
        return jsonify({"error": "Chamado não encontrado"}), 404

    data = request.get_json() or {}

    allowed_fields = ["status"]
    for field in allowed_fields:
        if field in data:
            setattr(chamado, field, data[field])

    try:
        db.session.commit()
        return (
            jsonify(
                {
                    "message": "Chamado atualizado com sucesso",
                    "chamado": chamado.to_dict(),
                }
            ),
            200,
        )
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Erro ao atualizar chamado"}), 500


@suporte_bp.route("/chamados/<int:chamado_id>/classificar", methods=["PUT"])
@jwt_required()
def classificar_chamado(chamado_id):
    """Endpoint para ML classificar chamados.

    Restrição de segurança:
    - Usuário só pode classificar seus próprios chamados
    - Admin pode classificar qualquer chamado
    """
    current_user_id = int(get_jwt_identity())
    user = Usuario.query.get(current_user_id)

    chamado = ChamadoSuporte.query.get(chamado_id)
    if not chamado:
        return jsonify({"error": "Chamado não encontrado"}), 404

    if not user:
        return jsonify({"error": "Usuário não encontrado"}), 404

    is_admin = user.role == "admin"
    if not is_admin and chamado.usuario_id != current_user_id:
        return jsonify({"error": "Acesso negado"}), 403

    data = request.get_json() or {}

    if "categoria" in data:
        chamado.categoria_classificada = data["categoria"]
    if "prioridade" in data:
        chamado.prioridade = data["prioridade"]

    try:
        db.session.commit()
        return (
            jsonify(
                {
                    "message": "Chamado classificado com sucesso",
                    "chamado": chamado.to_dict(),
                }
            ),
            200,
        )
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Erro ao classificar chamado"}), 500
