# Estruturas de Dados e Algoritmos — segunda unidade

## Conformidade

| Requisito | Implementação | Localização | Estado |
|---|---|---|---|
| Hash de senha | Supabase Auth recebe a senha no cadastro/login e mantém o hash/verificação fora de `profiles` | `servicos/auth_service.py` | Implementado; usa o provedor de autenticação |
| Grafo geográfico e Dijkstra | Grafo k-vizinhos ponderado por Haversine, conectado por árvore geradora mínima, com caminho mínimo | `algoritmos/grafo_geografico.py`, `servicos/geografia_service.py` | Implementado |
| Matplotlib geográfico | Desenha vértices reais, arestas com pesos e o menor caminho calculado | `servicos/visualizacao_service.py` | Implementado |
| Bubble Sort | Ordena registros reais de prestadores para o benchmark | `algoritmos/ordenacao.py` | Implementado |
| Insertion Sort | Ordena registros reais de prestadores para o benchmark | `algoritmos/ordenacao.py` | Implementado |
| Selection Sort | Ordena registros reais de prestadores para o benchmark | `algoritmos/ordenacao.py` | Implementado |
| QuickSort | Ordena registros reais de prestadores e recomendações por distância | `algoritmos/ordenacao.py`, `servicos/geografia_service.py` | Implementado |
| Benchmark Matplotlib | Mede tempo, comparações, trocas e movimentações usando subconjuntos idênticos dos dados persistidos | `servicos/benchmark_service.py` | Implementado |
| Lista ligada | Reconcilia e percorre solicitações reais recebidas pela API | `frontend/src/dataStructures.ts`, `frontend/src/pages/dashboardPrestador/PainelPrestador.tsx` | Implementado |
| Pilha LIFO | Registra mudanças de status confirmadas pela API; o pop remove apenas o item da visualização local | `frontend/src/dataStructures.ts`, `frontend/src/pages/dashboardPrestador/PainelPrestador.tsx` | Implementado |

## Hash e autenticação

Hash transforma uma senha em um resumo unidirecional; para senhas, deve ser lento e usar salt individual, para dificultar busca por força bruta e tabelas pré-computadas. O FixJá delega cadastro, armazenamento e verificação a **Supabase Auth**, que mantém hashes de senha com bcrypt e salt gerenciado pelo provedor. O backend não grava a senha em `profiles`: o cadastro envia a senha somente a `auth.sign_up`, o login usa `auth.sign_in_with_password`, e o objeto de usuário retornado tem o campo local `senha` limpo. O endpoint de perfil remove `senha` da resposta por defesa em profundidade.

Essa escolha evita implementar criptografia de senhas artesanalmente, mantém o fluxo de verificação integrado a tokens/sessões e deixa a política do algoritmo sob responsabilidade do serviço de autenticação. Para explicar a implementação, as operações são criação de conta, geração/armazenamento gerenciados do hash e verificação durante o login. O teste `test_auth_hash_integration.py` confere que a senha é encaminhada ao serviço de autenticação e nunca incluída no payload do perfil.

## Localização, grafo e recomendações

O perfil de prestador persiste UF, cidade, endereço/local, latitude e longitude. O formulário React consulta a lista pública de municípios do IBGE por UF; a localização pode ser capturada com consentimento do navegador ou informada manualmente. A pesquisa e o mapa são páginas/embeds do Google Maps, sem chave de API no frontend. A posição é ajustável pelos campos de coordenadas e o mapa acompanha o marcador; a busca usa o mapa externo e requer informar as coordenadas do ponto escolhido.

A migração `supabase/migrations/202611080001_provider_geolocation.sql` adiciona as colunas, valida o par/range das coordenadas e cria um índice parcial. **Aplique essa migração no banco Supabase antes de atualizar/cadastrar perfis ou usar os endpoints geográficos.** Campos novos são inicialmente nulos para preservar perfis existentes.

O backend considera o ponto informado pelo cliente e prestadores com coordenadas válidas. Cada vértice é um local; arestas não direcionadas têm peso em quilômetros calculado pela fórmula de Haversine. São adicionadas conexões com até três vizinhos geográficos e uma árvore geradora mínima para manter o grafo conectado. Dijkstra calcula distâncias/caminhos sobre essa topologia; QuickSort ordena as recomendações pela distância resultante. Como não existe uma base de ruas/rotas, os quilômetros são aproximações geográficas do grafo, não distâncias viárias nem tempo de viagem.

A imagem gerada com Matplotlib apresenta as localizações, as arestas com seus pesos e o caminho mínimo para o primeiro recomendado. Coordenadas privadas não são devolvidas na resposta de recomendação; o gráfico é produzido no backend a partir de dados reais. O cliente precisa autorizar a geolocalização ou escolher um ponto manualmente.

## Ordenação e benchmark

`algoritmos/ordenacao.py` implementa funções independentes e instrumentadas para Bubble Sort, Insertion Sort, Selection Sort e QuickSort. O benchmark ordena prestadores persistidos por avaliação decrescente e ID crescente (desempate), mede cada algoritmo em uma cópia idêntica de cada conjunto e verifica que as sequências resultantes são iguais. Os cenários são um quarto, metade e o total dos registros disponíveis, sem criar dados sintéticos; se o banco tiver poucos prestadores, haverá menos cenários. O gráfico representa os tempos medidos na requisição, portanto pequenas diferenças em conjuntos pequenos podem variar entre execuções.

O painel do prestador mostra quantidade, tempo, comparações, trocas, movimentações e o algoritmo mais rápido por cenário. O endpoint está restrito a prestadores autenticados, pois o projeto ainda não tem perfil administrativo.

## Lista e pilha do painel

O painel carrega contratos pela API. A lista ligada é criada a partir desses contratos, percorrida para compor filas/históricos e atualizada removendo/inserindo o registro retornado pelo backend após uma transição confirmada. A pilha LIFO recebe ações de status somente depois do sucesso da API. Como o esquema atual de contratações não guarda eventos de status, essa pilha é local à sessão; `pop` afeta apenas a visualização e não desfaz/persiste alterações no servidor.

## Endpoints

| Método | Endpoint | Acesso | Uso |
|---|---|---|---|
| `POST` | `/prestadores/proximos` | Cliente autenticado | Recomendações, distâncias e PNG do grafo |
| `GET` | `/analises/benchmark` | Prestador autenticado | Medições reais, estatísticas e PNG Matplotlib |

## Execução e validação

Dependências Python são instaladas com `pip install -r requirements.txt`; a interface usa dependências já declaradas no projeto. Configure `SUPABASE_URL`, `SUPABASE_KEY` e `CORS_ORIGINS` no backend e `VITE_API_BASE_URL` no frontend. Não é necessária chave do Google Maps nesta integração.

Validação automatizada:

- `python -m unittest discover -s tests -v`
- `npm run build` no diretório `frontend`

Resultado desta execução: 25 testes Python passaram; o build TypeScript/Vite foi concluído. `npm run lint` não pôde rodar porque o executável ESLint não está instalado nem declarado nas dependências do frontend.
