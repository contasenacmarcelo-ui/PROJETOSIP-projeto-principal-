import json

BASES = {
    "website": 1500,
    "landing": 800,
    "ecommerce": 4000,
    "sistema": 6000,
    "app": 8000,
    "api": 2500
}

COMPLEXIDADE = {
    "baixa": 0.8,
    "media": 1.0,
    "alta": 1.3
}

TIPO_MULTIPLICADOR = {
    "website": 1.0,
    "landing": 0.6,
    "ecommerce": 1.5,
    "sistema": 1.8,
    "app": 2.0,
    "api": 1.1
}

def estimar_orcamento(tipo_servico, parametros):
    try:
        if isinstance(parametros, str):
            parametros = json.loads(parametros)

        tipo_servico = tipo_servico.lower()
        base = BASES.get(tipo_servico, 1500)
        complexidade = parametros.get("complexidade", "media").lower()
        coef_complexidade = COMPLEXIDADE.get(complexidade, 1.0)

        paginas = int(parametros.get("paginas", 5))
        funcionalidades = int(parametros.get("funcionalidades", 3))
        prazo_dias = int(parametros.get("prazo_dias", 30))

        valor = base
        valor += paginas * 120
        valor += funcionalidades * 220
        valor *= coef_complexidade
        valor *= TIPO_MULTIPLICADOR.get(tipo_servico, 1.0)
        valor += max(0, (45 - prazo_dias)) * 20

        intervalo_min = valor * 0.8
        intervalo_max = valor * 1.2

        return {
            "valor_estimado": round(float(valor), 2),
            "intervalo_confianca": {
                "minimo": round(float(intervalo_min), 2),
                "maximo": round(float(intervalo_max), 2)
            },
            "moeda": "BRL"
        }
    except Exception as e:
        valor_base = BASES.get(tipo_servico.lower(), 1500)
        return {
            "valor_estimado": valor_base,
            "intervalo_confianca": {
                "minimo": valor_base * 0.8,
                "maximo": valor_base * 1.2
            },
            "moeda": "BRL",
            "fallback": True,
            "erro": str(e)
        }