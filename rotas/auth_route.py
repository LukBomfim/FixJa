from flask import Blueprint, request, jsonify
from auth.middleware import login_obrigatorio
from servicos.auth_service import logar_usuario, registrar_usuario
from servicos.perfils_service import atualizar_perfil, buscar_perfil_por_id, criar_perfil

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        dados = request.get_json() or {}
        email = dados['email']
        senha = dados['senha']

        resultado = logar_usuario(email, senha)
        if resultado is None:
            return jsonify({"erro": "Email ou senha inválidos"}), 401

        usuario, token = resultado
        return jsonify({"usuario": usuario, "token": token}), 200

    except KeyError as e:
        return jsonify({"erro": f"O campo {str(e)} é obrigatório!"}), 400

    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@auth_bp.route('/register', methods=['POST'])
def registrar():
    try:
        dados = request.get_json() or {}

        email = dados['email']
        senha = dados['senha']
        username = dados['username']

        resultado = registrar_usuario(
            email,
            senha,
            username,
        )
        if not resultado:
            return jsonify({"erro": "Não foi possível criar a conta"}), 400
        user, token = resultado
        return jsonify({
            "usuario": {"id": user.id, "username": user.username, "email": user.email},
            "token": token,
        }), 201
    except KeyError as e:
        return jsonify({"erro": f"O campo {str(e)} é obrigatório!"}), 400

    except Exception as e:
        return jsonify({"erro": str(e)}), 400 
@auth_bp.route('/register/profile', methods=['POST'])
@login_obrigatorio
def registrar_perfil():
    try:
        dados = request.get_json() or {}
        usuario = request.usuario_atual
        if buscar_perfil_por_id(usuario.id):
            return jsonify({"erro": "O perfil já existe"}), 409
        if dados.get('tipo') not in ('CLIENTE', 'PRESTADOR'):
            return jsonify({"erro": "Tipo de perfil inválido"}), 400
        if not isinstance(dados.get('username'), str) or not dados['username'].strip():
            return jsonify({"erro": "O campo 'username' é obrigatório"}), 400
        perfil = criar_perfil(usuario.id, usuario.email, dados)
        return jsonify(perfil), 201
    except KeyError as e:
        return jsonify({"erro": f"O campo {str(e)} é obrigatório!"}), 400

    except Exception as e:
        return jsonify({"erro": str(e)}), 400


@auth_bp.route('/perfil', methods=['GET'])
@login_obrigatorio
def meu_perfil():
    perfil = buscar_perfil_por_id(request.usuario_atual.id)
    if not perfil:
        return jsonify({"erro": "Perfil não encontrado"}), 404
    return jsonify(perfil), 200


@auth_bp.route('/perfil', methods=['PUT'])
@login_obrigatorio
def editar_meu_perfil():
    if not buscar_perfil_por_id(request.usuario_atual.id):
        return jsonify({"erro": "Perfil não encontrado"}), 404
    dados = request.get_json() or {}
    perfil = atualizar_perfil(request.usuario_atual.id, dados)
    if not perfil:
        return jsonify({"erro": "Não foi possível atualizar o perfil"}), 400
    return jsonify(perfil), 200
