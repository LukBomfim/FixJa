from flask import Blueprint, request, jsonify
from auth.middleware import login_obrigatorio
from servicos.contratacoes_service import buscar_contratacao_por_id_db
from servicos.perfils_service import buscar_avaliacao_por_id_prestador, avaliar_perfil

avaliacoes_bp = Blueprint('avaliacoes', __name__)

@avaliacoes_bp.route('/contratacoes/<string:id>/avaliacoes', methods=['POST'])
@login_obrigatorio
def post_avaliacao(id):
    usuario = request.usuario_atual
    contratacao = buscar_contratacao_por_id_db(id)

    if not contratacao:
        return jsonify({"erro": "Contratação não encontrada"}), 404

    if usuario.id != str(contratacao["client_id"]):
        return jsonify({"erro": "Só o cliente desta contratação pode avaliar"}), 403

    if str(contratacao["status"]).lower() != "concluido":
        return jsonify({"erro": "Só é possível avaliar contratações concluídas"}), 400

    dados = request.get_json() or {}
    nota = dados.get('nota')
    comentario = dados.get('comentario')

    if isinstance(nota, bool) or not isinstance(nota, (int, float)) or not (1 <= nota <= 5):
        return jsonify({"erro": "Nota deve ser um número entre 1 e 5"}), 400

    try:
        resultado = avaliar_perfil(contratacao["prestador_id"], id, nota, comentario)
    except ValueError as error:
        return jsonify({"erro": str(error)}), 409
    if not resultado:
        return jsonify({"erro": "Não foi possível registrar a avaliação"}), 400
    return jsonify(resultado), 201


@avaliacoes_bp.route('/prestadores/<string:id>/avaliacoes', methods=['GET'])
def get_avaliacoes_prestador(id):
    resultado = buscar_avaliacao_por_id_prestador(id)
    return jsonify(resultado), 200
