from flask import Blueprint, jsonify, request

from algoritmos.grafo_geografico import coordenadas_validas
from auth.middleware import login_obrigatorio
from servicos.geografia_service import recomendar_prestadores
from servicos.localizacao_service import UFS_BRASIL
from servicos.perfils_service import buscar_perfil_por_id

geografia_bp = Blueprint("geografia", __name__)


@geografia_bp.route("/prestadores/proximos", methods=["POST"])
@login_obrigatorio
def prestadores_proximos():
    perfil = buscar_perfil_por_id(request.usuario_atual.id)
    if not perfil:
        return jsonify({"erro": "Perfil não encontrado"}), 404
    if perfil.get("tipo") != "CLIENTE":
        return jsonify({"erro": "Somente clientes podem consultar recomendações"}), 403

    dados = request.get_json(silent=True)
    if not isinstance(dados, dict):
        return jsonify({"erro": "Informe latitude e longitude no corpo da solicitação"}), 400
    latitude = dados.get("latitude")
    longitude = dados.get("longitude")
    if not coordenadas_validas(latitude, longitude):
        return jsonify({"erro": "Informe latitude e longitude válidas"}), 400
    cidade = dados.get("cidade")
    if cidade is not None and (not isinstance(cidade, str) or len(cidade) > 100):
        return jsonify({"erro": "Cidade inválida"}), 400
    estado = dados.get("estado")
    if estado is not None and (not isinstance(estado, str) or estado.upper() not in UFS_BRASIL):
        return jsonify({"erro": "Estado inválido"}), 400

    resultado = recomendar_prestadores(
        latitude,
        longitude,
        cidade=cidade or None,
        estado=estado.upper() if estado else None,
    )
    return jsonify(resultado), 200
