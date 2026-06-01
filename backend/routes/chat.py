from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..models import db, Usuario, ChamadoSuporte, MensagemSuporte
from ..utils import require_admin


chat_bp = Blueprint('chat', __name__)


def _to_int(value, default=None):
    try:
        return int(value)
    except Exception:
        return default


@chat_bp.route('/chat/conversas', methods=['GET'])
@jwt_required()
def listar_conversas():
    """Admin: retorna todas as conversas (usuários que têm chamados/mensagens).


    Usuário: retorna somente suas conversas.
    """

    identity = get_jwt_identity()
    # flask-jwt-extended pode fornecer identity como int, str ou até outro tipo.
    # Normalizamos para string e depois convertemos.
    current_user_id = int(str(identity))

    usuario_atual = Usuario.query.get(current_user_id)
    if not usuario_atual:
        return jsonify({'error': 'Usuário não encontrado'}), 404

    is_admin = usuario_atual.role == 'admin'

    query = ChamadoSuporte.query
    if not is_admin:
        query = query.filter_by(usuario_id=current_user_id)

    # Uma conversa = um chamado/thread.
    # Importante: para o admin, queremos listar também usuários que ainda não têm mensagens.
    chamados = query.order_by(ChamadoSuporte.data.desc()).all()

    # Se for admin e não houver chamados, não retorna lista vazia:
    # devolve todos os usuários (role=user) como contatos “sem histórico”.
    if is_admin and len(chamados) == 0:
        usuarios = Usuario.query.filter(Usuario.role == 'user').all()
        conversas = []
        for u in usuarios:
            conversas.append({
                'chamado_id': None,
                'usuario_id': u.id,
                'usuario_nome': u.nome,
                'usuario_email': u.email,
                'titulo': None,
                'descricao': None,
                'status_conversa': None,
                'prioridade': None,
                'data_thread': None,
                'ultima_mensagem': None,
                'ultima_mensagem_data': None,
                'ultima_mensagem_autor': None,
                'qtd_mensagens': 0,
            })
        return jsonify({'total': len(conversas), 'conversas': conversas}), 200

    conversas = []
    for c in chamados:
        usuario = Usuario.query.get(c.usuario_id)
        ultima_msg = (
            MensagemSuporte.query.filter_by(chamado_id=c.id)
            .order_by(MensagemSuporte.data.asc())
            .all()
        )

        # pegar última por data
        ultima_msg = (
            MensagemSuporte.query.filter_by(chamado_id=c.id)
            .order_by(MensagemSuporte.data.desc())
            .first()
        )

        conversas.append({
            'chamado_id': c.id,
            'usuario_id': c.usuario_id,
            'usuario_nome': usuario.nome if usuario else '—',
            'usuario_email': usuario.email if usuario else None,
            'titulo': c.titulo,
            'descricao': c.descricao,
            'status_conversa': c.status,
            'prioridade': c.prioridade,
            'data_thread': c.data.isoformat() if c.data else None,
            'ultima_mensagem': ultima_msg.conteudo if ultima_msg else None,
            'ultima_mensagem_data': ultima_msg.data.isoformat() if ultima_msg and ultima_msg.data else None,
            'ultima_mensagem_autor': ultima_msg.autor_tipo if ultima_msg else None,
            'qtd_mensagens': MensagemSuporte.query.filter_by(chamado_id=c.id).count(),
        })

    return jsonify({'total': len(conversas), 'conversas': conversas}), 200


@chat_bp.route('/chat/<int:chamado_id>/mensagens', methods=['GET'])
@jwt_required()
def listar_mensagens(chamado_id):
    current_user_id = int(get_jwt_identity())
    user = Usuario.query.get(current_user_id)

    chamado = ChamadoSuporte.query.get(chamado_id)
    if not chamado:
        return jsonify({'error': 'Conversa não encontrada'}), 404

    if user.role != 'admin' and chamado.usuario_id != current_user_id:
        return jsonify({'error': 'Acesso negado'}), 403

    mensagens = (
        MensagemSuporte.query.filter_by(chamado_id=chamado_id)
        .order_by(MensagemSuporte.data.asc())
        .all()
    )

    return jsonify({'chamado_id': chamado_id, 'mensagens': [m.to_dict() for m in mensagens]}), 200


@chat_bp.route('/chat/<int:chamado_id>/mensagens', methods=['POST'])
@jwt_required()
def enviar_mensagem(chamado_id):
    current_user_id = int(get_jwt_identity())
    user = Usuario.query.get(current_user_id)

    data = request.get_json() or {}
    conteudo = (data.get('conteudo') or '').strip()

    if not conteudo:
        return jsonify({'error': 'Campo conteudo é obrigatório'}), 400

    chamado = ChamadoSuporte.query.get(chamado_id)
    if not chamado:
        return jsonify({'error': 'Conversa não encontrada'}), 404

    if user.role != 'admin' and chamado.usuario_id != current_user_id:
        return jsonify({'error': 'Acesso negado'}), 403

    autor_tipo = 'admin' if user.role == 'admin' else 'user'

    msg = MensagemSuporte(
        chamado_id=chamado_id,
        autor_tipo=autor_tipo,
        autor_usuario_id=current_user_id,
        conteudo=conteudo
    )

    db.session.add(msg)
    db.session.commit()

    return jsonify({'message': 'Mensagem enviada', 'mensagem': msg.to_dict()}), 201

