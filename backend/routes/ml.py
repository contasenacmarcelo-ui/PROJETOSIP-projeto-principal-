from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from ..ml_models.classificador_suporte import classificar_chamado
from ..ml_models.recomendador_servicos import recomendar_servicos
from ..ml_models.estimador_orcamento import estimar_orcamento
from ..ml_models.detector_anomalias import detectar_anomalia
from ..ml_models.clustering_clientes import clusterizar_cliente
from ..ml_models.extrator_tags import extrair_tags

ml_bp = Blueprint('ml', __name__)

@ml_bp.route('/classificador-suporte', methods=['POST'])
@jwt_required()
def api_classificar_suporte():
    """Classifica um chamado de suporte"""
    try:
        data = request.get_json()
        descricao = data.get('descricao', '')

        if not descricao:
            return jsonify({"error": "Descrição é obrigatória"}), 400

        resultado = classificar_chamado(descricao)

        return jsonify({
            "categoria": resultado["categoria"],
            "prioridade": resultado["prioridade"],
            "confianca_categoria": resultado["confianca_categoria"],
            "confianca_prioridade": resultado["confianca_prioridade"]
        }), 200

    except Exception as e:
        return jsonify({"error": "Erro interno do servidor"}), 500

@ml_bp.route('/recomendador-servicos', methods=['POST'])
@jwt_required()
def api_recomendar_servicos():
    """Recomenda serviços baseado no perfil do cliente"""
    try:
        data = request.get_json()
        tipo_cliente = data.get('tipo_cliente', 'empresa')
        budget = data.get('budget')
        necessidades = data.get('necessidades', '')

        recomendacoes = recomendar_servicos(tipo_cliente, budget, necessidades)

        return jsonify({
            "recomendacoes": recomendacoes
        }), 200

    except Exception as e:
        return jsonify({"error": "Erro interno do servidor"}), 500

@ml_bp.route('/estimador-orcamento', methods=['POST'])
@jwt_required()
def api_estimar_orcamento():
    """Estima valor de um projeto"""
    try:
        data = request.get_json()
        tipo_servico = data.get('tipo_servico', 'website')
        parametros = data.get('parametros', {})

        estimativa = estimar_orcamento(tipo_servico, parametros)

        return jsonify(estimativa), 200

    except Exception as e:
        return jsonify({"error": "Erro interno do servidor"}), 500

@ml_bp.route('/detector-anomalias', methods=['POST'])
@jwt_required()
def api_detectar_anomalias():
    """Detecta anomalias em pedidos/orçamentos"""
    try:
        data = request.get_json()
        parametros = data.get('parametros', {})

        resultado = detectar_anomalia(parametros)

        return jsonify(resultado), 200

    except Exception as e:
        return jsonify({"error": "Erro interno do servidor"}), 500

@ml_bp.route('/clustering-cliente', methods=['POST'])
@jwt_required()
def api_clustering_cliente():
    """Agrupa cliente em cluster"""
    try:
        data = request.get_json()
        historico = data.get('historico', {})

        resultado = clusterizar_cliente(historico)

        return jsonify(resultado), 200

    except Exception as e:
        return jsonify({"error": "Erro interno do servidor"}), 500

@ml_bp.route('/extrator-tags', methods=['POST'])
@jwt_required()
def api_extrator_tags():
    """Extrai tags e tecnologias de descrição"""
    try:
        data = request.get_json()
        descricao = data.get('descricao', '')

        if not descricao:
            return jsonify({"error": "Descrição é obrigatória"}), 400

        resultado = extrair_tags(descricao)

        return jsonify(resultado), 200

    except Exception as e:
        return jsonify({"error": "Erro interno do servidor"}), 500

@ml_bp.route('/status', methods=['GET'])
def status_modelos():
    """Retorna status dos modelos de ML"""
    return jsonify({
        "status": "todos_modelos_carregados",
        "modelos": [
            "classificador_suporte",
            "recomendador_servicos",
            "estimador_orcamento",
            "detector_anomalias",
            "clustering_clientes",
            "extrator_tags"
        ],
        "versao": "1.0"
    }), 200