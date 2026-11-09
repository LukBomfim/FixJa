from dataclasses import dataclass

from .fila import Fila
from .lista_encadeada import ListaEncadeada
from .pilha import Pilha
from .vetor import Vetor


@dataclass
class SolicitacaoServico:
    """Representa uma solicitação feita por um cliente no FixJá."""

    id: int
    cliente: str
    servico: str
    prestador: str | None = None
    status: str = "PENDENTE"


class GerenciadorSolicitacoes:
    """Integra as quatro estruturas de dados a um fluxo do FixJá.

    Fila -> solicitações aguardando atendimento.
    Lista encadeada -> histórico de serviços finalizados.
    Pilha -> histórico de status da solicitação atual.
    Vetor -> avaliações recebidas pelo prestador.
    """

    def __init__(self):
        self.fila_solicitacoes = Fila()
        self.historico_servicos = ListaEncadeada()
        self.historico_status = Pilha()
        self.avaliacoes = Vetor()
        self._proximo_id = 1
        self.solicitacao_atual = None

    def criar_solicitacao(self, cliente, servico, prestador=None):
        solicitacao = SolicitacaoServico(
            id=self._proximo_id,
            cliente=cliente,
            servico=servico,
            prestador=prestador,
        )
        self._proximo_id += 1

        self.fila_solicitacoes.entrar(solicitacao)
        return solicitacao

    def chamar_proximo(self):
        solicitacao = self.fila_solicitacoes.chamar_proximo()
        if solicitacao is None:
            return None

        self.solicitacao_atual = solicitacao
        self.historico_status = Pilha()
        self._registrar_status("PENDENTE")
        return solicitacao

    def atualizar_status(self, status):
        if self.solicitacao_atual is None:
            raise ValueError("Nenhuma solicitação está em atendimento.")

        status = status.upper()
        self.solicitacao_atual.status = status
        self._registrar_status(status)

        if status == "CONCLUIDO":
            self.historico_servicos.adicionar(self.solicitacao_atual)

    def _registrar_status(self, status):
        self.historico_status.empilhar(status)

    def desfazer_ultimo_status(self):
        """Remove o último status e volta para o status anterior."""
        if self.historico_status.tamanho() <= 1:
            return self.historico_status.topo()

        self.historico_status.desempilhar()
        status_anterior = self.historico_status.topo()
        self.solicitacao_atual.status = status_anterior
        return status_anterior

    def finalizar_atendimento(self):
        if self.solicitacao_atual is None:
            return None

        finalizada = self.solicitacao_atual
        if finalizada.status != "CONCLUIDO":
            self.atualizar_status("CONCLUIDO")
        self.solicitacao_atual = None
        return finalizada

    def adicionar_avaliacao(self, nota):
        if not isinstance(nota, (int, float)) or not 0 <= nota <= 5:
            raise ValueError("A avaliação deve estar entre 0 e 5.")
        self.avaliacoes.adicionar(float(nota))

    def media_avaliacoes(self):
        return self.avaliacoes.media()

    def fila_atual(self):
        return self.fila_solicitacoes.como_lista()

    def historico_atual(self):
        return self.historico_servicos.como_lista()

    def status_atual(self):
        return self.historico_status.como_lista()
