from base64 import b64encode
from time import perf_counter_ns

from algoritmos.ordenacao import bubble_sort, insertion_sort, quick_sort, selection_sort
from servicos.visualizacao_service import gerar_grafico_benchmark

ALGORITMOS = {
    "Bubble Sort": bubble_sort,
    "Insertion Sort": insertion_sort,
    "Selection Sort": selection_sort,
    "QuickSort": quick_sort,
}


def comparar_ordenacoes(prestadores):
    registros = [
        {
            "id": str(perfil["id"]),
            "nome": str(perfil.get("username") or ""),
            "avaliacao": float(perfil.get("avaliacao") or 0),
        }
        for perfil in prestadores
        if perfil.get("id")
    ]
    quantidade = len(registros)
    tamanhos = sorted({size for size in (quantidade // 4, quantidade // 2, quantidade) if size > 0})
    cenarios = []

    for tamanho in tamanhos:
        entrada = registros[:tamanho]
        chave = lambda prestador: (-prestador["avaliacao"], prestador["id"])
        referencia = None
        resultados = []
        for nome, algoritmo in ALGORITMOS.items():
            copia = list(entrada)
            inicio = perf_counter_ns()
            ordenados, metricas = algoritmo(copia, key=chave)
            tempo_ms = (perf_counter_ns() - inicio) / 1_000_000
            ids_ordenados = [prestador["id"] for prestador in ordenados]
            if referencia is None:
                referencia = ids_ordenados
            elif ids_ordenados != referencia:
                raise RuntimeError(f"{nome} produziu uma ordenação divergente.")
            resultados.append({
                "algoritmo": nome,
                "tempo_ms": round(tempo_ms, 6),
                "comparacoes": metricas.comparisons,
                "trocas": metricas.swaps,
                "movimentacoes": metricas.moves,
            })
        melhor = min(resultados, key=lambda resultado: resultado["tempo_ms"])["algoritmo"]
        cenarios.append({"quantidade": tamanho, "resultados": resultados, "mais_rapido": melhor})

    imagem = gerar_grafico_benchmark(cenarios) if cenarios else b""
    return {
        "criterio": "avaliação decrescente; id crescente para desempate",
        "registros_disponiveis": quantidade,
        "cenarios": cenarios,
        "grafico_png_base64": b64encode(imagem).decode("ascii"),
    }
