import json

ANOMALIAS = [
    {"valor": 10000, "paginas": 20, "funcionalidades": 15, "prazo_dias": 14},
    {"valor": 7000, "paginas": 15, "funcionalidades": 10, "prazo_dias": 30},
    {"valor": 5000, "paginas": 10, "funcionalidades": 8, "prazo_dias": 45},
]


def detectar_anomalia(parametros_pedido):
    try:
        if isinstance(parametros_pedido, str):
            parametros_pedido = json.loads(parametros_pedido)

        valor = float(parametros_pedido.get("valor", 0))
        paginas = int(parametros_pedido.get("paginas", 5))
        funcionalidades = int(parametros_pedido.get("funcionalidades", 3))
        prazo_dias = int(parametros_pedido.get("prazo_dias", 30))
        tipo_servico = parametros_pedido.get("tipo_servico", "website")

        score_risco = 0.0
        regras_risco = []

        if valor > 10000:
            score_risco += 0.35
            regras_risco.append("Valor muito alto")

        if prazo_dias < 7:
            score_risco += 0.25
            regras_risco.append("Prazo muito curto")

        if funcionalidades > 15:
            score_risco += 0.2
            regras_risco.append("Muitas funcionalidades")

        if paginas == 0 and funcionalidades > 5:
            score_risco += 0.1
            regras_risco.append("Projeto complexo sem páginas especificadas")

        if valor / max(paginas, 1) > 1200:
            score_risco += 0.15
            regras_risco.append("Valor por página elevado")

        if any(valor > item["valor"] and funcionalidades > item["funcionalidades"] for item in ANOMALIAS):
            score_risco += 0.1

        if tipo_servico.lower() in ["api", "sistema"] and prazo_dias < 14:
            score_risco += 0.1
            regras_risco.append("Prazo curto para serviços complexos")

        score_risco = min(score_risco, 1.0)
        eh_anomalia = score_risco >= 0.6

        return {
            "eh_anomalia": eh_anomalia,
            "score_risco": round(float(score_risco), 3),
            "nivel_risco": "alto" if score_risco > 0.7 else "medio" if score_risco > 0.4 else "baixo",
            "regras_acionadas": regras_risco
        }
    except Exception as e:
        return {
            "eh_anomalia": False,
            "score_risco": 0.5,
            "nivel_risco": "medio",
            "regras_acionadas": [],
            "fallback": True,
            "erro": str(e)
        }