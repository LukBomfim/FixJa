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


def registrar_usuario(usuario:Usuario) -> AuthResponse | None:
    """
    Registra um usuario no banco de dados caso não exista, se existir exibi um erro e retorna None
    """
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
                "telefone":usuario.telefone
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
    payload = supabase_client.table("profiles").select("*").eq("id",response.user.id).execute()
    payload = payload.data[0]
    usuario = Usuario(**payload,senha=None)
    if not response.user:
        return None
    return usuario

usuario = logar_usuario("handreygama.profissional@gmail.com","batata123")