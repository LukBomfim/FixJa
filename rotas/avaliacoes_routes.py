from flask import Blueprint, request, jsonify
from auth.middleware import login_obrigatorio

avaliacoes_bp = Blueprint('avaliacoes', __name__)

# FUNÇÕES FAKE PARA TESTES
def buscar_contratacao(id): # TROCAR DEPOIS PELO IMPORT DE SERVICOS/contratacoes_service.py
    return {
        "id": id, "cliente_id": 5, "prestador_id": 1,
        "descricao": "Vazamento na cozinha", "data_solicitada": "2026-09-20", "status": "concluido"
    }

def criar_avaliacao(contratacao_id, nota, comentario):
    return {
        "id": 3, "contratacao_id": contratacao_id,
        "nota": nota, "comentario": comentario, "data": "2026-09-16"
    }

def listar_avaliacoes_prestador(prestador_id):
    return [
        {"id": 3, "nota": 5, "comentario": "Ótimo serviço, rápido e educado", "data": "2026-09-16"}
    ]






@avaliacoes_bp.route('/contratacoes/<int:id>/avaliacoes', methods=['POST'])
@login_obrigatorio
def post_avaliacao(id):
    usuario = request.usuario_atual
    contratacao = buscar_contratacao(id)

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

    resultado = criar_avaliacao(id, nota, comentario)
    return jsonify(resultado), 201


@avaliacoes_bp.route('/prestadores/<int:id>/avaliacoes', methods=['GET'])
def get_avaliacoes_prestador(id):
    resultado = listar_avaliacoes_prestador(id)
    return jsonify(resultado), 200
