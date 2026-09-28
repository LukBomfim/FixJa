from flask import Blueprint, request, jsonify
from auth.middleware import login_obrigatorio
from servicos.perfils_service import buscar_perfil_prestador

prestadores_bp = Blueprint('prestadores', __name__)

def buscar_prestador_por_id(id):
    return {
        "id": id, "nome": "João Silva", "categoria": "encanador",
        "cidade": "São Paulo", "descricao": "Encanador com 10 anos de experiência",
        "nota_media": 4.5, "telefone": "11999999999"
    }

def atualizar_prestador(id, dados):
    return {"id": id, **dados}







# ENDPOINTS
@prestadores_bp.route('/prestadores', methods=['GET'])
def get_prestadores():
    categoria = request.args.get('categoria')
    resultado = buscar_perfil_prestador(categoria)
    return jsonify(resultado), 200


@prestadores_bp.route('/prestadores/<int:id>', methods=['GET'])
def get_prestador(id):
    resultado = buscar_prestador_por_id(id)
    if not resultado:
        return jsonify({"erro": "Prestador não encontrado"}), 404
    return jsonify(resultado), 200


@prestadores_bp.route('/prestadores/<int:id>', methods=['PUT'])
@login_obrigatorio
def put_prestador(id):
    usuario = request.usuario_atual

    if usuario.id != str(id):
        return jsonify({"erro": "Você não tem permissão para editar este perfil"}), 403

    
    dados = request.json
    resultado = atualizar_prestador(id, dados)
    return jsonify(resultado), 200