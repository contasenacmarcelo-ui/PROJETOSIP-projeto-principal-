from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..models import db, Usuario
from ..utils import require_admin

# Modelagem aprovada (Opção A)
from ..models_chat_admin import ConversasAdmin, MensagensConversasAdmin

chat_admin_bp = Blueprint("chat_admin", __name__)


def _get_current_user():
    user_id = int(get_jwt_identity())
    return Usuario.query.get(user_id)


def _get_or_create_conversa(cliente_id, admin_id):
    # unique constraint em ConversasAdmin.cliente_id garante 1 conversa por cliente
    conversa = ConversasAdmin.query.filter_by(cliente_id=cliente_id).first()
    if conversa:
        return conversa

    conversa = ConversasAdmin(cliente_id=cliente_id, admin_id=admin_id)
    db.session.add(conversa)
    db.session.commit()
    return conversa


@chat_admin_bp.route("/api/chat-admin/mensagens", methods=["POST"])
@jwt_required()
def cliente_enviar_mensagem_para_admin():
    """Cliente envia mensagem ao admin (cria conversa se não existir)."""

    current_user = _get_current_user()
    if not current_user:
        return jsonify({"error": "Usuário não autenticado"}), 401

    if current_user.role != "user":
        return jsonify({"error": "Acesso negado"}), 403

    payload = request.get_json(silent=True) or {}
    content = (payload.get("content") or payload.get("mensagem") or "").strip()

    if not content:
        return jsonify({"error": "Campo content é obrigatório"}), 400

    # Admin (uma conversa por cliente, mas a regra de negócio diz Admin ↔ Cliente; usamos o admin autenticado se ele estiver enviando,
    # e para o cliente buscamos um admin existente).
    # Como na UI só existe 1 admin, pegamos o primeiro admin.
    admin = Usuario.query.filter_by(role="admin").order_by(Usuario.id.asc()).first()
    if not admin:
        return jsonify({"error": "Admin não encontrado"}), 404

    conversa = _get_or_create_conversa(cliente_id=current_user.id, admin_id=admin.id)

    mensagem = MensagensConversasAdmin(
        conversa_id=conversa.id,
        senderId=current_user.id,
        receiverId=admin.id,
        content=content,
        read=False,
    )
    db.session.add(mensagem)
    db.session.commit()

    return jsonify({"message": "Mensagem enviada", "mensagem": mensagem.to_dict()}), 201


@chat_admin_bp.route("/api/chat-admin/mensagens", methods=["GET"])
@jwt_required()
def cliente_listar_mensagens_com_admin():
    """Cliente busca suas próprias mensagens com o admin."""

    current_user = _get_current_user()
    if not current_user:
        return jsonify({"error": "Usuário não autenticado"}), 401

    if current_user.role != "user":
        return jsonify({"error": "Acesso negado"}), 403

    limit = int(request.args.get("limit", 50))
    after = request.args.get("after")

    query = (
        MensagensConversasAdmin.query.join(
            ConversasAdmin, ConversasAdmin.id == MensagensConversasAdmin.conversa_id
        )
        .filter(ConversasAdmin.cliente_id == current_user.id)
        .order_by(MensagensConversasAdmin.timestamp.asc())
        .limit(limit)
    )

    if after is not None:
        try:
            after_id = int(after)
            query = query.filter(MensagensConversasAdmin.id > after_id)
        except Exception:
            pass

    mensagens = query.all()
    return jsonify({"mensagens": [m.to_dict() for m in mensagens]}), 200


@chat_admin_bp.route("/api/chat-admin/clientes", methods=["GET"])
@jwt_required()
@require_admin()
def admin_listar_clientes():
    """Admin lista todos os clientes com contagem de não lidas e última mensagem."""

    limit = int(request.args.get("limit", 1000))

    # Clientes: papel user
    clientes = (
        Usuario.query.filter_by(role="user")
        .order_by(Usuario.id.asc())
        .limit(limit)
        .all()
    )

    response = []
    for cliente in clientes:
        conversa = ConversasAdmin.query.filter_by(cliente_id=cliente.id).first()

        if not conversa:
            response.append(
                {
                    "cliente_id": cliente.id,
                    "nome": cliente.nome,
                    "email": cliente.email,
                    "ultima_mensagem": None,
                    "ultima_mensagem_timestamp": None,
                    "nao_lidas": 0,
                }
            )
            continue

        ultima = (
            MensagensConversasAdmin.query.filter_by(conversa_id=conversa.id)
            .order_by(MensagensConversasAdmin.timestamp.desc())
            .first()
        )

        nao_lidas = MensagensConversasAdmin.query.filter_by(
            conversa_id=conversa.id, receiverId=cliente.id, read=False
        ).count()

        response.append(
            {
                "cliente_id": cliente.id,
                "nome": cliente.nome,
                "email": cliente.email,
                "ultima_mensagem": ultima.content if ultima else None,
                "ultima_mensagem_timestamp": (
                    ultima.timestamp.isoformat()
                    if ultima and ultima.timestamp
                    else None
                ),
                "nao_lidas": int(nao_lidas),
            }
        )

    return jsonify({"clientes": response}), 200


@chat_admin_bp.route(
    "/api/chat-admin/clientes/<int:cliente_id>/mensagens", methods=["GET"]
)
@jwt_required()
@require_admin()
def admin_listar_mensagens_de_cliente(cliente_id: int):
    """Admin busca mensagens de um cliente específico."""

    limit = int(request.args.get("limit", 100))

    conversa = ConversasAdmin.query.filter_by(cliente_id=cliente_id).first()
    if not conversa:
        return jsonify({"mensagens": []}), 200

    mensagens = (
        MensagensConversasAdmin.query.filter_by(conversa_id=conversa.id)
        .order_by(MensagensConversasAdmin.timestamp.asc())
        .limit(limit)
        .all()
    )

    return jsonify({"mensagens": [m.to_dict() for m in mensagens]}), 200


@chat_admin_bp.route(
    "/api/chat-admin/clientes/<int:cliente_id>/mensagens", methods=["POST"]
)
@jwt_required()
@require_admin()
def admin_enviar_mensagem_para_cliente(cliente_id: int):
    """Admin envia mensagem para um cliente específico."""

    payload = request.get_json(silent=True) or {}
    content = (payload.get("content") or payload.get("mensagem") or "").strip()
    if not content:
        return jsonify({"error": "Campo content é obrigatório"}), 400

    admin_user = _get_current_user()
    if not admin_user or admin_user.role != "admin":
        return jsonify({"error": "Acesso negado"}), 403

    conversa = _get_or_create_conversa(cliente_id=cliente_id, admin_id=admin_user.id)

    mensagem = MensagensConversasAdmin(
        conversa_id=conversa.id,
        senderId=admin_user.id,
        receiverId=cliente_id,
        content=content,
        read=False,
    )
    db.session.add(mensagem)
    db.session.commit()

    return jsonify({"message": "Mensagem enviada", "mensagem": mensagem.to_dict()}), 201
