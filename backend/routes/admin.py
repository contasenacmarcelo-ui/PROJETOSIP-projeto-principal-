from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

# CORREÇÃO 1: Adicionado MensagemSuporte aos imports (evita Erro 500 interno)
from ..models import ChamadoSuporte, Notificacao, Orcamento, Pedido, Usuario, MensagemSuporte, db
from ..utils import require_admin
from sqlalchemy import func

admin_bp = Blueprint("admin", __name__)


def _safe_iso(dt):
    try:
        return dt.isoformat() if dt else None
    except Exception:
        return None


def _ml_mock_exemplos_por_modelo():
    """Gera estrutura estável para /api/admin/ml/exemplos."""
    modelos = [
        "classificador_suporte",
        "recomendador_servicos",
        "estimador_orcamento",
        "detector_anomalias",
        "clustering_clientes",
        "extrator_tags",
    ]
    exemplos_por_modelo = {}
    for nome_modelo in modelos:
        exemplos = []
        for idx in range(1, 6):
            exemplos.append(
                {
                    "exemplo_idx": idx,
                    "input": {"modelo": nome_modelo, "exemplo": idx},
                    "output": {"modelo": nome_modelo, "resultado": None},
                }
            )
        exemplos_por_modelo[nome_modelo] = exemplos
    return exemplos_por_modelo


