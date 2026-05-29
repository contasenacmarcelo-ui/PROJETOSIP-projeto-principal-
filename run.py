#!/usr/bin/env python3
"""
Script para iniciar o servidor Flask da API SIP
"""

print(" Iniciando SIP Backend API...")
print(" URL: http://localhost:5000")
print(" Documentação: http://localhost:5000")

try:
    from backend.database import create_app
    from backend.auth import jwt
    from backend.routes.auth import auth_bp
    from backend.routes.usuarios import usuarios_bp
    from backend.routes.pedidos import pedidos_bp
    from backend.routes.orcamentos import orcamentos_bp
    from backend.routes.suporte import suporte_bp
    from backend.routes.contato import contato_bp
    from backend.routes.notificacoes import notificacoes_bp
    from backend.routes.ml import ml_bp
    from backend.routes.ml_dashboard import ml_bp as ml_dashboard_bp
    from backend.routes.admin import admin_bp
    from backend.routes.chat import chat_bp


    from flask_cors import CORS
    from flask import send_from_directory, jsonify
    import os

    print(" Imports realizados com sucesso")

    app = create_app()
    print(" App criado")

    CORS(app)
    jwt.init_app(app)
    print(" CORS e JWT configurados")

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
    app.register_blueprint(chat_bp)
    app.register_blueprint(ml_dashboard_bp)

    print(" Blueprints registrados")


    @app.route('/')
    def index():
        return send_from_directory(os.path.join(app.root_path, '..'), 'index.html')

    # Servir arquivos estáticos
    @app.route('/public/<path:filename>')
    def serve_static(filename):
        return send_from_directory(os.path.join(app.root_path, '..', 'public'), filename)

    print(" Rotas configuradas")

    # Debug: listar rotas relacionadas ao chat para confirmar integração
    try:
        chat_routes = [rule.rule for rule in app.url_map.iter_rules() if rule.rule.startswith('/chat/')]
        print(f"[DEBUG] Rotas /chat/* registradas: {chat_routes}")
    except Exception as _e:
        print(f"[DEBUG] Falha ao listar rotas /chat/*: {_e}")

    if __name__ == '__main__':

        print(" Iniciando servidor...")
        app.run(debug=True, host='0.0.0.0', port=5000)

except Exception as e:
    print(f" Erro durante inicialização: {e}")
    import traceback
    traceback.print_exc()