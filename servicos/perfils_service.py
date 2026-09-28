from supabase import AuthApiError, Client, create_client
from supabase_auth import AuthResponse
from dotenv import load_dotenv
from os import getenv
from datetime import datetime
from modelos.modelos import Usuario

load_dotenv()

try:
    SUPABASE_URL:str | None = getenv("SUPABASE_URL")
    SUPABASE_KEY:str | None = getenv("SUPABASE_KEY")
except:
    raise Exception("ERRO: Não foi possivel obter as variaveis de ambiente do supabase, verifique se as variaveis estão incluidas no .env") 
 
supabase_client: Client = create_client(SUPABASE_URL,SUPABASE_KEY) # type: ignore


def buscar_perfil_por_categoria(categoria,tamanho):
    global supabase_client
    response = supabase_client.table("profiles").select("*").eq("categoria",categoria).limit(tamanho).execute()
    data = response.data
    usuarios = [ Usuario(**d) for d in data]
    return usuarios    

print(buscar_perfil_por_categoria("ELETRICISTA",1))