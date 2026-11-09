class No:
    """Nó de uma lista encadeada."""

    def __init__(self, dado):
        self.dado = dado
        self.proximo = None


class ListaEncadeada:
    """Lista encadeada simples com inserção no final e busca por predicado."""

    def __init__(self):
        self.inicio = None
        self._tamanho = 0

    def adicionar(self, dado):
        novo = No(dado)

        if self.inicio is None:
            self.inicio = novo
        else:
            atual = self.inicio
            while atual.proximo is not None:
                atual = atual.proximo
            atual.proximo = novo

        self._tamanho += 1

    def buscar(self, criterio):
        atual = self.inicio
        while atual is not None:
            if criterio(atual.dado):
                return atual.dado
            atual = atual.proximo
        return None

    def remover_primeiro(self):
        if self.inicio is None:
            return None

        dado = self.inicio.dado
        self.inicio = self.inicio.proximo
        self._tamanho -= 1
        return dado

    def tamanho(self):
        return self._tamanho

    def esta_vazia(self):
        return self.inicio is None

    def como_lista(self):
        resultado = []
        atual = self.inicio
        while atual is not None:
            resultado.append(atual.dado)
            atual = atual.proximo
        return resultado