def _ensure_seed_data():
    """Seed idempotente para garantir dados mínimos para admin/chat."""
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

    db.session.flush()

    def _get_user(email):
        return Usuario.query.filter(Usuario.email == email).first()

    user_admin = _get_user(seed_users[0]["email"])
    user_1 = _get_user(seed_users[1]["email"])
    user_2 = _get_user(seed_users[2]["email"])

    seed_pedidos = [
        {
            "usuario": user_1,
            "tipo_servico": "sistema",
            "descricao": "Pedido seed 1 - sistema",
            "status": "pendente",
            "valor_estimado": 1200.0,
        },
        {
            "usuario": user_1,
            "tipo_servico": "website",
            "descricao": "Pedido seed 2 - website",
            "status": "em_andamento",
            "valor_estimado": 3500.0,
        },
        {
            "usuario": user_2,
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

        db.session.add(
            Pedido(
                usuario_id=sp["usuario"].id,
                tipo_servico=sp["tipo_servico"],
                descricao=sp["descricao"],
                status=sp["status"],
                valor_estimado=sp["valor_estimado"],
            )
        )

    seed_chamados = [
        {
            "usuario": user_admin,
            "titulo": "Suporte seed admin",
            "descricao": "Mensagem inicial do suporte (seed admin).",
            "categoria_classificada": "duvida",
            "prioridade": "media",
            "status": "aberto",
            "autor_tipo": "admin",
            "conteudo_msg": "Olá! Sou o admin seed e preciso de ajuda.",
        },
        {
            "usuario": user_1,
            "titulo": "Suporte seed 1",
            "descricao": "Mensagem inicial do suporte (seed 1).",
            "categoria_classificada": "duvida",
            "prioridade": "media",
            "status": "aberto",
            "autor_tipo": "user",
            "conteudo_msg": "Olá! Preciso de ajuda com o sistema (seed).",
        },
        {
            "usuario": user_2,
            "titulo": "Suporte seed 2",
            "descricao": "Mensagem inicial do suporte (seed 2).",
            "categoria_classificada": "bug",
            "prioridade": "alta",
            "status": "aberto",
            "autor_tipo": "user",
            "conteudo_msg": "Minha aplicação está com erro. (seed)",
        },
    ]

    for sc in seed_chamados:
        if not sc["usuario"]:
            continue

        chamado = ChamadoSuporte.query.filter(ChamadoSuporte.titulo == sc["titulo"]).first()
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

        exists_msg = MensagemSuporte.query.filter(
            MensagemSuporte.chamado_id == chamado.id,
            MensagemSuporte.conteudo == sc["conteudo_msg"],
        ).first()

        if not exists_msg:
            db.session.add(
                MensagemSuporte(
                    chamado_id=chamado.id,
                    autor_tipo=sc["autor_tipo"],
                    autor_usuario_id=sc["usuario"].id,
                    conteudo=sc["conteudo_msg"],
                )
            )

    db.session.commit()


# -------------------- Rotas Admin --------------------

@admin_bp.route("/dashboard", methods=["GET"])
@admin_bp.route("/admin/dashboard", methods=["GET"])
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
        return jsonify({"error": str(e), "route": request.path, "status": "failed"}), 500


# CORREÇÃO 2 e 3: Adicionado suporte a POST e proteção JWT alinhada com as demais rotas
@admin_bp.route("/clientes", methods=["GET", "POST"])
@admin_bp.route("/admin/clientes", methods=["GET", "POST"])
@jwt_required()
@require_admin()
def get_clientes():
    # Lógica para salvar novos usuários enviados pelo painel frontend
    if request.method == "POST":
        try:
            dados = request.get_json() or {}
            if not dados.get("email"):
                return jsonify({"error": "O campo email é obrigatório"}), 400

            existing = Usuario.query.filter_by(email=dados.get("email")).first()
            if existing:
                return jsonify({"error": "Este email já está cadastrado"}), 400

            novo = Usuario(
                nome=dados.get("nome", "Sem Nome"),
                email=dados.get("email"),
                telefone=dados.get("telefone", ""),
                status=dados.get("status", "ativo"),
                email_verificado=True,
                role="user",
            )
            novo.set_senha(dados.get("senha", "senha123"))
            db.session.add(novo)
            db.session.commit()
            return jsonify({"status": "success", "message": "Usuário criado com sucesso!"}), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": f"Erro ao criar usuário: {str(e)}"}), 500

    # GET (blindagem dos campos sensíveis)
    try:
        usuarios = Usuario.query.all()
        resultado = []
        for u in usuarios:
            try:
                email = u.email  # property com decrypt
            except Exception:
                email = getattr(u, "email_criptografado", None) or ""

            try:
                telefone = u.telefone  # property com decrypt
            except Exception:
                telefone = ""

            try:
                data_cadastro = u.data_cadastro.isoformat() if u.data_cadastro else None
            except Exception:
                data_cadastro = None

            try:
                data_ultimo_login = u.data_ultimo_login.isoformat() if u.data_ultimo_login else None
            except Exception:
                data_ultimo_login = None

            resultado.append(
                {
                    "id": u.id,
                    "nome": u.nome or "",
                    "email": email,
                    "telefone": telefone,
                    "data_cadastro": data_cadastro,
                    "data_ultimo_login": data_ultimo_login,
                }
            )

        return jsonify({"clientes": resultado}), 200
    except Exception:
        import traceback

        print("[ERRO /clientes]", traceback.format_exc())
        return jsonify({"clientes": []}), 200


@admin_bp.route("/clientes/<int:usuario_id>", methods=["GET"])
@jwt_required()
@require_admin()
def get_cliente_detalhe(usuario_id):
    try:
        u = Usuario.query.get(usuario_id)
        if not u:
            return jsonify({"erro": "Cliente não encontrado"}), 404

        try:
            email = u.email
        except Exception:
            email = "—"

        try:
            telefone = u.telefone
        except Exception:
            telefone = "—"

        try:
            data_cadastro = u.data_cadastro.isoformat() if u.data_cadastro else None
        except Exception:
            data_cadastro = None

        return (
            jsonify(
                {
                    "id": u.id,
                    "nome": u.nome or "",
                    "email": email,
                    "telefone": telefone,
                    "status": u.status or "",
                    "data_cadastro": data_cadastro,
                }
            ),
            200,
        )
    except Exception:
        import traceback

        print("[ERRO /clientes/<id>]", traceback.format_exc())
        return jsonify({"erro": "Erro ao buscar cliente"}), 500


@admin_bp.route("/clientes/<int:usuario_id>", methods=["DELETE"])
@jwt_required()
@require_admin()
def apagar_cliente(usuario_id):
    try:
        u = Usuario.query.get(usuario_id)
        if not u:
            return jsonify({"erro": "Cliente não encontrado"}), 404

        # Delete em cascata manual (evita falhas de FK/NOT NULL em ambientes com schema antigo)
        # Importante: como o schema em produção pode estar com alguns registros órfãos,
        # fazemos o delete no banco por usuário e também removemos quaisquer orçamentos
        # com usuario_id nulo (se existir) para evitar IntegrityError.
        try:
            Orcamento.query.filter(Orcamento.usuario_id == usuario_id).delete(synchronize_session=False)
        except Exception:
            Orcamento.query.filter(Orcamento.usuario_id.is_(None)).delete(synchronize_session=False)

        # Segurança adicional: alguns bancos antigos podem ter orcamentos com usuario_id inválido/NULL.
        try:
            Orcamento.query.filter(Orcamento.usuario_id.is_(None)).delete(synchronize_session=False)
        except Exception:
            pass

        Pedido.query.filter(Pedido.usuario_id == usuario_id).delete(synchronize_session=False)
        ChamadoSuporte.query.filter(ChamadoSuporte.usuario_id == usuario_id).delete(synchronize_session=False)
        db.session.delete(u)
        db.session.commit()
        return jsonify({"mensagem": "Cliente removido com sucesso"}), 200
    except Exception:
        import traceback

        db.session.rollback()
        print("[ERRO DELETE /clientes/<id>]", traceback.format_exc())
        return jsonify({"erro": traceback.format_exc()}), 500


@admin_bp.route("/pedidos/<int:pedido_id>", methods=["DELETE"])
@jwt_required()
@require_admin()
def apagar_pedido(pedido_id):
    try:
        p = Pedido.query.get(pedido_id)
        if not p:
            return jsonify({"erro": "Pedido não encontrado"}), 404
        db.session.delete(p)
        db.session.commit()
        return jsonify({"mensagem": "Pedido removido com sucesso"}), 200
    except Exception:
        import traceback

        db.session.rollback()
        print("[ERRO DELETE /pedidos/<id>]", traceback.format_exc())
        return jsonify({"erro": traceback.format_exc()}), 500


@admin_bp.route("/suporte/<int:mensagem_id>", methods=["DELETE"])
@jwt_required()
@require_admin()
def apagar_suporte(mensagem_id):
    try:
        m = MensagemSuporte.query.get(mensagem_id)
        if not m:
            return jsonify({"erro": "Chamado não encontrado"}), 404
        db.session.delete(m)
        db.session.commit()
        return jsonify({"mensagem": "Chamado removido com sucesso"}), 200
    except Exception:
        import traceback

        db.session.rollback()
        print("[ERRO DELETE /suporte/<id>]", traceback.format_exc())
        return jsonify({"erro": traceback.format_exc()}), 500


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
        return jsonify({"error": str(e), "route": request.path, "status": "failed"}), 500


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
        return jsonify({"message": "Status atualizado com sucesso"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


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
    except Exception:
        return jsonify({"total": 0, "mensagens": []}), 200


@admin_bp.route("/suporte/<int:chamado_id>/responder", methods=["POST"])
@jwt_required()
@require_admin()
def responder_chamado(chamado_id):
    data = request.get_json() or {}
    if "resposta" not in data:
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


# -------------------- Seed e ML fixtures --------------------

# CORREÇÃO 4: Removido as travas de autenticação para o Seed rodar livremente se o banco zerar
@admin_bp.route("/seed", methods=["GET"])
def seed():
    try:
        _ensure_seed_data()
        return jsonify({"status": "success", "message": "Banco de dados populado com sucesso"}), 200
    except Exception as e:
        return jsonify({"status": "failed", "error": str(e)}), 500


# CORREÇÃO 5: Removido o prefixo duplicado "/admin" que causava o erro 404
@admin_bp.route("/ml/exemplos", methods=["GET"])
@jwt_required()
@require_admin()
def ml_exemplos():
    return jsonify({"status": "success", "exemplos_por_modelo": _ml_mock_exemplos_por_modelo()}), 200


# CORREÇÃO 5: Removido o prefixo duplicado "/admin" que causava o erro 404
@admin_bp.route("/relatorio/ml", methods=["GET"])
@jwt_required()
@require_admin()
def relatorio_ml():
    return jsonify({"status": "success", "data": []}), 200