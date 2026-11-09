class Fila:
    """Fila FIFO: o primeiro elemento inserido é o primeiro a sair."""

    def __init__(self):
        self._itens = []
        self._inicio = 0

    def entrar(self, item):
        self._itens.append(item)

    def chamar_proximo(self):
        if self.esta_vazia():
            return None

        item = self._itens[self._inicio]
        self._inicio += 1

        # Libera espaço quando a fila já consumiu boa parte do vetor interno.
        if self._inicio > 20 and self._inicio * 2 >= len(self._itens):
            self._itens = self._itens[self._inicio:]
            self._inicio = 0

        return item

    def frente(self):
        if self.esta_vazia():
            return None
        return self._itens[self._inicio]

    def tamanho(self):
        return len(self._itens) - self._inicio

    def esta_vazia(self):
        return self.tamanho() == 0

    def como_lista(self):
        return self._itens[self._inicio:]
