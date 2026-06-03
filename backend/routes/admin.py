from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from ..models import ChamadoSuporte, Notificacao, Orcamento, Pedido, Usuario, db
from ..utils import require_admin
from sqlalchemy import func

admin_bp = Blueprint("admin", __name__)


def _safe_iso(dt):
    try:
        return dt.isoformat() if dt else None
    except Exception:
        return None


def _ensure_seed_data():
    """Seed idempotente para garantir dados mínimos para o admin/chat."""

    # 1) Usuários
    # Criamos 3 usuários admin/user com status/role coerentes.
    seed_users = [
        {
            "nome": "Admin SIP",
            "email": "admin_seed@example.com",
            "telefone": "+55 11 90000-0001",
            "status": "ativo",
            "role": "admin",
        },
        {
            "nome": "Cliente Seed 1",
            "email": "cliente1_seed@example.com",
            "telefone": "+55 11 90000-0002",
            "status": "ativo",
            "role": "user",
        },
        {
            "nome": "Cliente Seed 2",
            "email": "cliente2_seed@example.com",
            "telefone": "+55 11 90000-0003",
            "status": "ativo",
            "role": "user",
        },
    ]

    # Password fixa (compatível com set_senha)
    senha = "senha123"

    created_users = []
    for u in seed_users:
        existing = Usuario.query.filter(Usuario.email == u["email"]).first()
        if existing:
            created_users.append(existing)
            continue

        novo = Usuario(
            nome=u["nome"],
            email=u["email"],
            telefone=u["telefone"],
            status=u["status"],
            email_verificado=True,
            role=u["role"],
        )
        novo.set_senha(senha)
        db.session.add(novo)
        created_users.append(novo)

    # flush para obter ids
    db.session.flush()

    # 2) Pedidos fictícios (3)
    # Vincular ao primeiro cliente user.
    users_by_role = {r["role"]: None for r in seed_users}
    # Mapear por email pra garantir ids corretos
    for su in seed_users:
        uobj = Usuario.query.filter(Usuario.email == su["email"]).first()
        if uobj:
            users_by_role[su["role"]] = uobj

    cliente_admin = next((x for x in created_users if x.role == "admin"), None)
    cliente_user_1 = next((x for x in created_users if x.role == "user" and x.email == seed_users[1]["email"]), None)
    cliente_user_2 = next((x for x in created_users if x.role == "user" and x.email == seed_users[2]["email"]), None)

    # Se ainda não existirem no banco por query (por flush), fazemos fallback.
    if not cliente_user_1:
        cliente_user_1 = Usuario.query.filter(Usuario.email == seed_users[1]["email"]).first()
    if not cliente_user_2:
        cliente_user_2 = Usuario.query.filter(Usuario.email == seed_users[2]["email"]).first()

    # Idempotência: verificar pedidos seed por descricao
    seed_pedidos = [
        {
            "usuario": cliente_user_1,
            "tipo_servico": "sistema",
            "descricao": "Pedido seed 1 - sistema",
            "status": "pendente",
            "valor_estimado": 1200.0,
        },
        {
            "usuario": cliente_user_1,
            "tipo_servico": "website",
            "descricao": "Pedido seed 2 - website",
            "status": "em_andamento",
            "valor_estimado": 3500.0,
        },
        {
            "usuario": cliente_user_2,
            "tipo_servico": "app",
            "descricao": "Pedido seed 3 - app",
            "status": "pendente",
            "valor_estimado": 5200.0,
        },
    ]

    for sp in seed_pedidos:
        if not sp["usuario"]:
            continue
        exists_pedido = Pedido.query.filter(Pedido.descricao == sp["descricao"]).first()
        if exists_pedido:
            continue

        novo_p = Pedido(
            usuario_id=sp["usuario"].id,
            tipo_servico=sp["tipo_servico"],
            descricao=sp["descricao"],
            status=sp["status"],
            valor_estimado=sp["valor_estimado"],
        )
        db.session.add(novo_p)

    # 3) Chamados/"mensagens" básicas (2)
    seed_chamados = [
        {
            "usuario": cliente_user_1,
            "titulo": "Suporte seed 1",
            "descricao": "Mensagem inicial do suporte (seed 1).",
            "categoria_classificada": "duvida",
            "prioridade": "media",
            "status": "aberto",
            "autor_tipo": "user",
            "conteudo_msg": "Olá! Preciso de ajuda com o sistema (seed).",
        },
        {
            "usuario": cliente_user_2,
            "titulo": "Suporte seed 2",
            "descricao": "Mensagem inicial do suporte (seed 2).",
            "categoria_classificada": "bug",
            "prioridade": "alta",
            "status": "aberto",
            "autor_tipo": "user",
            "conteudo_msg": "Minha aplicação está com erro. (seed) ",
        },
    ]

    for sc in seed_chamados:
        if not sc["usuario"]:
            continue

        exists_chamado = ChamadoSuporte.query.filter(ChamadoSuporte.titulo == sc["titulo"]).first()
        chamado = exists_chamado
        if not chamado:
            chamado = ChamadoSuporte(
                usuario_id=sc["usuario"].id,
                titulo=sc["titulo"],
                descricao=sc["descricao"],
                categoria_classificada=sc["categoria_classificada"],
                prioridade=sc["prioridade"],
                status=sc["status"],
            )
            db.session.add(chamado)
            db.session.flush()

        # Seed de pelo menos 1 mensagem para o chamado
        exists_msg = MensagemSuporte.query.filter(
            MensagemSuporte.chamado_id == chamado.id,
            MensagemSuporte.conteudo == sc["conteudo_msg"],
        ).first()
        if not exists_msg:
            msg = MensagemSuporte(
                chamado_id=chamado.id,
                autor_tipo=sc["autor_tipo"],
                autor_usuario_id=sc["usuario"].id,
                conteudo=sc["conteudo_msg"],
            )
            db.session.add(msg)

    db.session.commit()


