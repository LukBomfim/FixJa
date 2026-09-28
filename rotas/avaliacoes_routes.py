from flask import Blueprint, request, jsonify
from auth.middleware import login_obrigatorio
from servicos.contratacoes_service import buscar_contratacao_por_id_db
from servicos.perfils_service import buscar_avaliacao_por_id_prestador, avaliar_perfil

avaliacoes_bp = Blueprint('avaliacoes', __name__)

# FUNÇÕES FAKE PARA TESTES
def criar_avaliacao(contratacao_id, nota, comentario):
    return {
        "id": 3, "contratacao_id": contratacao_id,
        "nota": nota, "comentario": comentario, "data": "2026-09-16"
    }




@avaliacoes_bp.route('/contratacoes/<int:id>/avaliacoes', methods=['POST'])
@login_obrigatorio
def post_avaliacao(id):
    usuario = request.usuario_atual
    contratacao = buscar_contratacao_por_id_db(id)

    if not contratacao:
        return jsonify({"erro": "Contratação não encontrada"}), 404

    if usuario.id != str(contratacao["cliente_id"]):
        return jsonify({"erro": "Só o cliente desta contratação pode avaliar"}), 403

    if contratacao["status"] != "concluido":
        return jsonify({"erro": "Só é possível avaliar contratações concluídas"}), 400

    dados = request.json
    nota = dados.get('nota')
    comentario = dados.get('comentario')

    if not nota or not (1 <= nota <= 5):
        return jsonify({"erro": "Nota deve ser um número entre 1 e 5"}), 400

    resultado = avaliar_perfil(usuario.id, id, nota, comentario)
    return jsonify(resultado), 201


@avaliacoes_bp.route('/prestadores/<int:id>/avaliacoes', methods=['GET'])
def get_avaliacoes_prestador(id):
    resultado = buscar_avaliacao_por_id_prestador(id)
    return jsonify(resultado), 200
