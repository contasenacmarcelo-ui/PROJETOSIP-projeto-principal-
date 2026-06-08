"""Models adicionais para o sistema de chat admin <-> cliente.

IMPORTANTE: este arquivo existe apenas para suportar a Parte 4 sem alterar
as models existentes do projeto.

O projeto usa SQLAlchemy via `backend/models.py` (db = SQLAlchemy()).
Aqui criamos modelos que herdam esse `db`.
"""

from datetime import datetime

from .models import db


class ConversasAdmin(db.Model):
    """1 conversa por cliente (unique em cliente_id).

    - cliente_id: FK para usuarios.id (cliente)
    - admin_id: FK para usuarios.id (admin)
    """

    __tablename__ = "conversas_admin"

    id = db.Column(db.Integer, primary_key=True)
    cliente_id = db.Column(
        db.Integer,
        db.ForeignKey("usuarios.id"),
        nullable=False,
        unique=True,
        index=True,
    )
    admin_id = db.Column(db.Integer, db.ForeignKey("usuarios.id"), nullable=False)
    criada_em = db.Column(db.DateTime, default=datetime.utcnow)


class MensagensConversasAdmin(db.Model):
    """Mensagens dentro da conversa admin <-> cliente."""

    __tablename__ = "mensagens_conversas_admin"

    id = db.Column(db.Integer, primary_key=True)
    conversa_id = db.Column(
        db.Integer, db.ForeignKey("conversas_admin.id"), nullable=False, index=True
    )

    senderId = db.Column(db.Integer, nullable=False, index=True)
    receiverId = db.Column(db.Integer, nullable=False, index=True)

    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    read = db.Column(db.Boolean, default=False, index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "conversa_id": self.conversa_id,
            "senderId": self.senderId,
            "receiverId": self.receiverId,
            "content": self.content,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "read": bool(self.read),
        }
