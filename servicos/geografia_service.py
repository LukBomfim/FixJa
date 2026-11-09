from base64 import b64encode
from math import isfinite

from algoritmos.grafo_geografico import (
    construir_grafo,
    coordenadas_validas,
    dijkstra,
    reconstruir_caminho,
)
from algoritmos.ordenacao import quick_sort
from auth.middleware import get_request_supabase_client
from servicos.visualizacao_service import gerar_grafico_geografico

LIMITE_PRESTADORES_GEO = 200


def buscar_prestadores_com_coordenadas(cidade=None, estado=None):
    query = (
        get_request_supabase_client()
        .table("profiles")
        .select("id, username, tipo, categoria, cidade, estado, avaliacao, latitude, longitude")
        .eq("tipo", "PRESTADOR")
        .limit(LIMITE_PRESTADORES_GEO)
    )
    if cidade:
        query = query.ilike("cidade", f"%{cidade}%")
    if estado:
        query = query.eq("estado", estado)
    response = query.execute()
    return [
        perfil for perfil in response.data
        if isinstance(perfil, dict)
        and coordenadas_validas(perfil.get("latitude"), perfil.get("longitude"))
    ]


def recomendar_prestadores(latitude, longitude, cidade=None, estado=None):
    if not coordenadas_validas(latitude, longitude):
        raise ValueError("latitude e longitude devem conter coordenadas válidas.")

    prestadores = buscar_prestadores_com_coordenadas(cidade, estado)
    origem = {
        "id": "__origem__",
        "latitude": float(latitude),
        "longitude": float(longitude),
    }
    vertices = [origem, *prestadores]
    grafo = construir_grafo(vertices, vizinhos=3)
    distancias, anteriores = dijkstra(grafo, origem["id"])
    recomendacoes = []

    for perfil in prestadores:
        destino = str(perfil["id"])
        distancia = distancias[destino]
        if not isfinite(distancia):
            continue
        recomendacoes.append({
            "prestador": {
                "id": destino,
                "username": perfil.get("username") or "",
                "categoria": perfil.get("categoria"),
                "cidade": perfil.get("cidade") or "",
                "estado": perfil.get("estado"),
                "avaliacao": perfil.get("avaliacao") or 0,
            },
            "distancia_km": distancia,
            "caminho": reconstruir_caminho(anteriores, destino),
        })

    recomendacoes, _ = quick_sort(
        recomendacoes,
        key=lambda item: (item["distancia_km"], item["prestador"]["id"]),
    )
    caminho_destaque = recomendacoes[0]["caminho"] if recomendacoes else []
    imagem = gerar_grafico_geografico(vertices, grafo, caminho_destaque)
    return {
        "prestadores": [
            {
                "prestador": item["prestador"],
                "distancia_km": round(item["distancia_km"], 2),
            }
            for item in recomendacoes
        ],
        "grafo_png_base64": b64encode(imagem).decode("ascii"),
        "quantidade_vertices": len(vertices),
        "quantidade_arestas": sum(len(arestas) for arestas in grafo.values()) // 2,
    }
