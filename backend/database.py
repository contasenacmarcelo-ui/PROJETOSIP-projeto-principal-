from flask import Flask
import os

from .models import db, Usuario
from .config import Config

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)

    with app.app_context():
        db.create_all()

        # Seed do admin padrão (para ambientes limpos como Render)
        from .auth import criar_usuario
        from .utils import find_user_by_email

        ADMIN_EMAIL = 'admin@sip.com'.lower()
        ADMIN_NOME = 'Administrador'
        ADMIN_SENHA = 'admin123'
        ADMIN_ROLE = 'admin'

        def _admin_exists():
            return find_user_by_email(ADMIN_EMAIL) is not None

        # Insere seed somente se o banco estiver "limpo" (somente admin existe).
        if not _admin_exists():
            usuario_admin = criar_usuario(
                email=ADMIN_EMAIL,
                senha=ADMIN_SENHA,
                nome=ADMIN_NOME,
                telefone=None,
            )
            usuario_admin.role = ADMIN_ROLE
            usuario_admin.status = 'ativo'
            db.session.add(usuario_admin)
            db.session.commit()

        # Se já existe admin, mas ainda não existem clientes, popula com 4 clientes fictícios.
        usuarios_total = Usuario.query.count()
        clientes_existem = Usuario.query.filter_by(role='user').count() > 0

        if (not clientes_existem) and usuarios_total <= 1:
            clientes_ficticios = [
                {

                    'nome': 'Cliente Teste 01',
                    'email': 'cliente01@sip.com',
                    'telefone': '+5511999999001',
                },
                {
                    'nome': 'Cliente Teste 02',
                    'email': 'cliente02@sip.com',
                    'telefone': '+5511999999002',
                },
                {
                    'nome': 'Cliente Teste 03',
                    'email': 'cliente03@sip.com',
                    'telefone': '+5511999999003',
                },
                {
                    'nome': 'Cliente Teste 04',
                    'email': 'cliente04@sip.com',
                    'telefone': '+5511999999004',
                },
            ]


            # Senha padrão para usuários fictícios
            SENHA_FICTICIA = 'senha123'

            for c in clientes_ficticios:

                if find_user_by_email(c['email']) is not None:
                    continue

                usuario_cliente = criar_usuario(
                    email=c['email'],
                    senha=SENHA_FICTICIA,
                    nome=c['nome'],
                    telefone=c['telefone'],
                )
                usuario_cliente.role = 'user'
                usuario_cliente.status = 'ativo'
                db.session.add(usuario_cliente)

            db.session.commit()





        # Seed básico para conversas admin/chat (garante que /chat/<id>/mensagens funcione).
        # Importante: manter tudo dentro do app.app_context() do create_app.
        try:
            from .models import ChamadoSuporte, MensagemSuporte, Notificacao
            from .utils import find_user_by_email
            from .auth import criar_usuario

            admin_user = find_user_by_email('admin@sip.com'.lower())
            if admin_user:
                # Garante pelo menos 1 chamado (id 1 depende do auto-increment; por isso criamos se estiver vazio)
                if ChamadoSuporte.query.count() == 0:
                    # Se existir pelo menos um cliente, cria chamado do primeiro cliente; caso contrário, cria um cliente.
                    primeiro_cliente = Usuario.query.filter_by(role='user').order_by(Usuario.id.asc()).first()
                    if not primeiro_cliente:
                        primeiro_cliente = criar_usuario(
                            email='cliente_seed@sip.com',
                            senha='senha123',
                            nome='Cliente Seed',
                            telefone=None,
                        )
                        primeiro_cliente.role = 'user'
                        primeiro_cliente.status = 'ativo'
                        db.session.add(primeiro_cliente)
                        db.session.commit()

                    chamado = ChamadoSuporte(
                        usuario_id=primeiro_cliente.id,
                        titulo='Suporte seed (chat)',
                        descricao='Chamado seed para garantir conversa inicial.',
                        categoria_classificada='duvida',
                        prioridade='media',
                        status='aberto',
                    )
                    db.session.add(chamado)
                    db.session.flush()

                    # Mensagem inicial do admin.
                    db.session.add(
                        MensagemSuporte(
                            chamado_id=chamado.id,
                            autor_tipo='admin',
                            autor_usuario_id=admin_user.id,
                            conteudo='Olá! Como posso ajudar?',
                        )
                    )

                    # Notificação opcional (não deve quebrar).
                    try:
                        db.session.add(
                            Notificacao(
                                usuario_id=primeiro_cliente.id,
                                tipo='suporte',
                                mensagem='Nova mensagem de suporte.',
                            )
                        )
                    except Exception:
                        pass

                    db.session.commit()
        except Exception:
            db.session.rollback()

    return app

