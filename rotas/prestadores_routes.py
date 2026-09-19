from flask import Blueprint, request, jsonify

prestadores_bp = Blueprint('prestadores', __name__)

# FUNÇÕES FAKE PARA TESTES, TROCAR DEPOIS PELO IMPORT DE SERVICOS/prestadores_service.py
def buscar_prestadores(categoria=None, cidade=None):
    dados_falsos = [
        {"id": 1, "nome": "João Silva", "categoria": "encanador", "cidade": "São Paulo", "estado":"São Paulo", "nota_media": 4.5},
        {"id": 2, "nome": "Maria Souza", "categoria": "eletricista", "cidade": "São Paulo", "estado":"São Paulo", "nota_media": 4.8}
    ]
    if categoria:
        dados_falsos = [p for p in dados_falsos if p["categoria"] == categoria]
    if cidade:
        dados_falsos = [p for p in dados_falsos if p["cidade"] == cidade]
    return dados_falsos

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
    cidade = request.args.get('cidade')
    resultado = buscar_prestadores(categoria, cidade)
    return jsonify(resultado), 200


@prestadores_bp.route('/prestadores/<int:id>', methods=['GET'])
def get_prestador(id):
    resultado = buscar_prestador_por_id(id)
    if not resultado:
        return jsonify({"erro": "Prestador não encontrado"}), 404
    return jsonify(resultado), 200


@prestadores_bp.route('/prestadores/<int:id>', methods=['PUT'])
def put_prestador(id):
    # TODO: checar token (auth/middleware.py) e se usuario_logado.id == id, senão 403
    dados = request.json
    resultado = atualizar_prestador(id, dados)
    return jsonify(resultado), 200