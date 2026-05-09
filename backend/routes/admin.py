from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import db, Usuario, Pedido, Orcamento, ChamadoSuporte, Notificacao
from ..utils import require_admin
from sqlalchemy import func
from datetime import datetime, timedelta

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/admin/dashboard', methods=['GET'])
@jwt_required()
@require_admin()
def get_dashboard():
    """Retorna estatísticas do dashboard"""
    try:
        # Estatísticas gerais
        total_usuarios = Usuario.query.count()
        total_pedidos = Pedido.query.count()
        total_orcamentos = Orcamento.query.count()
        total_chamados = ChamadoSuporte.query.count()
        
        # Pedidos por status
        pedidos_por_status = db.session.query(
            Pedido.status,
            func.count(Pedido.id)
        ).group_by(Pedido.status).all()
        
        # Chamados por prioridade
        chamados_por_prioridade = db.session.query(
            ChamadoSuporte.prioridade,
            func.count(ChamadoSuporte.id)
        ).group_by(ChamadoSuporte.prioridade).all()
        
        # Receita estimada
        receita_total = db.session.query(
            func.sum(Pedido.valor_estimado)
        ).scalar() or 0
        
        # Usuários mais ativos (por número de pedidos)
        usuarios_ativos = db.session.query(
            Usuario.id,
            Usuario.nome,
            Usuario.email,
            func.count(Pedido.id).label('num_pedidos')
        ).outerjoin(Pedido).group_by(Usuario.id).order_by(
            func.count(Pedido.id).desc()
        ).limit(10).all()
        
        return jsonify({
            "total_usuarios": total_usuarios,
            "total_pedidos": total_pedidos,
            "total_orcamentos": total_orcamentos,
            "total_chamados": total_chamados,
            "receita_total": float(receita_total),
            "pedidos_por_status": [
                {"status": status, "count": count} 
                for status, count in pedidos_por_status
            ],
            "chamados_por_prioridade": [
                {"prioridade": prioridade, "count": count} 
                for prioridade, count in chamados_por_prioridade
            ],
            "usuarios_ativos": [
                {
                    "id": u.id,
                    "nome": u.nome,
                    "email": u.email,
                    "num_pedidos": u.num_pedidos
                }
                for u in usuarios_ativos
            ]
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@admin_bp.route('/admin/clientes', methods=['GET'])
@jwt_required()
@require_admin()
def get_clientes():
    """Retorna lista de todos os clientes com seus dados"""
    try:
        usuarios = Usuario.query.filter_by(role='user').all()
        
        clientes = []
        for usuario in usuarios:
            pedidos = Pedido.query.filter_by(usuario_id=usuario.id).all()
            chamados = ChamadoSuporte.query.filter_by(usuario_id=usuario.id).all()
            orcamentos = Orcamento.query.filter_by(usuario_id=usuario.id).all()
            
            valor_total = sum(p.valor_estimado or 0 for p in pedidos)
            
            clientes.append({
                "id": usuario.id,
                "nome": usuario.nome,
                "email": usuario.email,
                "telefone": usuario.telefone,
                "data_cadastro": usuario.data_cadastro.isoformat(),
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
                "orcamentos": [o.to_dict() for o in orcamentos]
            })
        
        return jsonify({
            "total": len(clientes),
            "clientes": clientes
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@admin_bp.route('/admin/cliente/<int:cliente_id>', methods=['GET'])
@jwt_required()
@require_admin()
def get_cliente_detalhes(cliente_id):
    """Retorna detalhes completos de um cliente"""
    try:
        usuario = Usuario.query.get(cliente_id)
        
        if not usuario:
            return jsonify({"error": "Cliente não encontrado"}), 404
        
        pedidos = Pedido.query.filter_by(usuario_id=cliente_id).all()
        chamados = ChamadoSuporte.query.filter_by(usuario_id=cliente_id).all()
        orcamentos = Orcamento.query.filter_by(usuario_id=cliente_id).all()
        notificacoes = Notificacao.query.filter_by(usuario_id=cliente_id).all()
        
        valor_total = sum(p.valor_estimado or 0 for p in pedidos)
        
        return jsonify({
            "usuario": usuario.to_dict(),
            "pedidos": [p.to_dict() for p in pedidos],
            "chamados": [c.to_dict() for c in chamados],
            "orcamentos": [o.to_dict() for o in orcamentos],
            "notificacoes": [n.to_dict() for n in notificacoes],
            "resumo": {
                "num_pedidos": len(pedidos),
                "num_chamados": len(chamados),
                "num_orcamentos": len(orcamentos),
                "valor_total": valor_total,
                "taxa_conclusao": round(
                    len([p for p in pedidos if p.status == 'concluido']) / len(pedidos) * 100
                ) if pedidos else 0
            }
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@admin_bp.route('/admin/relatorio/ml', methods=['GET'])
@jwt_required()
@require_admin()
def get_relatorio_ml():
    """Retorna relatório de desempenho dos modelos ML"""
    try:
        # Análise de categorias de chamados (classificador)
        categorias = db.session.query(
            ChamadoSuporte.categoria_classificada,
            func.count(ChamadoSuporte.id)
        ).filter(ChamadoSuporte.categoria_classificada != None).group_by(
            ChamadoSuporte.categoria_classificada
        ).all()
        
        # Análise de prioridades (classificador)
        prioridades = db.session.query(
            ChamadoSuporte.prioridade,
            func.count(ChamadoSuporte.id)
        ).group_by(ChamadoSuporte.prioridade).all()
        
        # Tipos de serviço mais solicitados (recomendador)
        tipos_servico = db.session.query(
            Pedido.tipo_servico,
            func.count(Pedido.id),
            func.avg(Pedido.valor_estimado)
        ).group_by(Pedido.tipo_servico).all()
        
        # Tendências de orçamento (estimador)
        orcamentos_trend = db.session.query(
            Orcamento.tipo,
            func.avg(Orcamento.valor_estimado),
            func.count(Orcamento.id)
        ).group_by(Orcamento.tipo).all()
        
        return jsonify({
            "classificador_suporte": {
                "categorias": [
                    {"categoria": cat, "count": count}
                    for cat, count in categorias
                ],
                "prioridades": [
                    {"prioridade": pri, "count": count}
                    for pri, count in prioridades
                ]
            },
            "recomendador_servicos": [
                {
                    "tipo": tipo,
                    "count": count,
                    "valor_medio": float(valor or 0)
                }
                for tipo, count, valor in tipos_servico
            ],
            "estimador_orcamento": [
                {
                    "tipo": tipo,
                    "valor_medio": float(valor or 0),
                    "count": count
                }
                for tipo, valor, count in orcamentos_trend
            ]
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@admin_bp.route('/admin/usuario/<int:usuario_id>/promocao', methods=['POST'])
@jwt_required()
@require_admin()
def promover_admin(usuario_id):
    """Promove um usuário a admin"""
    try:
        usuario = Usuario.query.get(usuario_id)
        
        if not usuario:
            return jsonify({"error": "Usuário não encontrado"}), 404
        
        usuario.role = 'admin'
        db.session.commit()
        
        return jsonify({
            "message": "Usuário promovido a admin",
            "usuario": usuario.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@admin_bp.route('/admin/suporte/mensagens', methods=['GET'])
@jwt_required()
@require_admin()
def get_mensagens_suporte():
    """Retorna todas as mensagens de suporte para admin"""
    try:
        chamados = ChamadoSuporte.query.all()
        
        mensagens = []
        for chamado in chamados:
            usuario = Usuario.query.get(chamado.usuario_id)
            mensagens.append({
                "id": chamado.id,
                "usuario_id": chamado.usuario_id,
                "nome": usuario.nome,
                "email": usuario.email,
                "titulo": chamado.titulo,
                "descricao": chamado.descricao,
                "categoria_classificada": chamado.categoria_classificada,
                "prioridade": chamado.prioridade,
                "status": chamado.status,
                "data": chamado.data.isoformat()
            })
        
        return jsonify({
            "total": len(mensagens),
            "mensagens": mensagens
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@admin_bp.route('/admin/suporte/<int:chamado_id>/responder', methods=['POST'])
@jwt_required()
@require_admin()
def responder_chamado(chamado_id):
    """Admin responde a um chamado de suporte"""
    data = request.get_json()
    if not data or 'resposta' not in data:
        return jsonify({"error": "Campo 'resposta' é obrigatório"}), 400
    
    try:
        chamado = ChamadoSuporte.query.get(chamado_id)
        if not chamado:
            return jsonify({"error": "Chamado não encontrado"}), 404
        
        # Atualizar status se fornecido
        if 'status' in data:
            chamado.status = data['status']
        
        # Criar notificação para o usuário
        notificacao = Notificacao(
            usuario_id=chamado.usuario_id,
            tipo='suporte',
            mensagem=f'Resposta do suporte para "{chamado.titulo}": {data["resposta"]}'
        )
        db.session.add(notificacao)
        db.session.commit()
        
        return jsonify({
            "message": "Resposta enviada com sucesso",
            "chamado": chamado.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@admin_bp.route('/admin/pedidos', methods=['GET'])
@jwt_required()
@require_admin()
def get_pedidos():
    """Retorna lista de todos os pedidos"""
    try:
        pedidos = Pedido.query.all()
        pedidos_data = []
        
        for pedido in pedidos:
            usuario = Usuario.query.get(pedido.usuario_id)
            pedidos_data.append({
                "id": pedido.id,
                "usuario_id": pedido.usuario_id,
                "usuario_nome": usuario.nome if usuario else "Usuário não encontrado",
                "usuario_email": usuario.email if usuario else "",
                "servico": pedido.servico,
                "descricao": pedido.descricao,
                "status": pedido.status,
                "valor_estimado": float(pedido.valor_estimado) if pedido.valor_estimado else None,
                "data_criacao": pedido.data_criacao.isoformat() if pedido.data_criacao else None
            })
        
        return jsonify({"pedidos": pedidos_data}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@admin_bp.route('/admin/pedido/<int:pedido_id>', methods=['GET'])
@jwt_required()
@require_admin()
def get_pedido(pedido_id):
    """Retorna detalhes de um pedido específico"""
    try:
        pedido = Pedido.query.get(pedido_id)
        if not pedido:
            return jsonify({"error": "Pedido não encontrado"}), 404
        
        usuario = Usuario.query.get(pedido.usuario_id)
        
        return jsonify({
            "id": pedido.id,
            "usuario_id": pedido.usuario_id,
            "usuario_nome": usuario.nome if usuario else "Usuário não encontrado",
            "usuario_email": usuario.email if usuario else "",
            "servico": pedido.servico,
            "descricao": pedido.descricao,
            "status": pedido.status,
            "valor_estimado": float(pedido.valor_estimado) if pedido.valor_estimado else None,
            "data_criacao": pedido.data_criacao.isoformat() if pedido.data_criacao else None
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@admin_bp.route('/admin/pedido/<int:pedido_id>/status', methods=['PUT'])
@jwt_required()
@require_admin()
def update_pedido_status(pedido_id):
    """Atualiza o status de um pedido"""
    data = request.get_json()
    if not data or 'status' not in data:
        return jsonify({"error": "Campo 'status' é obrigatório"}), 400
    
    try:
        pedido = Pedido.query.get(pedido_id)
        if not pedido:
            return jsonify({"error": "Pedido não encontrado"}), 404
        
        pedido.status = data['status']
        db.session.commit()
        
        return jsonify({
            "message": "Status atualizado com sucesso",
            "pedido": {
                "id": pedido.id,
                "status": pedido.status
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
