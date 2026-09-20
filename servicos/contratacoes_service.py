from postgrest import APIResponse
from supabase import AuthApiError, Client, create_client
from supabase_auth import AuthResponse
from dotenv import load_dotenv
from os import getenv
from datetime import date
from modelos.modelos import Contratacao, Usuario

load_dotenv()

try:
    SUPABASE_URL:str | None = getenv("SUPABASE_URL")
    SUPABASE_KEY:str | None = getenv("SUPABASE_KEY")
except:
    raise Exception("ERRO: Não foi possivel obter as variaveis de ambiente do supabase, verifique se as variaveis estão incluidas no .env") 
 
supabase_client: Client = create_client(SUPABASE_URL,SUPABASE_KEY) # type: ignore

def criar_contratacao(client_id:str,prestador_id:str,descricao:str,data_solicitada:date) -> APIResponse:
    global supabase_client
    contratacao = Contratacao(
        id=None,
        client_id=client_id,
        prestador_id=prestador_id,
        data_solicitada=data_solicitada.isoformat(),
        descricao=descricao,
        created_at=None,
        status="INICIADO"
    )
    response = supabase_client.table("contratacoes").insert({ # type: ignore
        "client_id":contratacao.client_id,
        "prestador_id":contratacao.prestador_id,
        "descricao":contratacao.descricao,
        "data_solicitada":contratacao.data_solicitada,
        "status":contratacao.status
    }).execute()
    return response

def buscar_contratacao_por_id(id):
    global supabase_client
    response = supabase_client.table("contratacoes").select("*").eq("id",id).execute()
    data = response.data[0]
    contratacao = Contratacao(**data) # type: ignore
    return contratacao

def buscar_contratacao_por_client_id(id):
    global supabase_client
    response = supabase_client.table("contratacoes").select("*").eq("client_id",id).execute()
    data = response.data[0]    
    contratacao = Contratacao(**data) # type: ignore
    return contratacao

def buscar_contratacao_por_prestador_id(id):
    global supabase_client
    response = supabase_client.table("contratacoes").select("*").eq("prestador_id",id).execute()
    data = response.data[0]    
    contratacao = Contratacao(**data) # type: ignore
    return contratacao
