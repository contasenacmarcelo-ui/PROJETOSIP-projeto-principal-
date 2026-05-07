from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class Usuario(db.Model):
    __tablename__ = 'usuarios'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    senha_hash = db.Column(db.String(256), nullable=False)
    nome = db.Column(db.String(100), nullable=False)
    telefone = db.Column(db.String(20))
    data_cadastro = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default='ativo')  # ativo, inativo, banido

    # Relacionamentos
    pedidos = db.relationship('Pedido', backref='usuario', lazy=True)
    orcamentos = db.relationship('Orcamento', backref='usuario', lazy=True)
    chamados_suporte = db.relationship('ChamadoSuporte', backref='usuario', lazy=True)
    notificacoes = db.relationship('Notificacao', backref='usuario', lazy=True)

    def set_senha(self, senha):
        self.senha_hash = generate_password_hash(senha)

    def check_senha(self, senha):
        return check_password_hash(self.senha_hash, senha)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'nome': self.nome,
            'telefone': self.telefone,
            'data_cadastro': self.data_cadastro.isoformat(),
            'status': self.status
        }

class Pedido(db.Model):
    __tablename__ = 'pedidos'
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    tipo_servico = db.Column(db.String(50), nullable=False)  # website, app, sistema, etc.
    descricao = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='pendente')  # pendente, em_andamento, concluido, cancelado
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)
    valor_estimado = db.Column(db.Float)
    prazo = db.Column(db.Date)

    def to_dict(self):
        return {
            'id': self.id,
            'usuario_id': self.usuario_id,
            'tipo_servico': self.tipo_servico,
            'descricao': self.descricao,
            'status': self.status,
            'data_criacao': self.data_criacao.isoformat(),
            'valor_estimado': self.valor_estimado,
            'prazo': self.prazo.isoformat() if self.prazo else None
        }

class Orcamento(db.Model):
    __tablename__ = 'orcamentos'
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    tipo = db.Column(db.String(50), nullable=False)
    parametros = db.Column(db.Text)  # JSON string com parâmetros
    valor_estimado = db.Column(db.Float)
    status = db.Column(db.String(20), default='pendente')
    data = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'usuario_id': self.usuario_id,
            'tipo': self.tipo,
            'parametros': self.parametros,
            'valor_estimado': self.valor_estimado,
            'status': self.status,
            'data': self.data.isoformat()
        }

class ChamadoSuporte(db.Model):
    __tablename__ = 'chamados_suporte'
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    titulo = db.Column(db.String(200), nullable=False)
    descricao = db.Column(db.Text, nullable=False)
    categoria_classificada = db.Column(db.String(50))  # ML classifica
    prioridade = db.Column(db.String(20), default='media')  # baixa, media, alta
    status = db.Column(db.String(20), default='aberto')  # aberto, em_andamento, fechado
    data = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'usuario_id': self.usuario_id,
            'titulo': self.titulo,
            'descricao': self.descricao,
            'categoria_classificada': self.categoria_classificada,
            'prioridade': self.prioridade,
            'status': self.status,
            'data': self.data.isoformat()
        }

class MensagemContato(db.Model):
    __tablename__ = 'mensagens_contato'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), nullable=False)
    nome = db.Column(db.String(100))
    telefone = db.Column(db.String(20))
    assunto = db.Column(db.String(200))
    mensagem = db.Column(db.Text, nullable=False)
    data = db.Column(db.DateTime, default=datetime.utcnow)
    lida = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'nome': self.nome,
            'telefone': self.telefone,
            'assunto': self.assunto,
            'mensagem': self.mensagem,
            'data': self.data.isoformat(),
            'lida': self.lida
        }

class Notificacao(db.Model):
    __tablename__ = 'notificacoes'
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    tipo = db.Column(db.String(50), nullable=False)  # info, sucesso, aviso, pedido, suporte
    mensagem = db.Column(db.Text, nullable=False)
    lida = db.Column(db.Boolean, default=False)
    data = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'usuario_id': self.usuario_id,
            'tipo': self.tipo,
            'mensagem': self.mensagem,
            'lida': self.lida,
            'data': self.data.isoformat()
        }