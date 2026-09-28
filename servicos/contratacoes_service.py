from postgrest import APIResponse
from auth.middleware import get_request_supabase_client
from supabase import AuthApiError, Client, create_client
from supabase_auth import AuthResponse
from dotenv import load_dotenv
from os import getenv
from datetime import datetime,date
from modelos.modelos import Contratacao, Usuario

load_dotenv()

try:
    SUPABASE_URL:str | None = getenv("SUPABASE_URL")
    SUPABASE_KEY:str | None = getenv("SUPABASE_KEY")
except:
    raise Exception("ERRO: Não foi possivel obter as variaveis de ambiente do supabase, verifique se as variaveis estão incluidas no .env") 
 
supabase_client: Client = create_client(SUPABASE_URL,SUPABASE_KEY) # type: ignore

def criar_contratacao_db(client_id:str,prestador_id:str,descricao:str,data_solicitada_com_horario:str) -> Contratacao:
    global supabase_client
    data_solicitada = datetime.fromisoformat(data_solicitada_com_horario.replace("Z", "+00:00"))
    dados = {
        "client_id": client_id,
        "prestador_id": prestador_id,
        "descricao": descricao,
        "data": data_solicitada.date().isoformat(),
        "data_solicitada": data_solicitada.isoformat(),
        "status": "pendente",
    }
    response = get_request_supabase_client().table("contratacoes").insert(dados).execute()
    return response.data[0] if response.data else dados

def buscar_contratacao_por_id_db(id):
    global supabase_client
    response = get_request_supabase_client().table("contratacoes").select("*").eq("id", id).limit(1).execute()
    return response.data[0] if response.data else None

      
def buscar_contratacao_por_client_id(id):
    global supabase_client
    response = get_request_supabase_client().table("contratacoes").select("*").eq("client_id",id).execute()
    return response.data

def buscar_contratacao_por_prestador_id(id):
    global supabase_client
    response = get_request_supabase_client().table("contratacoes").select("*").eq("prestador_id",id).execute()
    return response.data

def buscar_contratacao_por_user_id(id,tipo):
    if tipo == "PRESTADOR":
        contratacoes = buscar_contratacao_por_prestador_id(id)
    elif tipo == "CLIENTE":
        contratacoes = buscar_contratacao_por_client_id(id)
    else:
        return []
    return contratacoes  


def atualizar_estado_contratacao(contratacao_id,estado):
    global supabase_client
    response = (
        get_request_supabase_client().table("contratacoes")
        .update({"status": estado})
        .eq("id", contratacao_id)
        .execute()
    )
    return response.data[0] if response.data else None