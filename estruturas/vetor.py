class Vetor:
    """Vetor dinâmico simples para armazenar valores em posições indexadas."""

    def __init__(self, capacidade_inicial=4):
        if capacidade_inicial < 1:
            raise ValueError("A capacidade inicial deve ser maior que zero.")
        self._capacidade = capacidade_inicial
        self._dados = [None] * capacidade_inicial
        self._tamanho = 0

    def adicionar(self, valor):
        if self._tamanho == self._capacidade:
            self._redimensionar(self._capacidade * 2)
        self._dados[self._tamanho] = valor
        self._tamanho += 1

    def acessar(self, indice):
        self._validar_indice(indice)
        return self._dados[indice]

    def atualizar(self, indice, valor):
        self._validar_indice(indice)
        self._dados[indice] = valor

    def remover(self, indice):
        self._validar_indice(indice)
        valor = self._dados[indice]

        for i in range(indice, self._tamanho - 1):
            self._dados[i] = self._dados[i + 1]

        self._dados[self._tamanho - 1] = None
        self._tamanho -= 1
        return valor

    def tamanho(self):
        return self._tamanho

    def esta_vazio(self):
        return self._tamanho == 0

    def como_lista(self):
        return self._dados[:self._tamanho]

    def media(self):
        if self.esta_vazio():
            return 0.0
        return sum(self.como_lista()) / self._tamanho

    def _redimensionar(self, nova_capacidade):
        novo_dados = [None] * nova_capacidade
        for i in range(self._tamanho):
            novo_dados[i] = self._dados[i]
        self._dados = novo_dados
        self._capacidade = nova_capacidade

    def _validar_indice(self, indice):
        if not isinstance(indice, int) or indice < 0 or indice >= self._tamanho:
            raise IndexError("Índice fora dos limites do vetor.")
