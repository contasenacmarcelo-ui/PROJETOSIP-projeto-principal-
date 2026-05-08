import re

CATEGORIAS = {
    "login": ["login", "senha", "acessar conta", "entrar"],
    "bug": ["erro", "bug", "falha", "não funciona", "travando", "travado", "não abre"],
    "duvida": ["como", "duvida", "pergunta", "explicar", "informações"],
    "financeiro": ["pagamento", "cobrança", "fatura", "cobranca", "boleto", "cartão"],
    "manutencao": ["manutenção", "manutencao", "offline", "instável", "parado"],
    "cancelamento": ["cancelar", "cancelamento", "desistir", "encerrar"],
    "recuperacao": ["recuperar", "recuperação", "recuperar senha", "esqueci"],
    "compatibilidade": ["compatibilidade", "celular", "mobile", "iphone", "android"],
}

PRIORIDADES = {
    "alta": ["urgente", "imediato", "falha", "não consigo", "não consigo acessar", "erro grave"],
    "media": ["problema", "erro", "lentidão", "não funciona bem", "dúvida"],
    "baixa": ["como", "duvida", "informação", "consulta", "orientação"],
}

def _pontuar_texto(descricao, palavras_chave):
    descricao_lower = descricao.lower()
    score = 0
    for termo in palavras_chave:
        if termo in descricao_lower:
            score += 1
    return score


def classificar_chamado(descricao):
    """Classifica um chamado de suporte usando regras simples"""
    if not descricao:
        return {
            "categoria": "duvida",
            "prioridade": "media",
            "confianca_categoria": 0.5,
            "confianca_prioridade": 0.5
        }

    descricao_lower = descricao.lower()
    categorias_encontradas = {}
    prioridades_encontradas = {}

    for categoria, palavras in CATEGORIAS.items():
        categorias_encontradas[categoria] = _pontuar_texto(descricao_lower, palavras)

    for prioridade, palavras in PRIORIDADES.items():
        prioridades_encontradas[prioridade] = _pontuar_texto(descricao_lower, palavras)

    categoria_final = max(categorias_encontradas, key=categorias_encontradas.get)
    prioridade_final = max(prioridades_encontradas, key=prioridades_encontradas.get)

    conf_categoria = categorias_encontradas[categoria_final] / max(sum(categorias_encontradas.values()), 1)
    conf_prioridade = prioridades_encontradas[prioridade_final] / max(sum(prioridades_encontradas.values()), 1)

    if conf_categoria == 0:
        categoria_final = "duvida"
        conf_categoria = 0.5
    if conf_prioridade == 0:
        prioridade_final = "media"
        conf_prioridade = 0.5

    return {
        "categoria": categoria_final,
        "prioridade": prioridade_final,
        "confianca_categoria": round(float(conf_categoria), 3),
        "confianca_prioridade": round(float(conf_prioridade), 3)
    }
