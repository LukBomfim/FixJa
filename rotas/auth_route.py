from flask import Blueprint, request, jsonify
from modelos.modelos import Usuario
from servicos.auth_service import logar_usuario, registrar_usuario,criar_perfil

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

        user = registrar_usuario(
            email,
            senha,
            username,
        )
        return jsonify(user.__dict__), 201
    except KeyError as e:
        return jsonify({"erro": f"O campo {str(e)} é obrigatório!"}), 400

    except Exception as e:
        return jsonify({"erro": str(e)}), 400 
@auth_bp.route('/register/profile', methods=['POST'])
def registrar_perfil():
    try:
        dados = request.get_json() or {}
        tipo = dados['tipo']
        usuario = Usuario(**dados['usuario'])
        data_nascimento = dados.get('data_nascimento')
        telefone = dados.get('telefone')
        categoria = dados.get('categoria')
        cidade = dados.get('cidade')
        descricao = dados.get('descricao')
        avaliacao = 0.0

        user = criar_perfil(
            usuario,
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
        return jsonify({"erro": str(e)}), 400
