from flask import Blueprint, request, jsonify
from servicos.auth_service import logar_usuario, registrar_usuario

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        dados = request.get_json() or {}
        email = dados['email']
        senha = dados['senha']
        user = logar_usuario(email, senha)
        return jsonify(user.__dict__), 200

    except KeyError as e:
        return jsonify({"erro": f"O campo {str(e)} é obrigatório!"}), 400

    except Exception as e:
        return jsonify({"erro": str(e)}), 400


@auth_bp.route('/register', methods=['POST'])
def registrar():
    try:
        dados = request.get_json() or {}

        email = dados['email']
        senha = dados['senha']
        username = dados['username']
        tipo = dados['tipo']

        data_nascimento = dados.get('data_nascimento')
        telefone = dados.get('telefone')
        categoria = dados.get('categoria')
        cidade = dados.get('cidade')
        descricao = dados.get('descricao')
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
            avaliacao
        )
        return jsonify(user.__dict__), 201

    except KeyError as e:
        return jsonify({"erro": f"O campo {str(e)} é obrigatório!"}), 400

    except Exception as e:
        return jsonify({"erro": str(e)}), 40