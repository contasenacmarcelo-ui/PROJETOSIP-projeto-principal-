from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..models import db, Usuario, ChamadoSuporte, MensagemSuporte

chat_bp = Blueprint("chat", __name__)


@chat_bp.route("/chat/conversas", methods=["GET"])
@jwt_required()
def listar_conversas():
    """Admin: retorna todas as conversas (chamados). Caso falhe/DB vazio, retorna conversas: [] (200).

    UI do admin (admia.js) espera um JSON com chaves: {conversas: [...]}.
    """
    try:
        identity = get_jwt_identity()
        current_user_id = int(str(identity))

        usuario_atual = Usuario.query.get(current_user_id)
        if not usuario_atual:
            return jsonify({"total": 0, "conversas": []}), 200

        is_admin = usuario_atual.role == "admin"

        query = ChamadoSuporte.query
        if not is_admin:
            query = query.filter_by(usuario_id=current_user_id)

        chamados = query.order_by(ChamadoSuporte.data.desc()).all()

        # Se admin e não houver chamados: devolve lista vazia (UI trata e pode fallbackar clientes).
        if len(chamados) == 0:
            return jsonify({"total": 0, "conversas": []}), 200

        conversas = []
        for c in chamados:
            try:
                usuario = Usuario.query.get(getattr(c, "usuario_id", None))
            except Exception:
                usuario = None

            try:
                ultima_msg = (
                    MensagemSuporte.query.filter_by(chamado_id=c.id)
                    .order_by(MensagemSuporte.data.desc())
                    .first()
                )
            except Exception:
                ultima_msg = None

            qtd = 0
            try:
                qtd = MensagemSuporte.query.filter_by(chamado_id=c.id).count()
            except Exception:
                qtd = 0

            conversas.append(
                {
                    "chamado_id": c.id,
                    "usuario_id": getattr(c, "usuario_id", None),
                    "usuario_nome": getattr(usuario, "nome", None) or "—",
                    "usuario_email": getattr(usuario, "email", None),
                    "titulo": getattr(c, "titulo", None),
                    "descricao": getattr(c, "descricao", None),
                    "status_conversa": getattr(c, "status", None),
                    "prioridade": getattr(c, "prioridade", None),
                    "data_thread": c.data.isoformat() if getattr(c, "data", None) else None,
                    "ultima_mensagem": getattr(ultima_msg, "conteudo", None) if ultima_msg else None,
                    "ultima_mensagem_data": (
                        ultima_msg.data.isoformat() if ultima_msg and getattr(ultima_msg, "data", None) else None
                    ),
                    "ultima_mensagem_autor": getattr(ultima_msg, "autor_tipo", None) if ultima_msg else None,
                    "qtd_mensagens": qtd,
                }
            )

        return jsonify({"total": len(conversas), "conversas": conversas}), 200

    except Exception:
        # Tratamento isolado ultra-defensivo para evitar 500 no admin.
        return jsonify({"total": 0, "conversas": []}), 200


@chat_bp.route("/chat/<int:chamado_id>/mensagens", methods=["GET"])
@jwt_required()
def listar_mensagens(chamado_id):
    try:
        current_user_id = int(get_jwt_identity())
        user = Usuario.query.get(current_user_id)
        if not user:
            return jsonify({"error": "Usuário não encontrado"}), 404

        chamado = ChamadoSuporte.query.get(chamado_id)
        if not chamado:
            return jsonify({"error": "Conversa não encontrada"}), 404

        if user.role != "admin" and getattr(chamado, "usuario_id", None) != current_user_id:
            return jsonify({"error": "Acesso negado"}), 403

        mensagens = (
            MensagemSuporte.query.filter_by(chamado_id=chamado_id)
            .order_by(MensagemSuporte.data.asc())
            .all()
        )

        return (
            jsonify(
                {"chamado_id": chamado.id, "mensagens": [m.to_dict() for m in mensagens]}
            ),
            200,
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@chat_bp.route("/chat/<int:chamado_id>/mensagens", methods=["POST"])
@jwt_required()
def enviar_mensagem(chamado_id):
    current_user_id = int(get_jwt_identity())
    user = Usuario.query.get(current_user_id)

    data = request.get_json() or {}
    conteudo = (data.get("conteudo") or "").strip()

    if not conteudo:
        return jsonify({"error": "Campo conteudo é obrigatório"}), 400

    chamado = ChamadoSuporte.query.get(chamado_id)
    if not chamado:
        return jsonify({"error": "Conversa não encontrada"}), 404

    if user.role != "admin" and getattr(chamado, "usuario_id", None) != current_user_id:
        return jsonify({"error": "Acesso negado"}), 403

    autor_tipo = "admin" if user.role == "admin" else "user"

    msg = MensagemSuporte(
        chamado_id=chamado_id,
        autor_tipo=autor_tipo,
        autor_usuario_id=current_user_id,
        conteudo=conteudo,
    )

    db.session.add(msg)
    db.session.commit()

    return jsonify({"message": "Mensagem enviada", "mensagem": msg.to_dict()}), 201

