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


def buscar_perfil_prestador(categoria=None,tamanho=10):
    global supabase_client
    if categoria != None:
        response = supabase_client.table("profiles").select("*").eq("categoria",categoria).limit(tamanho).execute()
    else:
        response = supabase_client.table("profiles").select("*").eq("tipo","PRESTADOR").limit(tamanho).execute()    
    data = response.data
    usuarios = [Usuario(**d) for d in data]
    return usuarios    


def buscar_perfil_por_id(id):
    global supabase_client
    response = supabase_client.table("profiles").select("*").eq("id",id).execute()    
    data = response.data[0]
    usuarios = Usuario(**data) 
    return usuarios    

def avaliar_perfil(user_id,contratacao_id,nota,comentario):
    global supabase_client
    user_response = supabase_client.table("profiles").select("*").eq("id",user_id).execute()
    user_data = user_response.data[0]
    usuario = Usuario(**user_data)
    usuario.avaliacao = (usuario.avaliacao + nota)/2

    supabase_client.table("profiles").update({"avaliacao": usuario.avaliacao}).eq("id",usuario.id).execute()

    response = supabase_client.table("avaliacoes").insert({
        "contratacao_id":contratacao_id,
        "nota":nota,
        "comentario":comentario
    }).execute()
    return True
