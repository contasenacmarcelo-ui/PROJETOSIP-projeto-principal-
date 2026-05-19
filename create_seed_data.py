"""Seed de dados fictícios para testes de ML.

Cria 10 usuários *diferentes* (sem repetir e-mails). Para cada usuário cria:
- 1 Pedido
- 1 Orcamento
- 1 ChamadoSuporte

Também permite limpar o banco antes (modo --clear).

Uso:
  python create_seed_data.py --clear
"""

import argparse
import random
from datetime import datetime, timedelta

from backend.database import create_app
from backend.models import db, Usuario, Pedido, Orcamento, ChamadoSuporte


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--clear", action="store_true", help="Apaga todas as tabelas e recria antes do seed")
    parser.add_argument("--password", default="admin123", help="Senha plain para todos os usuários criados")
    args = parser.parse_args()

    rng = random.Random(1337)

    app = create_app()
    with app.app_context():
        if args.clear:
            db.drop_all()
            db.create_all()

        # Gera 10 usuários com e-mails distintos (evita repetição de dados do usuário)
        users_spec = [
            # Admin fixo
            {
                "email": "admin@sip.com",
                "nome": "Admin SIP",
                "telefone": f"11{rng.randint(10000000, 99999999)}{rng.randint(0, 9)}",
                "role": "admin",
            },
            # Mais 9 usuários normais (total = 10)
            *[
                {
                    "email": f"user{i}@sip.local",
                    "nome": f"User {i}",
                    "telefone": f"11{rng.randint(10000000, 99999999)}{rng.randint(0, 9)}",
                    "role": "user",
                }
                for i in range(1, 10)
            ],

        ]


        # Se já existir algum e-mail, não recria aquele usuário
        existing_by_email = {}
        for u in Usuario.query.all():
            try:
                existing_by_email[u.email] = u
            except Exception:
                pass

        created_users = []
        for us in users_spec:
            existing = existing_by_email.get(us["email"])
            if existing:
                created_users.append(existing)
                continue

            u = Usuario(nome=us["nome"], role=us["role"], status="ativo")
            u.email = us["email"]
            u.telefone = us["telefone"]
            u.set_senha(args.password)
            u.data_cadastro = datetime.utcnow() - timedelta(days=rng.randint(10, 365))
            u.data_ultimo_login = datetime.utcnow() - timedelta(days=rng.randint(0, 20))
            u.email_verificado = True

            db.session.add(u)
            db.session.flush()  # gera id
            created_users.append(u)

        db.session.commit()

        # Pools para evitar repetição de textos (dados dos pedidos/orçamentos/chamados)
        tipos_servico = ["website", "landing", "ecommerce", "sistema", "app", "api"]
        categorias_chamado = ["login", "bug", "duvida", "financeiro", "manutencao", "cancelamento", "recuperacao", "compatibilidade"]
        prioridades = ["alta", "media", "baixa"]

        pedidos_textos = [
            "Preciso de um {tipo} com integração e documentação.",
            "Solicito {tipo} para meu negócio, com foco em performance e SEO.",
            "Quero um {tipo} com painel administrativo e relatórios básicos.",
            "Necessito {tipo} com autenticação, permissões e deploy.",
            "Solicito {tipo} com API REST e testes de integração.",
            "Quero {tipo} com UX melhorada e responsividade.",
        ]

        chamados_textos = [
            "Não consigo acessar: erro ao validar credenciais.",
            "Sistema instável e travando durante uso.",
            "Dúvida sobre valores, prazos e escopo do projeto.",
            "Pagamento falhando no checkout.",
            "Problema de compatibilidade no celular.",
            "Preciso cancelar o pedido e entender próximas etapas.",
            "Como recuperar acesso rapidamente? Esqueci a senha.",
        ]

        orc_tipos = ["website", "landing", "ecommerce", "sistema", "app", "api"]

        # Para cada usuário: garante 1 pedido, 1 orçamento e 1 chamado (idempotente por usuário)
        for idx, u in enumerate(created_users, start=1):
            # Se já existir para esse usuario_id, não duplica
            if Pedido.query.filter_by(usuario_id=u.id).count() == 0:
                tipo = rng.choice(tipos_servico)
                descricao = pedidos_textos[(idx - 1) % len(pedidos_textos)].format(tipo=tipo)
                status = rng.choice(["pendente", "em_andamento", "concluido"])
                valor = float(rng.randint(900, 18000))
                prazo_dias = rng.randint(5, 120)

                db.session.add(
                    Pedido(
                        usuario_id=u.id,
                        tipo_servico=tipo,
                        descricao=descricao,
                        status=status,
                        data_criacao=datetime.utcnow() - timedelta(days=rng.randint(1, 200)),
                        valor_estimado=valor if status == "concluido" else None,
                        prazo=(datetime.utcnow() + timedelta(days=prazo_dias)).date(),
                    )
                )

            if Orcamento.query.filter_by(usuario_id=u.id).count() == 0:
                tipo = rng.choice(orc_tipos)
                complexidade = rng.choice(["baixa", "media", "alta"])
                parametros = {
                    "complexidade": complexidade,
                    "paginas": rng.randint(1, 30),
                    "funcionalidades": rng.randint(1, 25),
                    "prazo_dias": rng.randint(7, 180),
                }
                base = {
                    "website": 1500,
                    "landing": 800,
                    "ecommerce": 4000,
                    "sistema": 6000,
                    "app": 8000,
                    "api": 2500,
                }.get(tipo, 1500)

                valor = float(base + parametros["paginas"] * 120 + parametros["funcionalidades"] * 220)
                status = rng.choice(["pendente", "aprovado", "reprovado"])

                db.session.add(
                    Orcamento(
                        usuario_id=u.id,
                        tipo=tipo,
                        parametros=str(parametros),
                        valor_estimado=valor,
                        status=status,
                        data=datetime.utcnow() - timedelta(days=rng.randint(1, 120)),
                    )
                )

            if ChamadoSuporte.query.filter_by(usuario_id=u.id).count() == 0:
                categoria = categorias_chamado[(idx - 1) % len(categorias_chamado)]
                prioridade = prioridades[(idx - 1) % len(prioridades)]
                descricao = chamados_textos[(idx - 1) % len(chamados_textos)]
                titulo = f"Chamado {idx}: {categoria}"[0:200]

                db.session.add(
                    ChamadoSuporte(
                        usuario_id=u.id,
                        titulo=titulo,
                        descricao=descricao,
                        categoria_classificada=categoria,
                        prioridade=prioridade,
                        status=rng.choice(["aberto", "em_andamento", "fechado"]),
                        data=datetime.utcnow() - timedelta(days=rng.randint(1, 90)),
                    )
                )

        db.session.commit()

        # Sanidade (não falha o script)
        # print counts se quiser inspecionar manualmente
        # print('usuarios', Usuario.query.count())
        # print('pedidos', Pedido.query.count())
        # print('orcamentos', Orcamento.query.count())
        # print('chamados', ChamadoSuporte.query.count())


if __name__ == "__main__":
    main()

