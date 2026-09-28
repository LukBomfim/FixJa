from flask import Blueprint, jsonify
from servicos.categorias_service import buscar_todas_categorias

categorias_bp = Blueprint('categorias', __name__)

@categorias_bp.route('/categorias', methods=['GET'])
def get_categorias():
    resultado = buscar_todas_categorias()
    return jsonify(resultado), 200