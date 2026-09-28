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


def registrar_usuario(email:str,senha:str,username:str) -> tuple[Usuario, str | None] | None:
    """
    Registra um usuario no banco de dados caso não exista, se existir exibi um erro e retorna None
    """

    usuario = Usuario()

    usuario.email = email
    usuario.senha = senha
    usuario.username = username

    global supabase_client
    try:
        auth_client = create_client(SUPABASE_URL, SUPABASE_KEY) # type: ignore
        response:AuthResponse = auth_client.auth.sign_up(
            {
                "email": usuario.email,
                "password":usuario.senha
            }
        )
        if not response.user:
            return None
        usuario.id = response.user.id
        usuario.senha = ""
        return usuario, response.session.access_token if response.session else None
    except AuthApiError as e:
        print(f"ERRO: não Foi possivel cadastrar o usuario no banco de dados:{e}")      
    except Exception as e:
        print(f"ERRO: não foi possível cadastrar o usuário: {e}")
    return None

def logar_usuario(email: str, senha: str) -> tuple[dict | None, str] | None:
    """
    Retorna (usuario, access_token) se as credenciais forem válidas, None caso contrário.
    """
    try:
        auth_client = create_client(SUPABASE_URL, SUPABASE_KEY) # type: ignore
        response = auth_client.auth.sign_in_with_password(
            {"email": email, "password": senha}
        )
    except AuthApiError:
        return None

    if not response.user or not response.session:
        return None

    payload = (
        supabase_client.table("profiles")
        .select("*")
        .eq("id", response.user.id)
        .execute()
    )
    registro = payload.data[0] if payload.data else None
    usuario = registro if isinstance(registro, dict) else None
    if usuario:
        usuario.pop("senha", None)
    return usuario, response.session.access_token
