from flask import Blueprint, request, jsonify
from auth.middleware import login_obrigatorio
from servicos.contratacoes_service import criar_contratacao_db, buscar_contratacao_por_user_id, buscar_contratacao_por_id_db, atualizar_status_contratacao

contratacoes_bp = Blueprint('contratacoes', __name__)


@contratacoes_bp.route('/contratacoes', methods=['POST'])
@login_obrigatorio
def post_contratacao():
    usuario = request.usuario_atual
    dados = request.json

    resultado = criar_contratacao_db(
        client_id=usuario.id,
        prestador_id=dados.get('prestador_id'),
        descricao=dados.get('descricao'),
        data_solicitada_com_horario=dados.get('data_solicitada')
    )
    return jsonify(resultado), 201


@contratacoes_bp.route('/contratacoes', methods=['GET'])
@login_obrigatorio
def get_contratacoes():
    usuario = request.usuario_atual

    resultado = buscar_contratacao_por_user_id(usuario.id, usuario.tipo)
    return jsonify(resultado), 200


@contratacoes_bp.route('/contratacoes/<int:id>', methods=['GET'])
@login_obrigatorio
def get_contratacao(id):
    usuario = request.usuario_atual
    contratacao = buscar_contratacao_por_id_db(id)

    if not contratacao:
        return jsonify({"erro": "Contratação não encontrada"}), 404

    if usuario.id not in [str(contratacao["cliente_id"]), str(contratacao["prestador_id"])]:
        return jsonify({"erro": "Você não tem permissão para ver esta contratação"}), 403

    return jsonify(contratacao), 200


@contratacoes_bp.route('/contratacoes/<int:id>', methods=['PUT'])
@login_obrigatorio
def put_contratacao(id):
    usuario = request.usuario_atual
    contratacao = buscar_contratacao_por_id_db(id)

    if not contratacao:
        return jsonify({"erro": "Contratação não encontrada"}), 404

    if usuario.id not in [str(contratacao["cliente_id"]), str(contratacao["prestador_id"])]:
        return jsonify({"erro": "Você não tem permissão para alterar esta contratação"}), 403

    status = request.json.get('status')
    if status not in ['pendente', 'aceito', 'concluido', 'cancelado']:
        return jsonify({"erro": "Status inválido"}), 400

    resultado = atualizar_status_contratacao(id, status)
    return jsonify(resultado), 200
