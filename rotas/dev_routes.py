from base64 import b64encode
from flask import Blueprint, jsonify, request

from algoritmos.grafo_geografico import construir_grafo
from auth.middleware import login_obrigatorio
from servicos.benchmark_service import comparar_ordenacoes
from servicos.dev_mode_service import usuario_pode_acessar_dev
from servicos.geografia_service import buscar_prestadores_com_coordenadas
from servicos.perfils_service import buscar_perfil_prestador
from servicos.visualizacao_service import gerar_grafico_geografico

dev_bp = Blueprint("dev", __name__, url_prefix="/dev")


def dev_mode_obrigatorio(function):
    @login_obrigatorio
    def wrapped(*args, **kwargs):
        if not usuario_pode_acessar_dev(request.usuario_atual.id):
            return jsonify({"erro": "Acesso restrito ao Modo Desenvolvedor"}), 403
        return function(*args, **kwargs)

    wrapped.__name__ = function.__name__
    return wrapped


@dev_bp.route("/info", methods=["GET"])
@dev_mode_obrigatorio
def dev_info():
    return jsonify({
        "hash": {
            "algoritmo": "bcrypt, gerenciado pelo Supabase Auth",
            "fluxo": "Cadastro delega a geração e armazenamento do hash ao provedor; login verifica a senha pelo serviço de autenticação.",
            "armazenamento": "Senhas e hashes não são armazenados nem retornados pela aplicação FixJá.",
        },
        "algoritmos": ["Bubble Sort", "Insertion Sort", "Selection Sort", "QuickSort"],
        "estruturas": ["Lista ligada de contratações", "Pilha LIFO de ações confirmadas na sessão"],
    }), 200


@dev_bp.route("/access", methods=["GET"])
@login_obrigatorio
def dev_access():
    return jsonify({"authorized": usuario_pode_acessar_dev(request.usuario_atual.id)}), 200


@dev_bp.route("/benchmark", methods=["GET"])
@dev_mode_obrigatorio
def dev_benchmark():
    prestadores = buscar_perfil_prestador(tamanho=500)
    return jsonify(comparar_ordenacoes(prestadores)), 200


@dev_bp.route("/grafo", methods=["GET"])
@dev_mode_obrigatorio
def dev_grafo():
    prestadores = buscar_prestadores_com_coordenadas()
    vertices = [{
        "id": str(perfil["id"]),
        "nome": str(perfil.get("username") or ""),
        "latitude": float(perfil["latitude"]),
        "longitude": float(perfil["longitude"]),
    } for perfil in prestadores]
    grafo = construir_grafo(vertices, vizinhos=3)
    imagem = gerar_grafico_geografico(vertices, grafo)
    return jsonify({
        "vertices": vertices,
        "arestas": [
            {"origem": origem, "destino": destino, "distancia_km": round(peso, 2)}
            for origem, conexoes in grafo.items()
            for destino, peso in conexoes.items()
            if origem < destino
        ],
        "grafico_png_base64": b64encode(imagem).decode("ascii"),
    }), 200
