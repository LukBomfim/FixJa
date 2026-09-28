from supabase import AuthApiError, Client, create_client
from auth.middleware import get_request_supabase_client
from supabase import AuthApiError, Client, create_client
from supabase_auth import AuthResponse
from dotenv import load_dotenv
from os import getenv
from datetime import date
from modelos.modelos import Usuario

load_dotenv()

try:
    SUPABASE_URL:str | None = getenv("SUPABASE_URL")
    SUPABASE_KEY:str | None = getenv("SUPABASE_KEY")
except:
    raise Exception("ERRO: Não foi possivel obter as variaveis de ambiente do supabase, verifique se as variaveis estão incluidas no .env") 
 
supabase_client: Client = create_client(SUPABASE_URL,SUPABASE_KEY) # type: ignore


def buscar_perfil_prestador(categoria=None, cidade=None, tamanho=50):
    global supabase_client
    query = get_request_supabase_client().table("profiles").select("*").eq("tipo", "PRESTADOR")
    if categoria:
        query = query.eq("categoria", categoria)
    if cidade:
        query = query.ilike("cidade", f"%{cidade}%")
    response = query.limit(tamanho).execute()
    return [_prestador_publico(perfil) for perfil in response.data]


def buscar_perfil_por_id(id):
    global supabase_client
    response = get_request_supabase_client().table("profiles").select("*").eq("id", id).limit(1).execute()
    if not response.data:
        return None
    return _perfil_publico(response.data[0])


def buscar_nomes_perfis_por_ids(user_ids):
    ids = list(dict.fromkeys(str(user_id) for user_id in user_ids if user_id))
    if not ids:
        return {}
    response = (
        get_request_supabase_client()
        .table("profiles")
        .select("id, username, email, telefone")
        .in_("id", ids)
        .execute()
    )
    nomes = {}
    for perfil in response.data:
        if isinstance(perfil, dict):
            user_id = perfil.get("id")
            username = perfil.get("username")
            if isinstance(user_id, str) and isinstance(username, str):
                nomes[user_id] = {
                    "username": username,
                    "email": perfil.get("email"),
                    "telefone": perfil.get("telefone"),
                }
    return nomes


def buscar_ids_contratacoes_avaliadas(contratacao_ids):
    ids = list(dict.fromkeys(str(contratacao_id) for contratacao_id in contratacao_ids if contratacao_id))
    if not ids:
        return set()
    response = (
        get_request_supabase_client()
        .table("avaliacoes")
        .select("contratacao_id")
        .in_("contratacao_id", ids)
        .execute()
    )
    avaliadas = set()
    if isinstance(response.data, list):
        for avaliacao in response.data:
            contratacao_id = avaliacao.get("contratacao_id") if isinstance(avaliacao, dict) else None
            if isinstance(contratacao_id, str):
                avaliadas.add(contratacao_id)
    return avaliadas


def _perfil_publico(perfil):
    perfil = dict(perfil)
    perfil.pop("senha", None)
    return perfil


def _prestador_publico(perfil):
    perfil = _perfil_publico(perfil)
    perfil.pop("data_nascimento", None)
    return perfil


def buscar_perfil_prestador_por_id(user_id):
    perfil = buscar_perfil_por_id(user_id)
    if not perfil or perfil.get("tipo") != "PRESTADOR":
        return None
    return _prestador_publico(perfil)


def criar_perfil(user_id, email, dados):
    perfil = {
        "id": user_id,
        "email": email,
        "username": dados["username"].strip(),
        "telefone": dados.get("telefone") or "",
        "data_nascimento": dados.get("data_nascimento") or date(1990, 1, 1).isoformat(),
        "tipo": dados["tipo"],
        "categoria": dados.get("categoria") or None,
        "cidade": dados.get("cidade") or "",
        "descricao": dados.get("descricao") or None,
        "avaliacao": 0.0,
    }
    response = get_request_supabase_client().table("profiles").insert(perfil).execute()
    return _perfil_publico(response.data[0]) if response.data else perfil


def atualizar_perfil(user_id, dados):
    campos = ("username", "telefone", "data_nascimento", "categoria", "cidade", "descricao")
    alteracoes = {campo: dados[campo] for campo in campos if campo in dados}
    if "username" in alteracoes and isinstance(alteracoes["username"], str):
        alteracoes["username"] = alteracoes["username"].strip()
    if not alteracoes:
        return buscar_perfil_por_id(user_id)
    response = (
        get_request_supabase_client().table("profiles")
        .update(alteracoes)
        .eq("id", user_id)
        .execute()
    )
    return _perfil_publico(response.data[0]) if response.data else buscar_perfil_por_id(user_id)

def avaliar_perfil(user_id,contratacao_id,nota,comentario):
    global supabase_client
    client = get_request_supabase_client()
    user_response = client.table("profiles").select("*").eq("id",user_id).execute()
    if not user_response.data:
        return None

    existente = (
        client.table("avaliacoes")
        .select("id")
        .eq("contratacao_id", contratacao_id)
        .limit(1)
        .execute()
    ).data
    if existente:
        raise ValueError("Esta contratação já foi avaliada")

    response = client.table("avaliacoes").insert({
        "contratacao_id":contratacao_id,
        "nota":nota,
        "comentario":comentario,
        "prestador_id":user_id
    }).execute()
    avaliacoes = (
        client.table("avaliacoes")
        .select("nota")
        .eq("prestador_id", user_id)
        .execute()
    ).data
    notas = []
    if isinstance(avaliacoes, list):
        for avaliacao in avaliacoes:
            nota = avaliacao.get("nota") if isinstance(avaliacao, dict) else None
            if isinstance(nota, (int, float)):
                notas.append(float(nota))
    if not notas:
        return None
    media = sum(notas) / len(notas)
    client.table("profiles").update({"avaliacao": media}).eq("id",user_id).execute()
    return response.data[0] if response.data else None

def buscar_avaliacao_por_id_prestador(user_id):
    global supabase_client
    response = (
        get_request_supabase_client()
        .table("avaliacoes")
        .select("*")
        .eq("prestador_id", user_id)
        .order("data", desc=True)
        .limit(5)
        .execute()
    )
    return response.data
