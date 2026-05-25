from flask import Blueprint, jsonify, request
import traceback

ml_bp = Blueprint('ml_dashboard', __name__, url_prefix='/api/ml-executivo')


@ml_bp.route('/status', methods=['GET'])
def status():
    """Endpoint de health check"""
    return jsonify({
        'status': 'online',
        'message': 'ML Dashboard rodando corretamente'
    }), 200


@ml_bp.route('/dados', methods=['GET'])
def get_dados():
    """Busca dados do banco que precisam validação"""
    try:
        from ..models import db
        from ..models import ChamadoSuporte, Pedido


        limit = int(request.args.get('limit', 10))

        chamados = ChamadoSuporte.query.filter(

            (ChamadoSuporte.categoria_classificada == None) |
            (ChamadoSuporte.categoria_classificada == '') |
            (ChamadoSuporte.prioridade == None)
        ).order_by(ChamadoSuporte.data.desc()).limit(limit).all()

        pedidos = Pedido.query.filter(
            (Pedido.valor_estimado == None) |
            (Pedido.valor_estimado == 0)
        ).order_by(Pedido.data_criacao.desc()).limit(limit).all()

        return jsonify({
            'status': 'success',
            'chamados': [c.to_dict() if hasattr(c, 'to_dict') else vars(c) for c in chamados],
            'pedidos': [p.to_dict() if hasattr(p, 'to_dict') else vars(p) for p in pedidos],
            'total_chamados_pendentes': len(chamados),
            'total_pedidos_pendentes': len(pedidos),
            'timestamp': request.environ.get('REQUEST_TIME_FLOAT', None)
        }), 200

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e),
            'traceback': traceback.format_exc()
        }), 500


@ml_bp.route('/processar', methods=['POST'])
def processar():
    """Executa ML e preenche campos NULL"""
    try:
        from ..models import db, ChamadoSuporte, Pedido
        from ..ml_models.classificador_suporte import classificar_chamado
        from ..ml_models.estimador_orcamento import estimar_orcamento

        dados = request.get_json(silent=True) or {}

        resultados = {
            'status': 'success',
            'chamados_processados': 0,
            'pedidos_processados': 0,
            'detalhes_chamados': [],
            'detalhes_pedidos': [],
            'erros': []
        }

        # Chamados
        for chamado_data in dados.get('chamados', []):
            try:
                chamado_id = chamado_data.get('id')
                descricao = chamado_data.get('descricao', '')

                if not chamado_id:
                    raise ValueError('id do chamado ausente')

                chamado = ChamadoSuporte.query.get(chamado_id)
                if not chamado:
                    continue

                # Idempotência: só preenche se ainda estiver vazio
                if chamado.categoria_classificada and chamado.prioridade:
                    continue

                resultado = classificar_chamado(descricao)
                chamado.categoria_classificada = resultado.get('categoria')
                chamado.prioridade = resultado.get('prioridade')

                resultados['chamados_processados'] += 1
                resultados['detalhes_chamados'].append({
                    'id': chamado_id,
                    'categoria': chamado.categoria_classificada,
                    'prioridade': chamado.prioridade,
                    'confianca_categoria': resultado.get('confianca_categoria'),
                    'confianca_prioridade': resultado.get('confianca_prioridade')
                })

            except Exception as e:
                resultados['erros'].append(f"Chamado {chamado_data.get('id')}: {str(e)}")

        # Pedidos
        for pedido_data in dados.get('pedidos', []):
            try:
                pedido_id = pedido_data.get('id')

                if not pedido_id:
                    raise ValueError('id do pedido ausente')

                pedido = Pedido.query.get(pedido_id)
                if not pedido:
                    continue

                # Idempotência: só preenche se ainda estiver vazio
                if pedido.valor_estimado is not None:
                    continue

                tipo_servico = pedido.tipo_servico
                parametros = {}

                estimativa = estimar_orcamento(tipo_servico, parametros)
                pedido.valor_estimado = estimativa.get('valor_estimado')

                resultados['pedidos_processados'] += 1
                resultados['detalhes_pedidos'].append({
                    'id': pedido_id,
                    'valor_estimado': pedido.valor_estimado,
                    'intervalo_confianca': estimativa.get('intervalo_confianca')
                })

            except Exception as e:
                resultados['erros'].append(f"Pedido {pedido_data.get('id')}: {str(e)}")

        db.session.commit()
        return jsonify(resultados), 200

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e),
            'traceback': traceback.format_exc()
        }), 500

