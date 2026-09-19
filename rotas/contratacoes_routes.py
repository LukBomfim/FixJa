from flask import Blueprint, request, jsonify
from auth.middleware import login_obrigatorio

contratacoes_bp = Blueprint('contratacoes', __name__)

# FUNÇÕES FAKE TIRAR DEPOIS
def criar_contratacao(cliente_id, prestador_id, descricao, data_solicitada):
    return {
        "id": 10, "cliente_id": cliente_id, "prestador_id": prestador_id,
        "descricao": descricao, "data_solicitada": data_solicitada, "status": "pendente"
    }

def buscar_contratacao(id):
    return {
        "id": id, "cliente_id": 5, "prestador_id": 1,
        "descricao": "Vazamento na cozinha", "data_solicitada": "2026-09-20", "status": "pendente"
    }

def atualizar_status_contratacao(id, status):
    contratacao = buscar_contratacao(id)
    contratacao["status"] = status
    return contratacao







@contratacoes_bp.route('/contratacoes', methods=['POST'])
@login_obrigatorio
def post_contratacao():
    usuario = request.usuario_atual
    dados = request.json

    resultado = criar_contratacao(
        cliente_id=usuario.id,
        prestador_id=dados.get('prestador_id'),
        descricao=dados.get('descricao'),
        data_solicitada=dados.get('data_solicitada')
    )
    return jsonify(resultado), 201


@contratacoes_bp.route('/contratacoes/<int:id>', methods=['GET'])
@login_obrigatorio
def get_contratacao(id):
    usuario = request.usuario_atual
    contratacao = buscar_contratacao(id)

    if not contratacao:
        return jsonify({"erro": "Contratação não encontrada"}), 404

    if usuario.id not in [str(contratacao["cliente_id"]), str(contratacao["prestador_id"])]:
        return jsonify({"erro": "Você não tem permissão para ver esta contratação"}), 403

    return jsonify(contratacao), 200


@contratacoes_bp.route('/contratacoes/<int:id>', methods=['PUT'])
@login_obrigatorio
def put_contratacao(id):
    usuario = request.usuario_atual
    contratacao = buscar_contratacao(id)

    if not contratacao:
        return jsonify({"erro": "Contratação não encontrada"}), 404

    if usuario.id not in [str(contratacao["cliente_id"]), str(contratacao["prestador_id"])]:
        return jsonify({"erro": "Você não tem permissão para alterar esta contratação"}), 403

    status = request.json.get('status')
    if status not in ['pendente', 'aceito', 'concluido', 'cancelado']:
        return jsonify({"erro": "Status inválido"}), 400

    resultado = atualizar_status_contratacao(id, status)
    return jsonify(resultado), 200