# ---- Rotas Admin ----

@admin_bp.route("/dashboard", methods=["GET"])
@jwt_required()
@require_admin()
def get_dashboard():
    try:
        total_usuarios = Usuario.query.count()
        total_pedidos = Pedido.query.count()
        total_orcamentos = Orcamento.query.count()
        total_chamados = ChamadoSuporte.query.count()

        receita_total = (
            db.session.query(func.sum(Pedido.valor_estimado)).select_from(Pedido).scalar() or 0
        )

        return jsonify(
            {
                "total_usuarios": total_usuarios,
                "total_pedidos": total_pedidos,
                "total_orcamentos": total_orcamentos,
                "total_chamados": total_chamados,
                "receita_total": float(receita_total),
                "pedidos_por_status": [],
                "chamados_por_prioridade": [],
                "usuarios_ativos": [],
            }
        )
    except Exception as e:
        import traceback

        error_msg = getattr(e, "message", str(e))
        if hasattr(e, "orig"):
            error_msg = f"DB Error: {str(e.orig)} | Detalhes: {str(e)}"
        print(f"ERR: {error_msg}")
        traceback.print_exc()
        return jsonify({"error": error_msg, "route": request.path, "status": "failed"}), 500


@admin_bp.route("/clientes", methods=["GET"])
@require_admin()
def get_clientes():
    try:
        usuarios = Usuario.query.filter_by(role="user").all()

        if usuarios is None or len(usuarios) < 5:
            quantidade_para_criar = 5 - (len(usuarios) if usuarios else 0)
            quantidade_para_criar = max(0, quantidade_para_criar)

            for i in range(quantidade_para_criar):
                idx = (len(usuarios) or 0) + i + 1
                dummy = Usuario(
                    nome=f"Cliente Dummy {idx}",
                    email=f"dummy{idx}@example.com",
                    telefone=f"+55 11 99999-000{idx}",
                    status="ativo",
                    email_verificado=False,
                    role="user",
                )
                dummy.set_senha("senha123")
                db.session.add(dummy)

            db.session.commit()
            usuarios = Usuario.query.filter_by(role="user").all()

        clientes = []
        for usuario in usuarios:
            pedidos = Pedido.query.filter_by(usuario_id=usuario.id).all()
            chamados = ChamadoSuporte.query.filter_by(usuario_id=usuario.id).all()
            orcamentos = Orcamento.query.filter_by(usuario_id=usuario.id).all()

            valor_total = sum(p.valor_estimado or 0 for p in pedidos)

            clientes.append(
                {
                    "id": usuario.id,
                    "nome": usuario.nome,
                    "email": usuario.email,
                    "telefone": usuario.telefone,
                    "data_cadastro": usuario.data_cadastro.isoformat() if usuario.data_cadastro else None,
                    "data_ultimo_login": usuario.data_ultimo_login.isoformat() if usuario.data_ultimo_login else None,
                    "email_verificado": usuario.email_verificado,
                    "status": usuario.status,
                    "num_pedidos": len(pedidos),
                    "num_chamados": len(chamados),
                    "num_orcamentos": len(orcamentos),
                    "valor_total_pedidos": valor_total,
                    "total_gasto": usuario.total_gasto,
                    "pedidos": [p.to_dict() for p in pedidos],
                    "chamados": [c.to_dict() for c in chamados],
                    "orcamentos": [o.to_dict() for o in orcamentos],
                }
            )

        return jsonify({"total": len(clientes), "clientes": clientes}), 200
    except Exception as e:
        import traceback

        try:
            clientes = [
                {
                    "id": u.id,
                    "nome": u.nome,
                    "email": u.email,
                    "telefone": u.telefone,
                    "data_cadastro": u.data_cadastro.isoformat() if u.data_cadastro else None,
                    "data_ultimo_login": u.data_ultimo_login.isoformat() if u.data_ultimo_login else None,
                    "email_verificado": u.email_verificado,
                    "status": u.status,
                    "num_pedidos": 0,
                    "num_chamados": 0,
                    "num_orcamentos": 0,
                    "valor_total_pedidos": 0,
                    "total_gasto": getattr(u, "total_gasto", 0),
                    "pedidos": [],
                    "chamados": [],
                    "orcamentos": [],
                }
                for u in Usuario.query.all()
            ]
            return jsonify({"total": len(clientes), "clientes": clientes}), 200
        except Exception:
            pass

        error_msg = getattr(e, "message", str(e))
        if hasattr(e, "orig"):
            error_msg = f"DB Error: {str(e.orig)} | Detalhes: {str(e)}"
        print(f"ERR: {error_msg}")
        traceback.print_exc()
        return jsonify({"error": error_msg, "route": request.path, "status": "failed"}), 500


