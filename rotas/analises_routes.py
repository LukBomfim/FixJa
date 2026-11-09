from flask import Blueprint, jsonify

from rotas.dev_routes import dev_mode_obrigatorio
from servicos.benchmark_service import comparar_ordenacoes
from servicos.perfils_service import buscar_perfil_prestador

analises_bp = Blueprint("analises", __name__)


@analises_bp.route("/analises/benchmark", methods=["GET"])
@dev_mode_obrigatorio
def benchmark_ordenacao():
    prestadores = buscar_perfil_prestador(tamanho=500)
    return jsonify(comparar_ordenacoes(prestadores)), 200
