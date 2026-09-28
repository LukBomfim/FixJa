from postgrest import APIResponse
from supabase import AuthApiError, Client, create_client
from supabase_auth import AuthResponse
from dotenv import load_dotenv
from os import getenv
from datetime import datetime,date
from modelos.modelos import Categoria

load_dotenv()

try:
    SUPABASE_URL:str | None = getenv("SUPABASE_URL")
    SUPABASE_KEY:str | None = getenv("SUPABASE_KEY")
except:
    raise Exception("ERRO: Não foi possivel obter as variaveis de ambiente do supabase, verifique se as variaveis estão incluidas no .env") 
 
supabase_client: Client = create_client(SUPABASE_URL,SUPABASE_KEY) # type: ignore


def buscar_todas_categorias():
    global supabase_client
    response = supabase_client.table("categorias").select("*").execute()
    data = response.data
    categorias = [Categoria(**d) for d in data]
    return categorias
