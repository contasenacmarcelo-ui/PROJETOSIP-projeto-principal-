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
        import traceback

        error_msg = getattr(e, "message", str(e))
        if hasattr(e, "orig"):
            error_msg = f"DB Error: {str(e.orig)} | Detalhes: {str(e)}"
        print(f"ERR: {error_msg}")
        traceback.print_exc()
        return jsonify({"error": error_msg, "route": request.path, "status": "failed"}), 500


# OBS: run.py registra admin_bp com url_prefix='/api'.
# Portanto estas rotas ficam em: /api/clientes e /api/suporte/mensagens.

@admin_bp.route("/clientes", methods=["GET"])
@require_admin()
def get_clientes():
    try:
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
                    "data_cadastro": usuario.data_cadastro.isoformat()
                    if usuario.data_cadastro
                    else None,
                    "data_ultimo_login": usuario.data_ultimo_login.isoformat()
                    if usuario.data_ultimo_login
                    else None,
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

        # fallback de segurança
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


@admin_bp.route("/admin/pedidos", methods=["GET"])
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

        # fallback de segurança
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


@admin_bp.route("/admin/pedido/<int:pedido_id>", methods=["GET", "DELETE"])
@jwt_required()
@require_admin()
def pedido_detail(pedido_id):
    # DELETE (apagar pedido)
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

    # GET (detalhes)
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
                    "valor_estimado": float(pedido.valor_estimado)
                    if pedido.valor_estimado
                    else None,
                    "data_criacao": pedido.data_criacao.isoformat() if pedido.data_criacao else None,
                }
            ),
            200,
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/admin/pedido/<int:pedido_id>/status", methods=["PUT"])
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


@admin_bp.route("/admin/suporte/<int:chamado_id>/responder", methods=["POST"])
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

