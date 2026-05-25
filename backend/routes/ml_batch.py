from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import db, Usuario, Pedido, ChamadoSuporte, Orcamento
from ..ml_models.classificador_suporte import classificar_chamado
from ..ml_models.estimador_orcamento import estimar_orcamento
from ..ml_models.detector_anomalias import detectar_anomalia
from ..ml_models.clustering_clientes import clusterizar_cliente
from ..ml_models.extrator_tags import extrair_tags
from ..ml_models.recomendador_servicos import recomendar_servicos
from ..utils import require_admin
from datetime import datetime

ml_batch_bp = Blueprint('ml_batch', __name__)

_ALLOWED_STATUS = {'pendente', 'em_andamento', 'concluido', 'cancelado', 'aberto', 'fechado'}


def _safe_str(x, default=''):
    return x if isinstance(x, str) else default


def _parse_parametros(obj):
    # aceita dict ou json string; retorna dict
    if obj is None:
        return {}
    if isinstance(obj, dict):
        return obj
    if isinstance(obj, str):
        import json
        try:
            parsed = json.loads(obj)
            return parsed if isinstance(parsed, dict) else {}
        except Exception:
            return {}
    return {}


@ml_batch_bp.route('/admin/ml/sync', methods=['POST'])
@jwt_required()
@require_admin()
def sync_ml_from_db():
    """Executa ML com base nos dados já existentes no banco.

    Regras (idempotente e sem quebrar compatibilidade):
    - Chamados: se categoria_classificada ou prioridade estiver vazio, executa classificador.
    - Pedidos: se valor_estimado estiver vazio, executa estimador com tipo_servico + parametros vazios.
    - Orcamentos: (opcional) se valor_estimado vazio, executa estimador com tipo + parametros.

    Retorna preview do que foi atualizado.
    """
    try:
        # Limite de processamento para evitar travar request
        payload = {}  # mantendo compatível mesmo sem body
        # Flask pode receber request body vazio; ignoramos.
        _ = payload

        limit = 50
        updated = {
            'chamados': [],
            'pedidos': [],
            'orcamentos': []
        }

        # 1) Chamados
        chamados_q = ChamadoSuporte.query.order_by(ChamadoSuporte.data.desc()).limit(limit).all()
        for chamado in chamados_q:
            needs_categoria = not chamado.categoria_classificada
            needs_prioridade = not chamado.prioridade
            if not (needs_categoria or needs_prioridade):
                continue

            resultado = classificar_chamado(_safe_str(chamado.descricao))
            chamado.categoria_classificada = resultado.get('categoria')
            chamado.prioridade = resultado.get('prioridade')
            updated['chamados'].append({
                'id': chamado.id,
                'categoria_classificada': chamado.categoria_classificada,
                'prioridade': chamado.prioridade,
                'confianca_categoria': resultado.get('confianca_categoria'),
                'confianca_prioridade': resultado.get('confianca_prioridade')
            })

        # 2) Pedidos
        pedidos_q = Pedido.query.order_by(Pedido.data_criacao.desc()).limit(limit).all()
        for pedido in pedidos_q:
            if pedido.valor_estimado is not None:
                continue

            # Não temos parametros no Pedido; estimador aceita dict (pode ser vazio)
            parametros = {}
            estimativa = estimar_orcamento(pedido.tipo_servico, parametros)
            pedido.valor_estimado = estimativa.get('valor_estimado')
            updated['pedidos'].append({
                'id': pedido.id,
                'valor_estimado': pedido.valor_estimado,
                'intervalo': estimativa.get('intervalo_confianca')
            })

        # 3) Orcamentos
        orcamentos_q = Orcamento.query.order_by(Orcamento.data.desc()).limit(limit).all()
        for orc in orcamentos_q:
            if orc.valor_estimado is not None:
                continue
            parametros = _parse_parametros(orc.parametros)
            estimativa = estimar_orcamento(orc.tipo, parametros)
            orc.valor_estimado = estimativa.get('valor_estimado')
            updated['orcamentos'].append({
                'id': orc.id,
                'valor_estimado': orc.valor_estimado,
                'intervalo': estimativa.get('intervalo_confianca')
            })

        db.session.commit()

        return jsonify({
            'message': 'ML sync executado a partir do banco',
            'updated': updated,
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Erro interno do servidor', 'details': str(e)}), 500


@ml_batch_bp.route('/admin/ml/preview', methods=['GET'])
@jwt_required()
@require_admin()
def ml_preview():
    """Preview do que seria atualizado (sem escrever no BD)."""
    try:
        limit = 20
        chamados_q = ChamadoSuporte.query.order_by(ChamadoSuporte.data.desc()).limit(limit).all()
        pedidos_q = Pedido.query.order_by(Pedido.data_criacao.desc()).limit(limit).all()
        orcamentos_q = Orcamento.query.order_by(Orcamento.data.desc()).limit(limit).all()

        preview = {'chamados': [], 'pedidos': [], 'orcamentos': []}

        for chamado in chamados_q:
            if chamado.categoria_classificada and chamado.prioridade:
                continue
            r = classificar_chamado(_safe_str(chamado.descricao))
            preview['chamados'].append({
                'id': chamado.id,
                'categoria_classificada': r.get('categoria'),
                'prioridade': r.get('prioridade'),
                'confianca_categoria': r.get('confianca_categoria'),
                'confianca_prioridade': r.get('confianca_prioridade')
            })

        for pedido in pedidos_q:
            if pedido.valor_estimado is not None:
                continue
            r = estimar_orcamento(pedido.tipo_servico, {})
            preview['pedidos'].append({'id': pedido.id, 'valor_estimado': r.get('valor_estimado')})

        for orc in orcamentos_q:
            if orc.valor_estimado is not None:
                continue
            params = _parse_parametros(orc.parametros)
            r = estimar_orcamento(orc.tipo, params)
            preview['orcamentos'].append({'id': orc.id, 'valor_estimado': r.get('valor_estimado')})

        return jsonify({'preview': preview, 'limit': limit}), 200

    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor', 'details': str(e)}), 500

