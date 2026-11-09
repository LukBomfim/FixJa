from flask import Blueprint, jsonify, request

from auth.middleware import login_obrigatorio
from servicos.benchmark_service import comparar_ordenacoes
from servicos.perfils_service import buscar_perfil_por_id, buscar_perfil_prestador

analises_bp = Blueprint("analises", __name__)


@analises_bp.route("/analises/benchmark", methods=["GET"])
@login_obrigatorio
def benchmark_ordenacao():
    perfil = buscar_perfil_por_id(request.usuario_atual.id)
    if not perfil:
        return jsonify({"erro": "Perfil não encontrado"}), 404
    if perfil.get("tipo") != "PRESTADOR":
        return jsonify({"erro": "A análise está disponível para prestadores"}), 403
    prestadores = buscar_perfil_prestador(tamanho=500)
    try:
        return jsonify(comparar_ordenacoes(prestadores)), 200
    except RuntimeError as error:
        return jsonify({"erro": str(error)}), 500