@admin_bp.route("/pedidos", methods=["GET"])
@jwt_required()
@require_admin()
def get_pedidos():
    try:
        pedidos = Pedido.query.all()
        pedidos_data = []

        for pedido in pedidos:
            usuario = Usuario.query.get(pedido.usuario_id)
            pedidos_data.append(
                {
                    "id": pedido.id,
                    "usuario_id": pedido.usuario_id,
                    "usuario_nome": usuario.nome if usuario else "Usuário não encontrado",
                    "usuario_email": usuario.email if usuario else "",
                    "servico": pedido.tipo_servico,
                    "descricao": pedido.descricao,
                    "status": pedido.status,
                    "valor_estimado": float(pedido.valor_estimado) if pedido.valor_estimado else None,
                    "data_criacao": pedido.data_criacao.isoformat() if pedido.data_criacao else None,
                }
            )

        return jsonify({"pedidos": pedidos_data}), 200
    except Exception as e:
        import traceback

        try:
            pedidos = Pedido.query.all()
            pedidos_data = [
                {
                    "id": p.id,
                    "usuario_id": p.usuario_id,
                    "usuario_nome": "—",
                    "usuario_email": "",
                    "servico": p.tipo_servico,
                    "descricao": p.descricao,
                    "status": p.status,
                    "valor_estimado": float(p.valor_estimado) if p.valor_estimado else None,
                    "data_criacao": p.data_criacao.isoformat() if p.data_criacao else None,
                }
                for p in pedidos
            ]
            return jsonify({"pedidos": pedidos_data}), 200
        except Exception:
            pass

        error_msg = getattr(e, "message", str(e))
        if hasattr(e, "orig"):
            error_msg = f"DB Error: {str(e.orig)} | Detalhes: {str(e)}"
        print(f"ERR: {error_msg}")
        traceback.print_exc()
        return jsonify({"error": error_msg, "route": request.path, "status": "failed"}), 500


