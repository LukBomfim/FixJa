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


def registrar_usuario(email:str,senha:str,username:str,data_nascimento:date,telefone:str,tipo:str,categoria:str|None,cidade:str,descricao:str|None,avaliacao:float) -> AuthResponse | None:
    """
    Registra um usuario no banco de dados caso não exista, se existir exibi um erro e retorna None
    """

    usuario = Usuario()

    usuario.email = email
    usuario.senha = senha
    usuario.username = username
    usuario.data_nascimento = data_nascimento
    usuario.telefone = telefone
    usuario.tipo = tipo 
    usuario.categoria = categoria
    usuario.cidade = cidade
    usuario.descricao = descricao
    usuario.avaliacao = avaliacao

    global supabase_client
    try:
        response:AuthResponse | None = supabase_client.auth.sign_up(
            {
                "email": usuario.email,
                "password":usuario.senha
            }
        )
        supabase_client.table("profiles").insert({
                "id":response.user.id, # type: ignore
                "email":usuario.email,
                "data_nascimento":usuario.data_nascimento.isoformat(),
                "username":usuario.username,
                "telefone":usuario.telefone,
                "tipo":usuario.tipo,
                "categoria":categoria,
                "cidade":cidade,
                "descricao":descricao,
                "avaliacao":avaliacao

            }).execute()
    except AuthApiError as e:
        print("ERRO: não Foi possivel cadastrar o usuario no banco de dados")
    finally:
        response = None    
    return response

def logar_usuario(email:str,senha:str) -> Usuario | None:
    """
    Retorna uma Auth response se existir usuario e None caso não exista
    """
    global supabase_client
    response:AuthResponse = supabase_client.auth.sign_in_with_password(
        {
            "email":email,
            "password":senha
        })
    payload = supabase_client.table("profiles").select("*").eq("id",response.user.id).execute() # type: ignore
    payload = payload.data[0]
    usuario = Usuario(**payload,senha=None) # type: ignore
    if not response.user:
        return None
    return usuario
