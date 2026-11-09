from flask import Blueprint, request, jsonify, current_app
import httpx
from supabase import AuthApiError, AuthRetryableError
from auth.middleware import login_obrigatorio
from servicos.auth_service import logar_usuario, registrar_usuario, renovar_sessao
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

        usuario, token, refresh_token = resultado
        return jsonify({"usuario": usuario, "token": token, "refresh_token": refresh_token}), 200

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
        user, token, refresh_token = resultado
        return jsonify({
            "usuario": {"id": user.id, "username": user.username, "email": user.email},
            "token": token,
            "refresh_token": refresh_token,
        }), 201
    except KeyError as e:
        return jsonify({"erro": f"O campo {str(e)} é obrigatório!"}), 400

    except Exception as e:
        return jsonify({"erro": str(e)}), 400 


@auth_bp.route('/session/refresh', methods=['POST'])
def atualizar_sessao():
    dados = request.get_json(silent=True) or {}
    refresh_token = dados.get("refresh_token")
    if not isinstance(refresh_token, str) or not refresh_token.strip():
        return jsonify({"erro": "Sessão expirada. Entre novamente."}), 400

    try:
        resultado = renovar_sessao(refresh_token)
    except AuthApiError:
        current_app.logger.exception("Supabase Auth falhou ao renovar a sessão")
        return jsonify({"erro": "Não foi possível atualizar a sessão agora. Tente novamente."}), 503
    except AuthRetryableError:
        current_app.logger.exception("Supabase Auth indisponível ao renovar a sessão")
        return jsonify({"erro": "Não foi possível atualizar a sessão agora. Tente novamente."}), 503
    except httpx.HTTPError:
        current_app.logger.exception("Falha de rede ao renovar a sessão")
        return jsonify({"erro": "Não foi possível atualizar a sessão agora. Tente novamente."}), 503

    if resultado is None:
        return jsonify({"erro": "Sua sessão expirou. Entre novamente."}), 401
    token, novo_refresh_token = resultado
    return jsonify({"token": token, "refresh_token": novo_refresh_token}), 200
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
        try:
            perfil = criar_perfil(usuario.id, usuario.email, dados)
        except ValueError as error:
            return jsonify({"erro": str(error)}), 400
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
    try:
        perfil = atualizar_perfil(request.usuario_atual.id, dados)
    except ValueError as error:
        return jsonify({"erro": str(error)}), 400
    if not perfil:
        return jsonify({"erro": "Não foi possível atualizar o perfil"}), 400
    return jsonify(perfil), 200
