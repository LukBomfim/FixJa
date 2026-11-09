from functools import wraps
from flask import request, jsonify, has_request_context, current_app
from os import getenv
from dotenv import load_dotenv
import httpx
from supabase import AuthApiError, AuthRetryableError, create_client, Client

load_dotenv()

SUPABASE_URL = getenv("SUPABASE_URL")
SUPABASE_KEY = getenv("SUPABASE_KEY")
supabase_client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def get_request_supabase_client() -> Client:
    if has_request_context():
        client = getattr(request, "supabase_client", None)
        if client:
            return client
    return supabase_client


def login_obrigatorio(f):
    @wraps(f)
    def decorada(*args, **kwargs):
        auth_header = request.headers.get('Authorization')

        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"erro": "Não autenticado"}), 401

        token = auth_header.replace('Bearer ', '')

        try:
            resposta = supabase_client.auth.get_user(token)
            usuario = resposta.user
        except AuthApiError as error:
            if error.status in (400, 401, 403):
                return jsonify({"erro": "Sessão inválida ou expirada"}), 401
            current_app.logger.exception("Supabase Auth falhou ao validar a sessão")
            return jsonify({"erro": "Não foi possível validar a sessão agora"}), 503
        except AuthRetryableError:
            current_app.logger.exception("Supabase Auth indisponível ao validar a sessão")
            return jsonify({"erro": "Não foi possível validar a sessão agora"}), 503
        except httpx.HTTPError:
            current_app.logger.exception("Falha inesperada ao validar a sessão")
            return jsonify({"erro": "Não foi possível validar a sessão agora"}), 503

        if not usuario:
            return jsonify({"erro": "Sessão inválida ou expirada"}), 401

        database_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        database_client.postgrest.auth(token)
        request.supabase_client = database_client
        request.usuario_atual = usuario
        return f(*args, **kwargs)

    return decorada