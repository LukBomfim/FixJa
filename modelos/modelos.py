from dataclasses import dataclass
from datetime import date

@dataclass
class Usuario:
    id:str|None=None
    username:str=""
    senha:str=""
    email:str=""
    telefone:str=""
    data_nascimento:date=date(1990,1,1)
    tipo:str=""
    categoria:str|None=""
    cidade:str=""
    descricao:str|None=""
    avaliacao:float=0.0

@dataclass
class Contratacao:
    id:str|None=None
    client_id:str=""
    prestador_id:str=""
    created_at:date|None=None
    data_solicitada:str|None=None
    descricao:str=""
    status:str=""