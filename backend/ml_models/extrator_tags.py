import re

tecnologias_comuns = [
    "python", "javascript", "react", "vue", "angular", "node", "django", "flask",
    "php", "laravel", "java", "spring", "csharp", "dotnet", "mysql", "postgresql",
    "mongodb", "firebase", "aws", "azure", "docker", "kubernetes", "git", "html",
    "css", "bootstrap", "tailwind", "sass", "typescript", "jquery", "redux"
]

CATEGORIAS = {
    "website": ["website", "site", "web", "online", "internet"],
    "mobile": ["app", "aplicativo", "mobile", "android", "ios", "celular"],
    "sistema": ["sistema", "software", "plataforma", "aplicação", "gestão"],
    "ecommerce": ["ecommerce", "loja", "vendas", "compras", "produtos"],
    "api": ["api", "integração", "rest", "backend", "serviço"],
    "design": ["design", "ui", "ux", "interface", "visual"],
    "marketing": ["marketing", "campanha", "digital", "promoção", "conversão"],
    "dados": ["dados", "database", "relatório", "analytics", "banco"],
}


def extrair_tags(descricao):
    try:
        texto_lower = descricao.lower()
        tags_extraidas = []

        for categoria, termos in CATEGORIAS.items():
            if any(termo in texto_lower for termo in termos):
                tags_extraidas.append(categoria)

        tecnologias_encontradas = [tech for tech in tecnologias_comuns if tech in texto_lower]
        palavras_chave = extrair_palavras_chave(descricao)

        todas_tags = list(dict.fromkeys(tags_extraidas + palavras_chave))

        return {
            "tags": todas_tags,
            "tecnologias_sugeridas": tecnologias_encontradas,
            "tecnologias_mencionadas": tecnologias_encontradas,
            "palavras_chave": palavras_chave
        }
    except Exception as e:
        return {
            "tags": extrair_palavras_chave(descricao),
            "tecnologias_sugeridas": [],
            "tecnologias_mencionadas": [],
            "palavras_chave": extrair_palavras_chave(descricao),
            "fallback": True,
            "erro": str(e)
        }


def extrair_palavras_chave(texto):
    texto_lower = texto.lower()
    categorias = {
        "website": ["website", "site", "web", "online"],
        "mobile": ["app", "aplicativo", "mobile", "celular", "android", "ios"],
        "sistema": ["sistema", "software", "plataforma", "aplicação"],
        "ecommerce": ["loja", "ecommerce", "vendas", "produtos", "compras"],
        "api": ["api", "integração", "rest", "backend", "serviço"],
        "design": ["design", "ui", "ux", "interface", "visual"],
        "marketing": ["marketing", "campanha", "anúncio", "promoção"],
        "gestao": ["gestão", "administração", "controle", "crm"],
        "dados": ["dados", "banco", "database", "relatório", "analytics"]
    }

    tags_encontradas = []
    for categoria, palavras in categorias.items():
        for palavra in palavras:
            if palavra in texto_lower:
                tags_encontradas.append(categoria)
                break

    return list(dict.fromkeys(tags_encontradas))[:6]
