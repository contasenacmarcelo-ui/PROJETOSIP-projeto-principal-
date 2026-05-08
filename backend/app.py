from flask import Flask, request, jsonify
from flask_cors import CORS
from .database import create_app
from .auth import jwt
from .routes.auth import auth_bp
from .routes.usuarios import usuarios_bp
from .routes.pedidos import pedidos_bp
from .routes.orcamentos import orcamentos_bp
from .routes.suporte import suporte_bp
from .routes.contato import contato_bp
from .routes.notificacoes import notificacoes_bp
from .routes.ml import ml_bp
from .routes.admin import admin_bp

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

@app.route('/')
def index():
    return jsonify({"message": "SIP Backend API", "status": "running"})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)