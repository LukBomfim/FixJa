from estruturas import GerenciadorSolicitacoes


def exibir_solicitacao(solicitacao):
    return f"#{solicitacao.id} - {solicitacao.cliente} - {solicitacao.servico}"


def main():
    print("=" * 62)
    print("FIXJÁ - DEMONSTRAÇÃO DAS ESTRUTURAS DE DADOS")
    print("=" * 62)

    gerenciador = GerenciadorSolicitacoes()

    # 1. FILA: solicitações entram na ordem em que chegam.
    print("\n[1] FILA - solicitações aguardando atendimento")
    gerenciador.criar_solicitacao("Maria", "Instalar suporte de TV", "João")
    gerenciador.criar_solicitacao("Carlos", "Montar guarda-roupa", "Ana")
    gerenciador.criar_solicitacao("Beatriz", "Configurar computador", "Pedro")

    for solicitacao in gerenciador.fila_atual():
        print("  ", exibir_solicitacao(solicitacao))

    proxima = gerenciador.chamar_proximo()
    print("\nPróximo chamado (FIFO):", exibir_solicitacao(proxima))

    # 2. PILHA: histórico de status.
    print("\n[2] PILHA - histórico de status")
    gerenciador.atualizar_status("ACEITO")
    gerenciador.atualizar_status("EM_ANDAMENTO")
    gerenciador.atualizar_status("CONCLUIDO")
    print("  Status do mais antigo ao mais recente:")
    print("  ", " -> ".join(gerenciador.status_atual()))
    print("  Topo da pilha:", gerenciador.historico_status.topo())

    # 3. LISTA ENCADEADA: histórico de serviços concluídos.
    print("\n[3] LISTA ENCADEADA - histórico de serviços")
    for servico in gerenciador.historico_atual():
        print("  ", exibir_solicitacao(servico))

    # 4. VETOR: avaliações do prestador.
    print("\n[4] VETOR - avaliações do prestador")
    for nota in (5, 4, 5, 5):
        gerenciador.adicionar_avaliacao(nota)
    print("  Notas:", gerenciador.avaliacoes.como_lista())
    print(f"  Média: {gerenciador.media_avaliacoes():.2f}")

    # Demonstração adicional da pilha: desfazer o último status.
    print("\n[EXTRA] PILHA - desfazer último status")
    gerenciador.solicitacao_atual = proxima
    gerenciador.atualizar_status("EM_ANDAMENTO")
    gerenciador.atualizar_status("ACEITO")
    status_anterior = gerenciador.desfazer_ultimo_status()
    print("  Após desfazer:", status_anterior)

    print("\n" + "=" * 62)
    print("DEMONSTRAÇÃO CONCLUÍDA COM SUCESSO")
    print("=" * 62)


if __name__ == "__main__":
    main()
