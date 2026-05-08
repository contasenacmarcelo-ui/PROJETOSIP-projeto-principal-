import json


def clusterizar_cliente(historico_cliente):
    try:
        if isinstance(historico_cliente, str):
            historico_cliente = json.loads(historico_cliente)

        pedidos_totais = int(historico_cliente.get("pedidos_totais", 1))
        valor_total_gasto = float(historico_cliente.get("valor_total_gasto", 0))
        tempo_como_cliente_dias = int(historico_cliente.get("tempo_como_cliente_dias", 0))
        tipo_ultimo_pedido = historico_cliente.get("tipo_ultimo_pedido", "website")

        if pedidos_totais >= 8 or valor_total_gasto > 20000 or tempo_como_cliente_dias > 365:
            tipo = "premium"
            cluster = 2
        elif pedidos_totais >= 3 or valor_total_gasto > 5000 or tempo_como_cliente_dias > 120:
            tipo = "regular"
            cluster = 1
        else:
            tipo = "novo"
            cluster = 0

        score_calculado = calcular_score_valor(pedidos_totais, valor_total_gasto, tempo_como_cliente_dias)

        return {
            "cluster": cluster,
            "tipo_cliente": tipo,
            "descricao": {
                "novo": "Cliente novo com poucos pedidos",
                "regular": "Cliente regular com pedidos recorrentes",
                "premium": "Cliente premium de alto valor"
            }[tipo],
            "score_valor": round(score_calculado, 3),
            "caracteristicas": {
                "pedidos_totais": pedidos_totais,
                "valor_total_gasto": valor_total_gasto,
                "tempo_como_cliente_dias": tempo_como_cliente_dias,
                "tipo_ultimo_pedido": tipo_ultimo_pedido
            }
        }
    except Exception as e:
        return {
            "cluster": 1,
            "tipo_cliente": "regular",
            "descricao": "Cliente regular",
            "score_valor": 0.5,
            "caracteristicas": historico_cliente,
            "fallback": True,
            "erro": str(e)
        }


def calcular_score_valor(pedidos_totais, valor_total_gasto, tempo_dias):
    score_pedidos = min(pedidos_totais * 0.1, 0.5)

    if valor_total_gasto > 20000:
        score_valor = 0.3
    elif valor_total_gasto > 10000:
        score_valor = 0.2
    elif valor_total_gasto > 5000:
        score_valor = 0.1
    else:
        score_valor = 0.05

    if tempo_dias > 365:
        score_tempo = 0.2
    elif tempo_dias > 180:
        score_tempo = 0.15
    elif tempo_dias > 90:
        score_tempo = 0.1
    else:
        score_tempo = 0.05

    return min(score_pedidos + score_valor + score_tempo, 1.0)