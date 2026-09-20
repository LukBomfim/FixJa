from dataclasses import dataclass
from datetime import date

@dataclass
class Usuario:
    id:str
    username:str
    senha:str
    email:str
    telefone:str
    data_nascimento:date
    tipo:str
    categoria:str
    cidade:str
    descricao:str
    avaliacao:float
