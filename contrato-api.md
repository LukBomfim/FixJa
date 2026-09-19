# Contrato da API — Site de Contratação de Prestadores de Serviço

Este documento define os endpoints da API: o que cada um recebe, o que devolve, e quem é responsável por cada parte no código. Serve como "acordo" entre a API (Lucas), o Backend (Handrey) e o JS (Mizael).

---

## 1. Autenticação

Login e cadastro **não são endpoints da nossa API** — o Mizael usa o SDK do Supabase direto no frontend para criar conta e logar (`supabase.auth.signUp`, `supabase.auth.signInWithPassword`). O Supabase cuida de senha, criptografia e geração do token, então a gente não reimplementa nada disso.

**O que muda pra nossa API:**
- Toda rota protegida (marcada como 🔒 abaixo) espera um header:
  ```
  Authorization: Bearer <token_do_supabase>
  ```
- Nossa API valida esse token com a biblioteca do Supabase (não guarda sessão em lugar nenhum — combina bem com a Vercel, que é serverless).
- Se o token não vier ou for inválido → `401`.
- Se o token for válido mas o usuário não for "dono" do recurso que ele tá tentando mexer → `403`.

**Função auxiliar do Handrey/Lucas (usada em toda rota protegida):**
`obter_usuario_do_token(token)` → devolve os dados do usuário logado (id, email) ou `None` se inválido.

> Ainda pode existir uma tabela própria de "perfis" (nome, tipo: cliente/prestador, categoria, etc), separada da autenticação do Supabase — combinar com o Handrey se isso vai ser criado automaticamente no primeiro login ou por um endpoint tipo `POST /perfil`.

---

## 2. Prestadores

### `GET /prestadores`
Lista prestadores, com filtro opcional por categoria e cidade.

**Recebe (query params):** `?categoria=encanador&cidade=São Paulo`

**Devolve:**
```json
[
  {
    "id": 1,
    "nome": "João Silva",
    "categoria": "encanador",
    "cidade": "São Paulo",
    "nota_media": 4.5
  }
]
```

**Função do Handrey:** `buscar_prestadores(categoria=None, cidade=None)`

---

### `GET /prestadores/{id}`
Detalhes de um prestador específico.

**Devolve:**
```json
{
  "id": 1,
  "nome": "João Silva",
  "categoria": "encanador",
  "cidade": "São Paulo",
  "descricao": "Encanador com 10 anos de experiência",
  "nota_media": 4.5,
  "telefone": "11999999999"
}
```

**Função do Handrey:** `buscar_prestador_por_id(id)`

---

### 🔒 `PUT /prestadores/{id}`
Prestador edita o próprio perfil.
**Autorização:** só o usuário autenticado cujo id bate com `{id}` pode editar. Senão → `403`.

**Recebe:**
```json
{
  "descricao": "Novo texto de descrição",
  "telefone": "11988888888"
}
```

**Devolve:** o objeto do prestador atualizado (mesmo formato do `GET /prestadores/{id}`)

**Função do Handrey:** `atualizar_prestador(id, dados)`

---

## 3. Categorias

### `GET /categorias`
Lista os tipos de serviço disponíveis.

**Devolve:**
```json
[
  { "id": 1, "nome": "encanador" },
  { "id": 2, "nome": "eletricista" },
  { "id": 3, "nome": "pintor" }
]
```

**Função do Handrey:** `listar_categorias()`

---

## 4. Contratações

### 🔒 `POST /contratacoes`
Cliente solicita um serviço a um prestador.
**Autorização:** requer login. `cliente_id` deve ser o id do usuário autenticado (não confiar em `cliente_id` vindo do corpo — pegar do token).

**Recebe:**
```json
{
  "cliente_id": 5,
  "prestador_id": 1,
  "descricao": "Vazamento na cozinha",
  "data_solicitada": "2026-09-20"
}
```

**Devolve:**
```json
{
  "id": 10,
  "cliente_id": 5,
  "prestador_id": 1,
  "descricao": "Vazamento na cozinha",
  "data_solicitada": "2026-09-20",
  "status": "pendente"
}
```

**Função do Handrey:** `criar_contratacao(cliente_id, prestador_id, descricao, data_solicitada)`

---

### `GET /contratacoes/{id}`
Detalhes de uma contratação.

**Devolve:** mesmo formato acima.

**Função do Handrey:** `buscar_contratacao(id)`

---

### 🔒 `PUT /contratacoes/{id}`
Atualiza o status (aceito, concluído, cancelado).
**Autorização:** só o cliente ou o prestador envolvidos nessa contratação podem alterar o status. Senão → `403`.

**Recebe:**
```json
{ "status": "aceito" }
```
- Valores possíveis: `"pendente"`, `"aceito"`, `"concluido"`, `"cancelado"`

**Devolve:** o objeto da contratação atualizado.

**Função do Handrey:** `atualizar_status_contratacao(id, status)`

---

## 5. Avaliações

### 🔒 `POST /contratacoes/{id}/avaliacoes`
Cliente avalia o prestador após o serviço. O `id` da contratação vai na própria URL, já que a avaliação sempre pertence a uma contratação específica.
**Autorização:** só o cliente da contratação `{id}` pode avaliar, e só se o status for `"concluido"`.

**Recebe:**
```json
{
  "nota": 5,
  "comentario": "Ótimo serviço, rápido e educado"
}
```

**Devolve:**
```json
{
  "id": 3,
  "contratacao_id": 10,
  "nota": 5,
  "comentario": "Ótimo serviço, rápido e educado",
  "data": "2026-09-16"
}
```

**Função do Handrey:** `criar_avaliacao(contratacao_id, nota, comentario)`

---

### `GET /prestadores/{id}/avaliacoes`
Lista as avaliações recebidas por um prestador.

**Devolve:**
```json
[
  {
    "id": 3,
    "nota": 5,
    "comentario": "Ótimo serviço, rápido e educado",
    "data": "2026-09-16"
  }
]
```

**Função do Handrey:** `listar_avaliacoes_prestador(prestador_id)`

---

## Como usar este documento

- **Com o Handrey:** confirmar se os nomes das funções e os parâmetros batem com o que ele vai implementar no backend.
- **Com o Mizael:** confirmar se os formatos de JSON (campos, nomes, tipos) são o que o JS espera receber e enviar.
- **Códigos de status HTTP sugeridos:**
  - `200` — sucesso (GET, PUT)
  - `201` — criado com sucesso (POST)
  - `400` — dados inválidos (ex: campo obrigatório faltando)
  - `401` — não autenticado (token do Supabase ausente ou inválido)
  - `403` — autenticado, mas sem permissão para essa ação (ex: tentar editar perfil de outro usuário)
  - `404` — não encontrado (ex: prestador com id inexistente)
- **Rotas marcadas com 🔒** exigem o header `Authorization: Bearer <token>` e checagem de dono do recurso — ver seção 1 (Autenticação).
