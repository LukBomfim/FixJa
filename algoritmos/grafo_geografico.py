from heapq import heappop, heappush, nsmallest
from math import asin, cos, isfinite, radians, sin, sqrt
from typing import Any, Iterable


def distancia_haversine(latitude_a: float, longitude_a: float, latitude_b: float, longitude_b: float) -> float:
    """Calcula a distância geodésica aproximada em quilômetros."""
    lat_a, lon_a, lat_b, lon_b = map(
        radians, (latitude_a, longitude_a, latitude_b, longitude_b)
    )
    delta_lat = lat_b - lat_a
    delta_lon = lon_b - lon_a
    haversine = sin(delta_lat / 2) ** 2 + cos(lat_a) * cos(lat_b) * sin(delta_lon / 2) ** 2
    return 6371.0088 * 2 * asin(sqrt(min(1.0, haversine)))


def coordenadas_validas(latitude: Any, longitude: Any) -> bool:
    if isinstance(latitude, bool) or isinstance(longitude, bool):
        return False
    if not isinstance(latitude, (int, float)) or not isinstance(longitude, (int, float)):
        return False
    return (
        isfinite(latitude)
        and isfinite(longitude)
        and -90 <= latitude <= 90
        and -180 <= longitude <= 180
    )


def construir_grafo(vertices: Iterable[dict[str, Any]], vizinhos: int = 3) -> dict[str, dict[str, float]]:
    """Cria um grafo espacial k-vizinhos e o conecta com uma árvore geradora mínima."""
    pontos = list(vertices)
    grafo = {str(ponto["id"]): {} for ponto in pontos}
    if len(pontos) < 2:
        return grafo

    arestas: list[tuple[float, str, str]] = []
    for index, ponto in enumerate(pontos):
        for outro in pontos[index + 1 :]:
            distancia = distancia_haversine(
                float(ponto["latitude"]),
                float(ponto["longitude"]),
                float(outro["latitude"]),
                float(outro["longitude"]),
            )
            arestas.append((distancia, str(ponto["id"]), str(outro["id"])))

    def conectar(a: str, b: str, peso: float) -> None:
        grafo[a][b] = peso
        grafo[b][a] = peso

    por_vertice: dict[str, list[tuple[float, str]]] = {node: [] for node in grafo}
    for peso, a, b in arestas:
        por_vertice[a].append((peso, b))
        por_vertice[b].append((peso, a))

    for node, candidatos in por_vertice.items():
        for peso, vizinho in nsmallest(max(1, vizinhos), candidatos):
            conectar(node, vizinho, peso)

    componentes: dict[str, str] = {node: node for node in grafo}

    def raiz(node: str) -> str:
        while componentes[node] != node:
            componentes[node] = componentes[componentes[node]]
            node = componentes[node]
        return node

    for peso, a, b in sorted(arestas):
        raiz_a, raiz_b = raiz(a), raiz(b)
        if raiz_a != raiz_b:
            componentes[raiz_a] = raiz_b
            conectar(a, b, peso)

    return grafo


def dijkstra(grafo: dict[str, dict[str, float]], origem: str) -> tuple[dict[str, float], dict[str, str | None]]:
    if origem not in grafo:
        raise ValueError("O vértice de origem não pertence ao grafo.")

    distancias = {vertice: float("inf") for vertice in grafo}
    anteriores: dict[str, str | None] = {vertice: None for vertice in grafo}
    distancias[origem] = 0.0
    fila: list[tuple[float, str]] = [(0.0, origem)]

    while fila:
        distancia_atual, vertice = heappop(fila)
        if distancia_atual != distancias[vertice]:
            continue
        for vizinho, peso in grafo[vertice].items():
            alternativa = distancia_atual + peso
            if alternativa < distancias[vizinho]:
                distancias[vizinho] = alternativa
                anteriores[vizinho] = vertice
                heappush(fila, (alternativa, vizinho))

    return distancias, anteriores


def reconstruir_caminho(anteriores: dict[str, str | None], destino: str) -> list[str]:
    caminho: list[str] = []
    atual: str | None = destino
    while atual is not None:
        caminho.append(atual)
        atual = anteriores.get(atual)
    caminho.reverse()
    return caminho
