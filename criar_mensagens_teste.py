"""
PASSO 3 PREP: Criar mensagens de teste para conversas

Adiciona mensagens às conversas (chamados) para que o frontend tenha dados para exibir.
"""

from backend.database import create_app
from backend.models import db, Usuario, ChamadoSuporte, MensagemSuporte
from datetime import datetime, timedelta

app = create_app()

with app.app_context():
    print("=" * 80)
    print("ADICIONANDO MENSAGENS DE TESTE")
    print("=" * 80)
    
    # Recuperar todos os chamados
    chamados = ChamadoSuporte.query.all()
    admin = Usuario.query.filter_by(role='admin').first()
    
    if not admin:
        print("❌ Não há admin no banco!")
        exit(1)
    
    if not chamados:
        print("❌ Não há chamados no banco!")
        exit(1)
    
    print(f"\nAd adding mensagens a {len(chamados)} chamados...")
    
    # Para cada chamado, criar 2-3 mensagens (user + admin)
    total_mensagens = 0
    for idx, chamado in enumerate(chamados, start=1):
        usuario = Usuario.query.get(chamado.usuario_id)
        
        # Mensagem 1: User abre o chamado com descrição
        msg1 = MensagemSuporte(
            chamado_id=chamado.id,
            autor_tipo='user',
            autor_usuario_id=usuario.id,
            conteudo=chamado.descricao,
            data=chamado.data
        )
        db.session.add(msg1)
        total_mensagens += 1
        
        # Mensagem 2: Admin responde
        admin_response = [
            f"Olá {usuario.nome}, recebemos seu chamado. Vamos investigar.",
            f"Entendido {usuario.nome}. Este é um problema conhecido. Estamos trabalhando na solução.",
            f"Oi {usuario.nome}! Já temos uma solução para esse problema.",
            f"Obrigado por reportar isso, {usuario.nome}. Vamos resolver em breve.",
            f"Olá! Já vimos seu chamado. Nossa equipe vai entrar em contato.",
        ]
        msg2 = MensagemSuporte(
            chamado_id=chamado.id,
            autor_tipo='admin',
            autor_usuario_id=admin.id,
            conteudo=admin_response[idx % len(admin_response)],
            data=chamado.data + timedelta(hours=2)
        )
        db.session.add(msg2)
        total_mensagens += 1
        
        # Mensagem 3: User responde novamente (50% dos chamados)
        if idx % 2 == 0:
            user_responses = [
                f"Obrigado! Quando devo esperar uma solução?",
                f"Perfeito, obrigado pela atenção.",
                f"Ok, ficamos no aguardo.",
                f"Muito bom! Preciso urgente.",
                f"Certo, obrigado!",
            ]
            msg3 = MensagemSuporte(
                chamado_id=chamado.id,
                autor_tipo='user',
                autor_usuario_id=usuario.id,
                conteudo=user_responses[idx % len(user_responses)],
                data=chamado.data + timedelta(hours=3)
            )
            db.session.add(msg3)
            total_mensagens += 1
    
    db.session.commit()
    
    print(f"✓ {total_mensagens} mensagens adicionadas!")
    print(f"✓ Mensagens por chamado: {total_mensagens // len(chamados)} média")
    
    # Verificar
    print("\n" + "=" * 80)
    print("VERIFICAÇÃO:")
    print("=" * 80)
    print(f"Total de mensagens no banco: {MensagemSuporte.query.count()}")
    print(f"Total de chamados: {ChamadoSuporte.query.count()}")
    print(f"Mensagens médias por chamado: {MensagemSuporte.query.count() / max(1, ChamadoSuporte.query.count()):.1f}")
    
    print("\n✓ Pronto! Execute o admin para ver as conversas com mensagens.")
