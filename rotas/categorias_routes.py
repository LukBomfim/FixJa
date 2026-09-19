from flask import Blueprint, jsonify

categorias_bp = Blueprint('categorias', __name__)

def listar_categorias(): # FUNÇÃO TEMPORÁRIA
    return [
        {"id": 1, "nome": "encanador"},
        {"id": 2, "nome": "eletricista"},
        {"id": 3, "nome": "pintor"}
    ]

@categorias_bp.route('/categorias', methods=['GET'])
def get_categorias():
    resultado = listar_categorias()
    return jsonify(resultado), 200