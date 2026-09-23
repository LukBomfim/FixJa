from flask import Blueprint, request, jsonify
from servicos.auth_service import logar_usuario,registrar_usuario

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login',methods=['POST'])
def login():
    dados = request.get_json()
    email = dados['email']
    senha = dados['senha']
    user = logar_usuario(email,senha)
    return jsonify(user.__dict__)

@auth_bp.route('/register',methods=['POST'])
def registrar():
    dados = request.get_json()
    email = dados['email']
    senha = dados['senha']
    username = dados['username']
    data_nascimento = dados['data_nascimento']
    telefone = dados['telefone']
    tipo = dados['tipo']
    categoria = dados['categoria']
    cidade = dados['cidade']
    descricao = dados['descricao']
    avaliacao = 0.0
    
    user = registrar_usuario(
        email,
        senha,
        username,
        data_nascimento,
        telefone,
        tipo,
        categoria,
        cidade,
        descricao,
        avaliacao)
    return jsonify(user.__dict__)    