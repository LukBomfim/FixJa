from io import BytesIO


def gerar_grafico_geografico(vertices, grafo, caminho=None) -> bytes:
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    caminho = caminho or []
    fig, axis = plt.subplots(figsize=(8, 5), constrained_layout=True)
    pontos_por_id = {str(ponto["id"]): ponto for ponto in vertices}
    for origem, conexoes in grafo.items():
        ponto_origem = pontos_por_id[origem]
        for destino, peso in conexoes.items():
            if origem >= destino:
                continue
            ponto_destino = pontos_por_id[destino]
            axis.plot(
                [ponto_origem["longitude"], ponto_destino["longitude"]],
                [ponto_origem["latitude"], ponto_destino["latitude"]],
                color="#94a3b8",
                linewidth=0.8,
                alpha=0.65,
            )
            axis.annotate(
                f"{peso:.1f} km",
                ((ponto_origem["longitude"] + ponto_destino["longitude"]) / 2,
                 (ponto_origem["latitude"] + ponto_destino["latitude"]) / 2),
                fontsize=6,
                color="#475569",
            )

    if caminho:
        pontos_por_id = {str(ponto["id"]): ponto for ponto in vertices}
        rota = [pontos_por_id[vertice] for vertice in caminho if vertice in pontos_por_id]
        if len(rota) > 1:
            axis.plot(
                [ponto["longitude"] for ponto in rota],
                [ponto["latitude"] for ponto in rota],
                color="#dc2626",
                linewidth=2.2,
                label="Menor caminho calculado",
                zorder=3,
            )

    origem = vertices[0]
    prestadores = vertices[1:]
    if prestadores:
        axis.scatter(
            [ponto["longitude"] for ponto in prestadores],
            [ponto["latitude"] for ponto in prestadores],
            color="#2563eb",
            label="Prestadores cadastrados",
            zorder=4,
        )
    axis.scatter(
        [origem["longitude"]],
        [origem["latitude"]],
        color="#dc2626",
        marker="*",
        s=150,
        label="Localização de busca",
        zorder=5,
    )
    axis.set_xlabel("Longitude")
    axis.set_ylabel("Latitude")
    axis.set_title("Grafo geográfico de prestadores — arestas ponderadas por distância")
    axis.grid(alpha=0.2)
    axis.legend(loc="best")
    output = BytesIO()
    fig.savefig(output, format="png", dpi=140)
    plt.close(fig)
    return output.getvalue()


def gerar_grafico_benchmark(cenarios) -> bytes:
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    fig, axis = plt.subplots(figsize=(8, 5), constrained_layout=True)
    nomes = ["Bubble Sort", "Insertion Sort", "Selection Sort", "QuickSort"]
    cores = ["#dc2626", "#2563eb", "#f59e0b", "#16a34a"]
    for nome, cor in zip(nomes, cores):
        tamanhos = []
        tempos = []
        for cenario in cenarios:
            medida = next(
                resultado for resultado in cenario["resultados"]
                if resultado["algoritmo"] == nome
            )
            tamanhos.append(cenario["quantidade"])
            tempos.append(medida["tempo_ms"])
        if tamanhos:
            axis.plot(tamanhos, tempos, marker="o", label=nome, color=cor)
    axis.set_xlabel("Quantidade de prestadores reais utilizados")
    axis.set_ylabel("Tempo medido (ms)")
    axis.set_title("Benchmark dos algoritmos de ordenação")
    axis.grid(alpha=0.25)
    axis.legend(loc="best")
    output = BytesIO()
    fig.savefig(output, format="png", dpi=140)
    plt.close(fig)
    return output.getvalue()
