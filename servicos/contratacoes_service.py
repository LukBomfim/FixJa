from postgrest import APIResponse
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
    contratacao = Contratacao(
        id=None,
        client_id=client_id,
        prestador_id=prestador_id,
        data_solicitada=data_solicitada_com_horario,
        descricao=descricao,
        data=None,
        created_at=None,
        status="INICIADO"
    )
    print(contratacao.data_solicitada)
    response = supabase_client.table("contratacoes").insert({ # type: ignore
        "client_id":contratacao.client_id,
        "prestador_id":contratacao.prestador_id,
        "descricao":contratacao.descricao,
        "data":contratacao.data.isoformat(),
        "data_solicitada":contratacao.data_solicitada.strftime("%Y-%m-%d %H:%M:%S"),
        "status":contratacao.status
    }).execute()
    return contratacao

def buscar_contratacao_por_id_db(id):
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

def confirmar_contratacao(contratacao_id):
    global supabase_client
    response = supabase_client.table("contratacoes").select("*").eq("id",contratacao_id).execute()
    if len(response.data) <= 0:
        return False
    data = response.data[0]  
    contratacao = Contratacao(**data) # type: ignore
    supabase_client.table("contratacoes").update({"status":"CONCLUIDO"}).eq("id",contratacao.id).execute()
    return False    
