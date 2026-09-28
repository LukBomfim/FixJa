from flask import Blueprint, request, jsonify
from auth.middleware import login_obrigatorio
from servicos.contratacoes_service import criar_contratacao_db, buscar_contratacao_por_user_id, buscar_contratacao_por_id_db, atualizar_estado_contratacao
from servicos.perfils_service import buscar_ids_contratacoes_avaliadas, buscar_nomes_perfis_por_ids, buscar_perfil_por_id

contratacoes_bp = Blueprint('contratacoes', __name__)


def _incluir_nomes(contratacoes):
    perfis = buscar_nomes_perfis_por_ids(
        user_id
        for contratacao in contratacoes
        for user_id in (contratacao.get("client_id"), contratacao.get("prestador_id"))
    )
    resposta = []
    for contratacao in contratacoes:
        cliente = perfis.get(str(contratacao.get("client_id")), {})
        prestador = perfis.get(str(contratacao.get("prestador_id")), {})
        if isinstance(cliente, str):
            cliente = {"username": cliente}
        if isinstance(prestador, str):
            prestador = {"username": prestador}
        dados = {
            **contratacao,
            "cliente_nome": cliente.get("username"),
            "cliente_email": cliente.get("email"),
            "cliente_telefone": cliente.get("telefone"),
            "prestador_nome": prestador.get("username"),
            "prestador_email": prestador.get("email"),
            "prestador_telefone": prestador.get("telefone"),
        }
        if str(contratacao.get("status", "")).lower() == "recusado":
            dados["mensagem"] = "O prestador recusou o seu pedido."
        resposta.append(dados)
    return resposta


@contratacoes_bp.route('/contratacoes', methods=['POST'])
@login_obrigatorio
def post_contratacao():
    usuario = request.usuario_atual
    perfil = buscar_perfil_por_id(usuario.id)
    if not perfil:
        return jsonify({"erro": "Crie seu perfil antes de solicitar um serviço"}), 409
    if perfil["tipo"] != "CLIENTE":
        return jsonify({"erro": "Somente clientes podem solicitar serviços"}), 403
    dados = request.get_json() or {}
    prestador_id = dados.get('prestador_id')
    descricao = dados.get('descricao')
    data_solicitada = dados.get('data_solicitada')
    if not prestador_id or not isinstance(descricao, str) or not descricao.strip() or not data_solicitada:
        return jsonify({"erro": "prestador_id, descricao e data_solicitada são obrigatórios"}), 400
    prestador = buscar_perfil_por_id(prestador_id)
    if not prestador or prestador["tipo"] != "PRESTADOR":
        return jsonify({"erro": "Prestador não encontrado"}), 404

    try:
        resultado = criar_contratacao_db(
            client_id=usuario.id,
            prestador_id=prestador_id,
            descricao=descricao.strip(),
            data_solicitada_com_horario=data_solicitada
        )
    except (TypeError, ValueError):
        return jsonify({"erro": "data_solicitada deve ser uma data/hora ISO válida"}), 400
    resultado["cliente_nome"] = perfil["username"]
    resultado["cliente_email"] = perfil.get("email")
    resultado["cliente_telefone"] = perfil.get("telefone")
    resultado["prestador_nome"] = prestador["username"]
    resultado["prestador_email"] = prestador.get("email")
    resultado["prestador_telefone"] = prestador.get("telefone")
    return jsonify(resultado), 201


@contratacoes_bp.route('/contratacoes', methods=['GET'])
@login_obrigatorio
def get_contratacoes():
    usuario = request.usuario_atual
    perfil = buscar_perfil_por_id(usuario.id)
    if not perfil:
        return jsonify({"erro": "Perfil não encontrado"}), 404
    resultado = buscar_contratacao_por_user_id(usuario.id, perfil["tipo"])
    contratos = _incluir_nomes(resultado)
    ids_avaliados = buscar_ids_contratacoes_avaliadas(
        contrato.get("id") for contrato in contratos
    )
    return jsonify([
        {**contrato, "avaliada": str(contrato.get("id")) in ids_avaliados}
        for contrato in contratos
    ]), 200


@contratacoes_bp.route('/contratacoes/<string:id>', methods=['GET'])
@login_obrigatorio
def get_contratacao(id):
    usuario = request.usuario_atual
    contratacao = buscar_contratacao_por_id_db(id)

    if not contratacao:
        return jsonify({"erro": "Contratação não encontrada"}), 404

    if usuario.id not in [str(contratacao["client_id"]), str(contratacao["prestador_id"])]:
        return jsonify({"erro": "Você não tem permissão para ver esta contratação"}), 403

    return jsonify(_incluir_nomes([contratacao])[0]), 200


@contratacoes_bp.route('/contratacoes/<string:id>', methods=['PUT'])
@login_obrigatorio
def put_contratacao(id):
    usuario = request.usuario_atual
    contratacao = buscar_contratacao_por_id_db(id)
    
    if not contratacao:
        return jsonify({"erro": "Contratação não encontrada"}), 404

    if usuario.id not in [str(contratacao["client_id"]), str(contratacao["prestador_id"])]:
        return jsonify({"erro": "Você não tem permissão para alterar esta contratação"}), 403

    dados = request.get_json() or {}
    status = str(dados.get('status', '')).strip().lower()
    if status in ('recusar', 'rejeitar', 'rejeitado', 'rejeitada'):
        status = 'recusado'
    status_atual = str(contratacao["status"]).lower()
    perfil = buscar_perfil_por_id(usuario.id)
    if not perfil:
        return jsonify({"erro": "Perfil não encontrado"}), 404
    transicoes_prestador = {"pendente": "aceito", "aceito": "concluido"}
    pode_alterar = (
        perfil["tipo"] == "PRESTADOR" and transicoes_prestador.get(status_atual) == status
    ) or (
        perfil["tipo"] == "PRESTADOR" and status_atual == "pendente" and status == "recusado"
    ) or (
        perfil["tipo"] == "CLIENTE" and status_atual in ("pendente", "aceito") and status == "cancelado"
    ) or (
        perfil["tipo"] == "CLIENTE" and status_atual == "aceito" and status == "concluido"
    )
    if not pode_alterar:
        if status not in ['pendente', 'aceito', 'concluido', 'cancelado', 'recusado']:
            return jsonify({"erro": "Status inválido"}), 400
        return jsonify({"erro": "Transição de status não permitida"}), 403

    resultado = atualizar_estado_contratacao(id, status)
    if not resultado:
        return jsonify({"erro": "Não foi possível atualizar a contratação"}), 400
    return jsonify(_incluir_nomes([resultado])[0]), 200