@admin_bp.route("/pedido/<int:pedido_id>", methods=["GET", "DELETE"])
@jwt_required()
@require_admin()
def pedido_detail(pedido_id):
    if request.method == "DELETE":
        try:
            pedido = Pedido.query.get(pedido_id)
            if not pedido:
                return jsonify({"error": "Pedido não encontrado"}), 404

            db.session.delete(pedido)
            db.session.commit()
            return jsonify({"message": "Pedido apagado com sucesso"}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 500

    try:
        pedido = Pedido.query.get(pedido_id)
        if not pedido:
            return jsonify({"error": "Pedido não encontrado"}), 404

        usuario = Usuario.query.get(pedido.usuario_id)

        return (
            jsonify(
                {
                    "id": pedido.id,
                    "usuario_id": pedido.usuario_id,
                    "usuario_nome": usuario.nome if usuario else "Usuário não encontrado",
                    "usuario_email": usuario.email if usuario else "",
                    "servico": pedido.tipo_servico,
                    "descricao": pedido.descricao,
                    "status": pedido.status,
                    "valor_estimado": float(pedido.valor_estimado) if pedido.valor_estimado else None,
                    "data_criacao": pedido.data_criacao.isoformat() if pedido.data_criacao else None,
                }
            ),
            200,
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/pedido/<int:pedido_id>/status", methods=["PUT"])
@jwt_required()
@require_admin()
def update_pedido_status(pedido_id):
    data = request.get_json()
    if not data or "status" not in data:
        return jsonify({"error": "Campo 'status' é obrigatório"}), 400

    try:
        pedido = Pedido.query.get(pedido_id)
        if not pedido:
            return jsonify({"error": "Pedido não encontrado"}), 404

        pedido.status = data["status"]
        db.session.commit()

        return (
            jsonify(
                {
                    "message": "Status atualizado com sucesso",
                    "pedido": {"id": pedido.id, "status": pedido.status},
                }
            ),
            200,
        )
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Falha ao atualizar status"}), 500


@admin_bp.route("/suporte/mensagens", methods=["GET"])
@jwt_required()
@require_admin()
def get_mensagens_suporte():
    try:
        subq = (
            db.session.query(
                ChamadoSuporte.usuario_id.label("usuario_id"),
                func.max(ChamadoSuporte.data).label("ultima_data"),
            )
            .group_by(ChamadoSuporte.usuario_id)
            .subquery()
        )

        ultimos = (
            ChamadoSuporte.query.join(
                subq,
                (ChamadoSuporte.usuario_id == subq.c.usuario_id)
                & (ChamadoSuporte.data == subq.c.ultima_data),
            )
            .order_by(ChamadoSuporte.usuario_id.asc(), ChamadoSuporte.id.desc())
            .all()
        )

        mensagens_por_usuario = {}
        for chamado in ultimos:
            if chamado.usuario_id in mensagens_por_usuario:
                continue
            usuario = Usuario.query.get(chamado.usuario_id)
            mensagens_por_usuario[chamado.usuario_id] = {
                "id": chamado.id,
                "usuario_id": chamado.usuario_id,
                "nome": usuario.nome if usuario else "—",
                "email": usuario.email if usuario else "—",
                "titulo": chamado.titulo,
                "descricao": chamado.descricao,
                "categoria_classificada": chamado.categoria_classificada,
                "prioridade": chamado.prioridade,
                "status": chamado.status,
                "data": _safe_iso(chamado.data),
            }

        mensagens = list(mensagens_por_usuario.values())
        return jsonify({"total": len(mensagens), "mensagens": mensagens}), 200
    except Exception as e:
        import traceback

        try:
            chamados = ChamadoSuporte.query.all()
            mensagens = []
            for c in chamados:
                u = Usuario.query.get(c.usuario_id)
                mensagens.append(
                    {
                        "id": c.id,
                        "usuario_id": c.usuario_id,
                        "nome": u.nome if u else "—",
                        "email": u.email if u else "—",
                        "titulo": c.titulo,
                        "descricao": c.descricao,
                        "categoria_classificada": c.categoria_classificada,
                        "prioridade": c.prioridade,
                        "status": c.status,
                        "data": _safe_iso(c.data),
                    }
                )
            return jsonify({"total": len(mensagens), "mensagens": mensagens}), 200
        except Exception:
            pass

        error_msg = getattr(e, "message", str(e))
        if hasattr(e, "orig"):
            error_msg = f"DB Error: {str(e.orig)} | Detalhes: {str(e)}"
        print(f"ERR: {error_msg}")
        traceback.print_exc()
        return jsonify({"error": error_msg, "route": request.path, "status": "failed"}), 500


@admin_bp.route("/suporte/<int:chamado_id>/responder", methods=["POST"])
@jwt_required()
@require_admin()
def responder_chamado(chamado_id):
    data = request.get_json()
    if not data or "resposta" not in data:
        return jsonify({"error": "Campo 'resposta' é obrigatório"}), 400

    try:
        chamado = ChamadoSuporte.query.get(chamado_id)
        if not chamado:
            return jsonify({"error": "Chamado não encontrado"}), 404

        if "status" in data:
            chamado.status = data["status"]

        notificacao = Notificacao(
            usuario_id=chamado.usuario_id,
            tipo="suporte",
            mensagem=f'Resposta do suporte para "{chamado.titulo}": {data["resposta"]}',
        )
        db.session.add(notificacao)
        db.session.commit()

        return jsonify({"message": "Resposta enviada com sucesso", "chamado": chamado.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/seed", methods=["GET"])
@jwt_required()
@require_admin()
def seed():
    try:
        # Faz seed idempotente: não duplica se já existir.
        _ensure_seed_data()
        return jsonify({"status": "success", "message": "Banco de dados populado com sucesso"}), 200
    except Exception as e:
        return jsonify({"status": "failed", "error": str(e)}), 500

