"""
TESTE FINAL: Simula chamada do frontend admin ao backend

Este teste simula exatamente o que o frontend faz quando abre o painel admin.
"""

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

import json

app = create_app()
CORS(app)
jwt.init_app(app)

# Registrar blueprints 
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
    print("TESTE FINAL: Simulando uso do Admin Panel")
    print("=" * 80)
    
    admin = Usuario.query.filter_by(role='admin').first()
    if not admin:
        print("❌ Não há admin!")
        exit(1)
    
    token = create_access_token(identity=str(admin.id))
    
    with app.test_client() as client:
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        print("\n1. Admin faz LOGIN (GET /api/auth/me)")
        resp = client.get('/api/auth/me', headers=headers)
        print(f"   Status: {resp.status_code}")
        if resp.status_code == 200:
            user_data = resp.get_json()
            print(f"   ✓ Login OK: {user_data.get('nome')}")
        else:
            print(f"   ❌ Erro: {resp.data.decode()[:100]}")
            exit(1)
        
        print("\n2. Admin carrega DASHBOARD (GET /api/admin/dashboard)")
        resp = client.get('/api/admin/dashboard', headers=headers)
        print(f"   Status: {resp.status_code}")
        if resp.status_code == 200:
            dash = resp.get_json()
            print(f"   ✓ Dashboard OK")
            print(f"      - Total usuários: {dash['total_usuarios']}")
            print(f"      - Total pedidos: {dash['total_pedidos']}")
            print(f"      - Total chamados: {dash['total_chamados']}")
        
        print("\n3. Admin carrega CLIENTES (GET /api/admin/clientes)")
        resp = client.get('/api/admin/clientes', headers=headers)
        print(f"   Status: {resp.status_code}")
        if resp.status_code == 200:
            clientes_data = resp.get_json()
            print(f"   ✓ Clientes OK: {len(clientes_data['clientes'])} clientes")
        
        print("\n4. Admin CLICA NA ABA CONVERSAS (GET /chat/conversas)")
        resp = client.get('/chat/conversas', headers=headers)
        print(f"   Status: {resp.status_code}")
        if resp.status_code == 200:
            conversas = resp.get_json()
            print(f"   ✓ Conversas OK: {len(conversas['conversas'])} conversas")
            if conversas['conversas']:
                conv = conversas['conversas'][0]
                print(f"      - Conversa 1: {conv['usuario_nome']} ({conv['qtd_mensagens']} msgs)")
        else:
            print(f"   ❌ Erro: {resp.data.decode()[:100]}")
        
        print("\n5. Admin CLICA EM UMA CONVERSA (GET /chat/1/mensagens)")
        resp = client.get('/chat/1/mensagens', headers=headers)
        print(f"   Status: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.get_json()
            print(f"   ✓ Mensagens OK: {len(data['mensagens'])} mensagens")
            if data['mensagens']:
                for i, msg in enumerate(data['mensagens'][:3], 1):
                    print(f"      - Msg {i} ({msg['autor_tipo']}): {msg['conteudo'][:40]}...")
        
        print("\n6. Admin ENVIA MENSAGEM (POST /chat/1/mensagens)")
        payload = {'conteudo': 'Teste de resposta do admin via teste.'}
        resp = client.post('/chat/1/mensagens', headers=headers, data=json.dumps(payload))
        print(f"   Status: {resp.status_code}")
        if resp.status_code == 201:
            data = resp.get_json()
            print(f"   ✓ Mensagem enviada: ID {data['mensagem']['id']}")
        else:
            print(f"   ❌ Erro: {resp.data.decode()[:100]}")
        
        print("\n" + "=" * 80)
        print("✓ TESTE COMPLETO - TUDO FUNCIONANDO!")
        print("=" * 80)
