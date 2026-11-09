# Estruturas de Dados e Algoritmos — segunda unidade

## Conformidade

| Requisito | Implementação | Localização | Estado |
|---|---|---|---|
| Hash de senha | Supabase Auth recebe a senha no cadastro/login e mantém o hash/verificação fora de `profiles` | `servicos/auth_service.py` | Implementado; usa o provedor de autenticação |
| Grafo geográfico e Dijkstra | Grafo k-vizinhos ponderado por Haversine, conectado por árvore geradora mínima, com caminho mínimo | `algoritmos/grafo_geografico.py`, `servicos/geografia_service.py` | Implementado |
| Matplotlib geográfico | Desenha o grafo com vértices reais, arestas ponderadas e o caminho mínimo no Modo Desenvolvedor | `servicos/visualizacao_service.py` | Implementado |
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

O perfil de prestador persiste UF, cidade, endereço/local, latitude e longitude. O formulário consulta a lista pública de municípios do IBGE por UF; a localização pode ser capturada com consentimento do navegador ou informada manualmente. Um mapa Leaflet/OpenStreetMap permite ajustar a posição diretamente. A tela do cliente exibe os prestadores próximos em um mapa interativo.

A migração `supabase/migrations/202611080001_provider_geolocation.sql` adiciona as colunas, valida o par/range das coordenadas e cria um índice parcial. **Aplique essa migração no banco Supabase antes de atualizar/cadastrar perfis ou usar os endpoints geográficos.** Campos novos são inicialmente nulos para preservar perfis existentes. Ela solicita a recarga do schema do PostgREST ao final; se a API ainda reportar coluna ausente, execute `NOTIFY pgrst, 'reload schema';` no SQL Editor e tente novamente.

O backend considera o ponto informado pelo cliente e prestadores com coordenadas válidas. Cada vértice é um local; arestas não direcionadas têm peso em quilômetros calculado pela fórmula de Haversine. São adicionadas conexões com até três vizinhos geográficos e uma árvore geradora mínima para manter o grafo conectado. Dijkstra calcula distâncias/caminhos sobre essa topologia; QuickSort ordena as recomendações pela distância resultante. Como não existe uma base de ruas/rotas, os quilômetros são aproximações geográficas do grafo, não distâncias viárias nem tempo de viagem. Os perfis públicos não expõem coordenadas exatas; elas só são retornadas pelo endpoint autenticado de recomendações usado pelo cliente para posicionar os marcadores.

A visualização Matplotlib do grafo, com arestas ponderadas e coordenadas reais, fica restrita ao Modo Desenvolvedor. O cliente pode autorizar a geolocalização ou escolher um ponto manualmente.

## Ordenação e benchmark

`algoritmos/ordenacao.py` implementa funções independentes e instrumentadas para Bubble Sort, Insertion Sort, Selection Sort e QuickSort. O benchmark ordena prestadores persistidos por avaliação decrescente e ID crescente (desempate), mede cada algoritmo em uma cópia idêntica de cada conjunto e verifica que as sequências resultantes são iguais. Os cenários são um quarto, metade e o total dos registros disponíveis, sem criar dados sintéticos; se o banco tiver poucos prestadores, haverá menos cenários. O gráfico representa os tempos medidos na requisição, portanto pequenas diferenças em conjuntos pequenos podem variar entre execuções.

O Modo Desenvolvedor mostra quantidade, tempo, comparações, trocas, movimentações e o algoritmo mais rápido por cenário. Seus endpoints exigem autenticação e autorização pela lista `DEV_MODE_USER_IDS`; não ficam disponíveis a todos os prestadores.

## Lista e pilha do painel

O painel do prestador carrega contratos pela API. A lista ligada é atualizada com o registro retornado pelo backend após uma transição confirmada. A pilha LIFO recebe ações de status somente depois do sucesso da API. Como o esquema atual de contratações não guarda eventos de status, essa pilha é local à sessão; `pop` afeta apenas a visualização e não desfaz/persiste alterações no servidor. O Modo Desenvolvedor também percorre os contratos com lista ligada e exibe uma pilha visual das contratações mais recentes.

## Conversas e temas

O chat usa conversas persistidas no Supabase e atualização periódica por HTTP (a cada quatro segundos), sem WebSocket. A migração `supabase/migrations/202611080002_conversations.sql` cria as tabelas, índices, permissões, uma verificação de perfil compatível com RLS e as políticas RLS; aplique-a no Supabase antes de usar o chat. Só participantes podem consultar conversas e mensagens. Exceções inesperadas do backend são registradas no log do servidor sem expor detalhes internos na resposta HTTP. O modo claro/escuro é alternável nas telas e a preferência fica salva em `localStorage`; os temas usam tokens CSS e também ajustam o contraste dos mapas.

Se o endpoint retornar `PGRST205` para `public.conversations`, execute o arquivo completo da migração no SQL Editor do mesmo projeto Supabase configurado no backend. Caso a migração de geolocalização ainda não tenha sido aplicada, execute-a primeiro. Confirme a criação das duas tabelas com `select to_regclass('public.conversations'), to_regclass('public.conversation_messages');`; ambas devem retornar um nome de tabela. Se existirem e o erro persistir, atualize o schema cache com `notify pgrst, 'reload schema';`.

A interface mantém CSS Modules e integra Lucide React para ícones vetoriais e Radix Tabs para navegação acessível no Modo Desenvolvedor. Essa composição evita introduzir Tailwind e migrar os estilos existentes apenas para adotar shadcn/ui; avatar, cartões e os controles de navegação seguem componentes/estilos reutilizáveis do projeto.

## Endpoints

| Método | Endpoint | Acesso | Uso |
|---|---|---|---|
| `POST` | `/prestadores/proximos` | Cliente autenticado | Recomendações, distâncias e coordenadas para marcadores no mapa |
| `GET` | `/dev/access` | Usuário autenticado | Verifica se o usuário está na allowlist Dev |
| `GET` | `/dev/info`, `/dev/benchmark`, `/dev/grafo` (`/analises/benchmark` legado) | Usuário autorizado em `DEV_MODE_USER_IDS` | Informações de hash, benchmark e grafo Matplotlib |
| `GET` / `POST` | `/conversas` | Usuário autenticado | Lista conversas ou inicia uma conversa como cliente |
| `GET` / `POST` | `/conversas/<id>/mensagens` | Participante autenticado | Lê ou envia mensagens; a leitura marca mensagens recebidas como lidas |

## Execução e validação

Dependências Python são instaladas com `pip install -r requirements.txt`; dependências do frontend, com `npm install` no diretório `frontend`. Configure `SUPABASE_URL`, `SUPABASE_KEY`, `CORS_ORIGINS` e uma lista separada por vírgulas de UUIDs de usuários Supabase em `DEV_MODE_USER_IDS`. Configure `VITE_API_BASE_URL` no frontend. O mapa usa OpenStreetMap e não requer chave do Google Maps.

No Supabase, aplique em ordem os arquivos `supabase/migrations/202611080001_provider_geolocation.sql` e `supabase/migrations/202611080002_conversations.sql` (por exemplo, pelo SQL Editor). As migrações recarregam o schema do PostgREST. Não coloque `DEV_MODE_USER_IDS` no frontend; configure os UUIDs autorizados somente no ambiente do backend.

Validação automatizada:

- `python -m unittest discover -s tests -v`
- `npm run build` no diretório `frontend`

Resultado desta execução: 27 testes Python passaram; o build TypeScript/Vite foi concluído. `npm run lint` não pôde rodar porque o executável ESLint não está instalado nem declarado nas dependências do frontend.
