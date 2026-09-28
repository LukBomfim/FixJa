from flask import Blueprint, request, jsonify
from auth.middleware import login_obrigatorio
from servicos.perfils_service import buscar_perfil_prestador, buscar_perfil_por_id

prestadores_bp = Blueprint('prestadores', __name__)


# ENDPOINTS
@prestadores_bp.route('/prestadores', methods=['GET'])
def get_prestadores():
    categoria = request.args.get('categoria')
    resultado = buscar_perfil_prestador(categoria)
    return jsonify(resultado), 200


@prestadores_bp.route('/prestadores/<int:id>', methods=['GET'])
def get_prestador(id):
    resultado = buscar_perfil_por_id(id)
    if not resultado:
        return jsonify({"erro": "Prestador não encontrado"}), 404
    return jsonify(resultado), 200
