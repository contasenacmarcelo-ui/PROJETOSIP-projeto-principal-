# Base de conhecimento de serviços
servicos_base = [
    {
        "nome": "Website Institucional",
        "tags": ["website", "institucional", "empresa", "corporativo"],
        "score_base": 0.8,
        "preco_base": 1500
    },
    {
        "nome": "Landing Page",
        "tags": ["landing", "page", "conversao", "marketing"],
        "score_base": 0.9,
        "preco_base": 800
    },
    {
        "nome": "E-commerce",
        "tags": ["loja", "online", "vendas", "produtos"],
        "score_base": 0.7,
        "preco_base": 3000
    },
    {
        "nome": "Sistema Web",
        "tags": ["sistema", "web", "aplicacao", "software"],
        "score_base": 0.6,
        "preco_base": 5000
    },
    {
        "nome": "App Mobile",
        "tags": ["app", "mobile", "android", "ios"],
        "score_base": 0.5,
        "preco_base": 8000
    },
    {
        "nome": "API REST",
        "tags": ["api", "rest", "integracao", "backend"],
        "score_base": 0.7,
        "preco_base": 2500
    }
]

def calcular_score_servico(servico, tipo_cliente, budget, necessidades):
    score = servico["score_base"]

    if tipo_cliente == "startup":
        if "landing" in servico["tags"] or "website" in servico["tags"]:
            score += 0.2
    elif tipo_cliente == "empresa":
        if "sistema" in servico["tags"] or "ecommerce" in servico["tags"]:
            score += 0.2
    elif tipo_cliente == "pessoa_fisica":
        if "website" in servico["tags"] or "landing" in servico["tags"]:
            score += 0.1

    preco_servico = servico["preco_base"]
    if budget is not None:
        try:
            budget_value = float(budget)
        except (TypeError, ValueError):
            budget_value = None
        if budget_value is not None:
            if preco_servico <= budget_value * 1.2:
                score += 0.1
            elif preco_servico > budget_value * 2:
                score -= 0.3

    if necessidades:
        necessidades_lower = necessidades.lower()
        tags_match = sum(1 for tag in servico["tags"] if tag in necessidades_lower)
        score += tags_match * 0.1

    return max(0.0, min(score, 1.0))

def recomendar_servicos(tipo_cliente, budget=None, necessidades=None, top_n=3):
    recomendacoes = []
    for servico in servicos_base:
        score = calcular_score_servico(servico, tipo_cliente, budget, necessidades)
        recomendacoes.append({
            "servico": servico["nome"],
            "score": round(score, 3),
            "preco_estimado": servico["preco_base"],
            "tags": servico["tags"]
        })

    recomendacoes.sort(key=lambda x: x["score"], reverse=True)
    return recomendacoes[:top_n]
