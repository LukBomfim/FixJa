from functools import wraps
from flask import request, jsonify
from os import getenv
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = getenv("SUPABASE_URL")
SUPABASE_KEY = getenv("SUPABASE_KEY")
supabase_client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


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
        except Exception:
            return jsonify({"erro": "Token inválido"}), 401

        if not usuario:
            return jsonify({"erro": "Token inválido"}), 401

        request.usuario_atual = usuario
        return f(*args, **kwargs)

    return decorada