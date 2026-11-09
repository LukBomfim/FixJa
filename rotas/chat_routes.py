from flask import Blueprint, jsonify, request

from auth.middleware import login_obrigatorio
from servicos.chat_service import (
    MAX_MESSAGE_LENGTH,
    buscar_conversa_participante,
    buscar_conversas,
    buscar_mensagens,
    criar_conversa_cliente,
    enviar_mensagem,
    marcar_conversa_como_lida,
)
from servicos.perfils_service import buscar_perfil_por_id

chat_bp = Blueprint("chat", __name__)


@chat_bp.route("/conversas", methods=["GET"])
@login_obrigatorio
def listar_conversas():
    return jsonify(buscar_conversas(request.usuario_atual.id)), 200


@chat_bp.route("/conversas", methods=["POST"])
@login_obrigatorio
def iniciar_conversa():
    perfil = buscar_perfil_por_id(request.usuario_atual.id)
    if not perfil:
        return jsonify({"erro": "Perfil não encontrado"}), 404
    if perfil.get("tipo") != "CLIENTE":
        return jsonify({"erro": "Somente clientes podem iniciar uma conversa"}), 403
    dados = request.get_json(silent=True)
    provider_id = dados.get("prestador_id") if isinstance(dados, dict) else None
    if not isinstance(provider_id, str) or not provider_id.strip():
        return jsonify({"erro": "prestador_id é obrigatório"}), 400
    conversa = criar_conversa_cliente(request.usuario_atual.id, provider_id.strip())
    if not conversa:
        return jsonify({"erro": "Prestador não encontrado"}), 404
    return jsonify(conversa), 200


@chat_bp.route("/conversas/<string:conversation_id>/mensagens", methods=["GET"])
@login_obrigatorio
def listar_mensagens(conversation_id):
    conversa = buscar_conversa_participante(conversation_id, request.usuario_atual.id)
    if not conversa:
        return jsonify({"erro": "Conversa não encontrada"}), 404
    marcar_conversa_como_lida(conversation_id, request.usuario_atual.id)
    return jsonify(buscar_mensagens(conversation_id)), 200


@chat_bp.route("/conversas/<string:conversation_id>/mensagens", methods=["POST"])
@login_obrigatorio
def postar_mensagem(conversation_id):
    conversa = buscar_conversa_participante(conversation_id, request.usuario_atual.id)
    if not conversa:
        return jsonify({"erro": "Conversa não encontrada"}), 404
    dados = request.get_json(silent=True)
    body = dados.get("body") if isinstance(dados, dict) else None
    if not isinstance(body, str) or not body.strip():
        return jsonify({"erro": "A mensagem não pode estar vazia"}), 400
    if len(body.strip()) > MAX_MESSAGE_LENGTH:
        return jsonify({"erro": f"A mensagem deve ter no máximo {MAX_MESSAGE_LENGTH} caracteres"}), 400
    mensagem = enviar_mensagem(conversation_id, request.usuario_atual.id, body.strip())
    if not mensagem:
        return jsonify({"erro": "Não foi possível enviar a mensagem"}), 500
    return jsonify(mensagem), 201
