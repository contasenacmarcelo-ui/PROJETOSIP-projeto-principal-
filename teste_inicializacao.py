#!/usr/bin/env python3
"""
Teste de inicialização do servidor
"""

print("🔍 Testando inicialização...")

try:
    print("1. Importando create_app...")
    from backend.database import create_app
    print("✅ create_app importado")

    print("2. Criando app...")
    app = create_app()
    print("✅ App criado")

    print("3. Testando contexto...")
    with app.app_context():
        print("✅ Contexto funcionando")

    print("4. Importando rotas...")
    from backend.routes.auth import auth_bp
    from backend.routes.admin import admin_bp
    from backend.routes.pedidos import pedidos_bp
    from backend.routes.suporte import suporte_bp
    print("✅ Rotas importadas")

    print("5. Registrando blueprints...")
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(admin_bp, url_prefix='/api')
    app.register_blueprint(pedidos_bp, url_prefix='/api')
    app.register_blueprint(suporte_bp, url_prefix='/api')
    print("✅ Blueprints registrados")

    print("🎉 Todos os testes passaram! Servidor deve funcionar.")

except Exception as e:
    print(f"❌ Erro encontrado: {e}")
    import traceback
    traceback.print_exc()