from dataclasses import dataclass
from datetime import date, datetime
from typing import Any

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
    def __init__(self,id,client_id,prestador_id,created_at,data,data_solicitada,descricao,status) -> None:
        self.id:str|None=id
        self.client_id:str=client_id
        self.prestador_id:str=prestador_id
        self.created_at:date|None=created_at
        self.data_solicitada:datetime=datetime.fromisoformat(data_solicitada)
        self.data:date|None=self.data_solicitada.date()
        self.descricao:str=descricao
        self.status:str=status
class Categoria:
    def __init__(self,id,categoria_name) -> None:
        self.id = id
        self.categoria_name = categoria_name
                