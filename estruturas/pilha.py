class Pilha:
    """Pilha LIFO: o último elemento inserido é o primeiro a sair."""

    def __init__(self):
        self._itens = []

    def empilhar(self, item):
        self._itens.append(item)

    def desempilhar(self):
        if self.esta_vazia():
            return None
        return self._itens.pop()

    def topo(self):
        if self.esta_vazia():
            return None
        return self._itens[-1]

    def tamanho(self):
        return len(self._itens)

    def esta_vazia(self):
        return len(self._itens) == 0

    def como_lista(self):
        return self._itens.copy()
