from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import argon2
from .crypto import encrypt_value, decrypt_value

db = SQLAlchemy()

class Usuario(db.Model):
    __tablename__ = 'usuarios'
    id = db.Column(db.Integer, primary_key=True)
    email_criptografado = db.Column(db.Text, unique=True, nullable=False)
    senha_hash = db.Column(db.Text, nullable=False)  # Argon2 hash
    nome = db.Column(db.String(100), nullable=False)
    telefone_criptografado = db.Column(db.Text)
    data_cadastro = db.Column(db.DateTime, default=datetime.utcnow)
    data_ultimo_login = db.Column(db.DateTime)
    email_verificado = db.Column(db.Boolean, default=False)
    status = db.Column(db.String(20), default='ativo')  # ativo, inativo, banido
    role = db.Column(db.String(20), default='user')  # user, admin

    # Relacionamentos
    pedidos = db.relationship('Pedido', backref='usuario', lazy=True)
    orcamentos = db.relationship('Orcamento', backref='usuario', lazy=True)
    chamados_suporte = db.relationship('ChamadoSuporte', backref='usuario', lazy=True)
    notificacoes = db.relationship('Notificacao', backref='usuario', lazy=True)

    @property
    def email(self):
        return decrypt_value(self.email_criptografado)

    @email.setter
    def email(self, value):
        self.email_criptografado = encrypt_value(value)

    @property
    def telefone(self):
        if self.telefone_criptografado:
            return decrypt_value(self.telefone_criptografado)
        return None

    @telefone.setter
    def telefone(self, value):
        if value:
            self.telefone_criptografado = encrypt_value(value)
        else:
            self.telefone_criptografado = None

    def set_senha(self, senha):
        # Dupla camada: Argon2 hash
        ph = argon2.PasswordHasher()
        self.senha_hash = ph.hash(senha)

    def check_senha(self, senha):
        try:
            # Tentar Argon2 primeiro (novos usuários)
            ph = argon2.PasswordHasher()
            ph.verify(self.senha_hash, senha)
            return True
        except argon2.exceptions.VerifyMismatchError:
            return False
        except Exception:
            # Se não for Argon2, tentar werkzeug (usuários antigos)
            try:
                from werkzeug.security import check_password_hash
                return check_password_hash(self.senha_hash, senha)
            except:
                return False

    @property
    def total_gasto(self):
        # Calcular total gasto baseado em pedidos concluídos
        total = 0
        for pedido in self.pedidos:
            if pedido.status == 'concluido' and pedido.valor_estimado:
                total += pedido.valor_estimado
        return total

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'nome': self.nome,
            'telefone': self.telefone,
            'data_cadastro': self.data_cadastro.isoformat(),
            'data_ultimo_login': self.data_ultimo_login.isoformat() if self.data_ultimo_login else None,
            'email_verificado': self.email_verificado,
            'status': self.status,
            'role': self.role,
            'total_gasto': self.total_gasto
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

class MensagemSuporte(db.Model):
    __tablename__ = 'mensagens_suporte'
    id = db.Column(db.Integer, primary_key=True)
    chamado_id = db.Column(db.Integer, db.ForeignKey('chamados_suporte.id'), nullable=False, index=True)
    autor_tipo = db.Column(db.String(20), nullable=False)  # user, admin
    autor_usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False, index=True)
    conteudo = db.Column(db.Text, nullable=False)
    data = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'chamado_id': self.chamado_id,
            'autor_tipo': self.autor_tipo,
            'autor_usuario_id': self.autor_usuario_id,
            'conteudo': self.conteudo,
            'data': self.data.isoformat() if self.data else None,
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
