"""
TESTE PASSO 2: Verificar rotas de chat e identificar 404s.

Executa:
1. Verifica dados na base (usuários, chamados, mensagens)
2. Testa GET /chat/conversas (admin)
3. Testa GET /chat/<id>/mensagens
4. Identifica erros 404
"""

import json
from backend.database import create_app
from backend.models import db, Usuario, ChamadoSuporte, MensagemSuporte
from backend.auth import jwt
from flask_jwt_extended import create_access_token
from flask_cors import CORS

# Importar blueprints
from backend.routes.auth import auth_bp
from backend.routes.usuarios import usuarios_bp
from backend.routes.pedidos import pedidos_bp
from backend.routes.orcamentos import orcamentos_bp
from backend.routes.suporte import suporte_bp
from backend.routes.contato import contato_bp
from backend.routes.notificacoes import notificacoes_bp
from backend.routes.ml import ml_bp
from backend.routes.admin import admin_bp
from backend.routes.ml_batch import ml_batch_bp
from backend.routes.ml_dashboard import ml_bp as ml_dashboard_bp
from backend.routes.chat import chat_bp

app = create_app()
CORS(app)
jwt.init_app(app)

# Registrar blueprints (IMPORTANT!)
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(usuarios_bp, url_prefix='/api')
app.register_blueprint(pedidos_bp, url_prefix='/api')
app.register_blueprint(orcamentos_bp, url_prefix='/api')
app.register_blueprint(suporte_bp, url_prefix='/api')
app.register_blueprint(contato_bp, url_prefix='/api')
app.register_blueprint(notificacoes_bp, url_prefix='/api')
app.register_blueprint(ml_bp, url_prefix='/api/ml')
app.register_blueprint(admin_bp, url_prefix='/api')
app.register_blueprint(ml_batch_bp, url_prefix='/api')
app.register_blueprint(ml_dashboard_bp)
app.register_blueprint(chat_bp)

with app.app_context():
    print("=" * 80)
    print("PASSO 2: Teste de Rotas de Chat")
    print("=" * 80)
    
    # 1. VERIFICAR DADOS NO BANCO
    print("\n1. DADOS NO BANCO:")
    print(f"   - Usuários: {Usuario.query.count()}")
    print(f"   - Chamados: {ChamadoSuporte.query.count()}")
    print(f"   - Mensagens: {MensagemSuporte.query.count()}")
    
    # Listar alguns usuários e chamados
    users = Usuario.query.all()
    print(f"\n   Usuários:")
    for u in users[:5]:
        print(f"     - ID {u.id}: {u.nome} (role: {u.role})")
    
    chamados = ChamadoSuporte.query.all()
    print(f"\n   Chamados:")
    for c in chamados[:5]:
        usuario = Usuario.query.get(c.usuario_id)
        print(f"     - ID {c.id}: {c.titulo} (usuario: {usuario.nome if usuario else '?'})")
    
    # 2. TESTAR ROTAS
    print("\n2. TESTANDO ROTAS:")
    
    # Buscar admin para token
    admin = Usuario.query.filter_by(role='admin').first()
    if not admin:
        print("   ❌ ERRO: Não há admin no banco!")
        exit(1)
    
    print(f"   Admin encontrado: {admin.nome} (ID: {admin.id})")
    
    # Criar token de acesso com decode_kwargs
    with app.test_client() as client:
        # Usar JWT diretamente com app context
        from flask_jwt_extended import JWTManager
        
        token = create_access_token(identity=str(admin.id))
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        # Teste A: GET /chat/conversas
        print("\n   A. GET /chat/conversas (admin)")
        response = client.get('/chat/conversas', headers=headers)
        print(f"      Status: {response.status_code}")
        if response.status_code == 200:
            data = response.get_json()
            print(f"      ✓ Conversas: {len(data.get('conversas', []))} encontradas")
            if data.get('conversas'):
                print(f"        Primeira conversa: {data['conversas'][0]}")
        else:
            print(f"      ❌ Erro: {response.data.decode()}")
        
        # Teste B: GET /chat/<id>/mensagens
        if chamados:
            chamado_id = chamados[0].id
            print(f"\n   B. GET /chat/{chamado_id}/mensagens")
            response = client.get(f'/chat/{chamado_id}/mensagens', headers=headers)
            print(f"      Status: {response.status_code}")
            if response.status_code == 200:
                data = response.get_json()
                print(f"      ✓ Mensagens: {len(data.get('mensagens', []))} encontradas")
            else:
                print(f"      ❌ Erro: {response.data.decode()}")
        
        # Teste C: POST /chat/<id>/mensagens (criar mensagem)
        if chamados:
            chamado_id = chamados[0].id
            print(f"\n   C. POST /chat/{chamado_id}/mensagens (criar)")
            payload = {'conteudo': 'Teste de mensagem'}
            response = client.post(
                f'/chat/{chamado_id}/mensagens',
                headers=headers,
                data=json.dumps(payload)
            )
            print(f"      Status: {response.status_code}")
            if response.status_code == 201:
                data = response.get_json()
                print(f"      ✓ Mensagem enviada: {data['mensagem']['id']}")
            else:
                print(f"      ❌ Erro: {response.data.decode()}")
        
        # Teste D: Testar como usuário normal
        user = Usuario.query.filter_by(role='user').first()
        if user:
            token_user = create_access_token(identity=user.id)
            headers_user = {
                'Authorization': f'Bearer {token_user}',
                'Content-Type': 'application/json'
            }
            
            # Usuário só vê suas conversas
            print(f"\n   D. GET /chat/conversas (user: {user.nome})")
            response = client.get('/chat/conversas', headers=headers_user)
            print(f"      Status: {response.status_code}")
            if response.status_code == 200:
                data = response.get_json()
                print(f"      ✓ Conversas do usuário: {len(data.get('conversas', []))}")
            else:
                print(f"      ❌ Erro: {response.data.decode()}")
    
    print("\n" + "=" * 80)
    print("FIM DO TESTE")
    print("=" * 80)
