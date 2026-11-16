# 🍿 Recomenda Filmes

Avalie filmes, séries e animes que você já assistiu e receba recomendações personalizadas, cada uma com a
**porcentagem de compatibilidade** com o seu gosto e o motivo da indicação — no estilo do Taste.io.

## Funcionalidades

- **Avaliar** — grade com os títulos mais assistidos (filmes, séries e animes) e busca por nome.
  Cada título recebe uma nota na escala **Odeio · Ruim · Bom · Ótimo**, ou é marcado como **Nunca vi**.
- **Seções** — todas as telas têm o filtro **Tudo · Filmes · Séries · Animes**. Anime é toda
  animação com idioma original japonês, seja filme ou série. As seções são exclusivas: _Attack on
  Titan_ aparece em Animes (e em Tudo), mas não em Séries. Nos cards, o tipo aparece como **Anime**
  (séries) ou **Filme anime**.
- **Recomendações** — liberadas a partir de 5 avaliações (com pelo menos uma positiva). Cada
  recomendação mostra a % de compatibilidade e a explicação (“Porque você curtiu _Dark_”).
  Dá para guardar em **Quero ver**, dispensar (**Não tenho interesse**) ou avaliar na hora (**Já vi**).
- **Minhas avaliações** — tudo o que você avaliou, com abas por nota e filtro por seção; a nota pode
  ser trocada ou desfeita a qualquer momento.
- **Quero ver** — lista de títulos guardados para depois.
- **Página do título** — sinopse, elenco, direção, trailer e **onde assistir no Brasil**.
- **Conta opcional** — dá para usar tudo sem cadastro (os dados ficam no navegador). Quem cria
  conta — com **e-mail e senha** ou **Google** — tem as avaliações salvas no servidor e
  sincronizadas entre dispositivos. As avaliações feitas antes do login vão para a conta: sem
  perguntar, se ela estiver vazia; senão, o usuário escolhe entre **juntar** ou **descartar** as
  do navegador. Ao sair, o navegador é limpo (os dados continuam na conta).
- **Recuperação de senha** — link enviado por e-mail (válido por 60 minutos).
- **Backup** — exportar/importar JSON, além de sincronização entre abas.
- Interface em português, responsiva (com barra de navegação inferior no celular) e acessível.

## Tecnologias

| Camada         | Escolha                                                                    |
| -------------- | -------------------------------------------------------------------------- |
| Framework      | [Next.js 16](https://nextjs.org) (App Router, Cache Components) + React 19 |
| Linguagem      | TypeScript (modo estrito)                                                  |
| Estilo         | Tailwind CSS 4 com tokens de design próprios                               |
| Dados no front | TanStack Query (requisições) e Zustand (avaliações salvas no navegador)    |
| Autenticação   | [Better Auth](https://www.better-auth.com) (e-mail e senha + Google)       |
| Banco de dados | PostgreSQL com [Drizzle ORM](https://orm.drizzle.team) (e migrações)       |
| Validação      | Zod (entradas da API, backup e dados do `localStorage`)                    |
| Catálogo       | [API do TMDB](https://developer.themoviedb.org/docs)                       |
| Qualidade      | Vitest + Testing Library, ESLint, Prettier e GitHub Actions                |

## Como rodar

**Pré-requisitos:** Node.js 22.13 ou mais recente, Docker (para o banco de desenvolvimento) e uma
conta gratuita no [TMDB](https://www.themoviedb.org).

1. **Crie a chave da API do TMDB:** em _Configurações → API_, copie o **Token de leitura da API**
   (o token longo, que começa com `eyJ`).
2. **Configure o ambiente:** copie `.env.example` para `.env` e preencha:
   - `TMDB_API_READ_TOKEN` (a chave v3, `TMDB_API_KEY`, também funciona);
   - `BETTER_AUTH_SECRET` com um valor aleatório: `openssl rand -base64 32`.

   O `DATABASE_URL` do exemplo já aponta para o banco do `compose.yaml`. O arquivo `.env` não vai
   para o git.

3. **Instale, suba o banco, crie as tabelas e rode:**

   ```bash
   npm install
   npm run db:up       # PostgreSQL no Docker (porta 5433)
   npm run db:migrate  # cria as tabelas
   npm run dev
   ```

4. Acesse <http://localhost:3000>.

> Sem banco configurado o app continua funcionando sem login; só as contas ficam indisponíveis.

### Login com Google (opcional)

1. No [Google Cloud Console](https://console.cloud.google.com/apis/credentials), crie um
   **ID do cliente OAuth** do tipo _Aplicativo da Web_.
2. Em **URIs de redirecionamento autorizados**, adicione
   `http://localhost:3000/api/auth/callback/google` (e o equivalente do domínio em produção).
3. Preencha `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` no `.env`. O botão “Continuar com Google”
   aparece automaticamente quando as duas variáveis existem.

### E-mails (recuperação de senha)

Defina `SMTP_URL` (ex.: `smtps://usuario:senha@smtp.exemplo.com:465`) e `EMAIL_FROM`. Sem SMTP, em
desenvolvimento o e-mail — com o link de redefinição — aparece no terminal do `npm run dev`.

### Deploy (Vercel + Neon)

O app está preparado para a [Vercel](https://vercel.com) (plano Hobby, gratuito para uso pessoal)
com o PostgreSQL do [Neon](https://neon.com) (plano gratuito). O [`vercel.json`](vercel.json) roda
`npm run db:migrate` antes do build, então as migrações da pasta `drizzle/` são aplicadas a cada
deploy, automaticamente.

1. **Importe o repositório:** na Vercel, _Add New → Project_ e escolha este repositório do GitHub.
   O framework (Next.js) é detectado sozinho.
2. **Crie o banco:** no projeto da Vercel, _Storage → Create Database → Neon_ e conecte ao
   projeto. A integração cria o `DATABASE_URL` (com pooler, usado pelo app) e o
   `DATABASE_URL_UNPOOLED` (conexão direta, usada pelas migrações).
3. **Configure as variáveis** em _Settings → Environment Variables_:

   | Variável                                    | Valor                                                       |
   | ------------------------------------------- | ----------------------------------------------------------- |
   | `TMDB_API_READ_TOKEN`                       | o mesmo token do desenvolvimento                            |
   | `BETTER_AUTH_SECRET`                        | um valor **novo**: `openssl rand -base64 32`                |
   | `BETTER_AUTH_URL`                           | o domínio público, ex.: `https://seu-app.vercel.app`        |
   | `SMTP_URL` e `EMAIL_FROM`                   | servidor de e-mail (sem eles, a recuperação de senha falha) |
   | `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` | opcionais, para o login com Google                          |

4. **Faça o deploy** (_Deployments → Redeploy_, ou um push na branch `main`).
5. **Login com Google:** adicione `https://seu-app.vercel.app/api/auth/callback/google` aos URIs de
   redirecionamento do cliente OAuth.

**E-mail gratuito para uso pessoal:** o Gmail funciona com uma
[senha de app](https://myaccount.google.com/apppasswords) (exige verificação em duas etapas):
`SMTP_URL=smtps://seu.email%40gmail.com:senhadeapp@smtp.gmail.com:465`. O `@` do usuário vira `%40`
e os espaços da senha de app são removidos.

> As _preview deployments_ (de outras branches) também rodam as migrações. Com a integração do
> Neon, cada preview pode ganhar uma branch própria do banco; sem isso, elas usam o banco de
> produção.

Em outra hospedagem, configure as mesmas variáveis e rode `npm run db:migrate` antes de
`npm run build`.

### Scripts

| Comando                 | O que faz                                                  |
| ----------------------- | ---------------------------------------------------------- |
| `npm run dev`           | Servidor de desenvolvimento                                |
| `npm run build`         | Build de produção                                          |
| `npm start`             | Servidor de produção (depois do build)                     |
| `npm test`              | Testes (Vitest)                                            |
| `npm run test:watch`    | Testes em modo observação                                  |
| `npm run test:coverage` | Testes com relatório de cobertura                          |
| `npm run lint`          | ESLint                                                     |
| `npm run typecheck`     | Gera os tipos das rotas e roda o TypeScript                |
| `npm run format`        | Formata o código com Prettier                              |
| `npm run check`         | Tudo o que a CI verifica: lint, tipos, formatação e testes |
| `npm run db:up`         | Sobe o PostgreSQL de desenvolvimento (Docker)              |
| `npm run db:migrate`    | Aplica as migrações pendentes no banco                     |
| `npm run db:generate`   | Gera uma migração a partir das mudanças no schema          |
| `npm run db:studio`     | Abre o Drizzle Studio para inspecionar o banco             |

## Como a recomendação funciona

O cálculo acontece no servidor (`src/server/recommendations`), a partir das avaliações enviadas pelo
navegador. Os títulos avaliados são as **sementes** do gosto do usuário; o peso de cada nota é
Ótimo = +2, Bom = +1, Ruim = −1 e Odeio = −2.

1. **Candidatos** — vêm de três fontes:
   - o que o TMDB recomenda a partir de cada semente (sinal colaborativo: “quem viu isto também viu”);
   - as outras obras dos **diretores** (filmes) e **criadores** (séries) favoritos — ex.: quem ama
     _A Origem_ recebe _O Grande Truque_; quem ama _Dark_ recebe _1899_;
   - os títulos mais bem avaliados que combinam os **gêneros favoritos**, em cada seção (filmes,
     séries e animes).
2. **Etapa 1 — pré-seleção:** com os dados das listagens (gêneros, idioma e ano) e os vínculos
   diretos, os melhores candidatos de cada seção (filmes, séries e animes) seguem adiante.
3. **Etapa 2 — similaridade completa:** com os detalhes de cada candidato, a similaridade com cada
   semente combina gêneros, palavras-chave (temas) e pessoas (direção/criação e elenco), ponderados
   por **TF-IDF** (características raras, como “viagem no tempo”, pesam mais do que “drama”).
   Idioma original e distância entre as épocas apenas modulam o resultado.
4. **Compatibilidade (kNN):** cada semente parecida é um indício independente — de que você vai
   gostar (se gostou dela) ou não (se não gostou), com força `similaridade × peso da nota`.
   Os indícios são combinados como um “OU ruidoso”:

   ```text
   gostar          = 1 − Π (1 − força dos parecidos de que você gostou)
   não gostar      = 1 − Π (1 − força dos parecidos de que você não gostou)
   compatibilidade = gostar × (1 − não gostar)
   ```

   Um único título muito parecido já é evidência forte (quem ama _Breaking Bad_ vê _Better Call Saul_
   com 99%), e vários pouco parecidos se somam com retorno decrescente.

5. **% final:** a compatibilidade recebe um ajuste de até ±6 pontos pela qualidade geral do título
   no TMDB (média bayesiana das notas) e vira a porcentagem exibida, que também define a ordem.

Todos os pesos e limites ficam em [`src/server/recommendations/config.ts`](src/server/recommendations/config.ts),
documentados, para facilitar a calibragem.

**Comportamentos de produto:**

- A lista de recomendações não se reorganiza enquanto você interage: ela é calculada sobre uma “foto”
  das avaliações. Ao avaliar algo novo, aparece o aviso para **atualizar**.
- Títulos marcados como **Nunca vi** saem da tela de avaliar, mas continuam podendo ser recomendados.
- Títulos em **Quero ver** e os dispensados não são recomendados.
- O cálculo é o mesmo em qualquer filtro (Tudo/Filmes/Séries/Animes): a % de um título não muda
  entre as abas.

## Arquitetura

```text
Navegador                                         Servidor (Next.js)                       TMDB
┌──────────────────────────────┐   /api/titles/*   ┌─────────────────────────────────┐
│ Páginas e componentes React  │ ────────────────► │ Route Handlers (validação Zod)  │
│ TanStack Query (requisições) │ /api/recommend…   │  ├─ catálogo  ('use cache') ────┼──► API v3
│ Zustand + localStorage       │ ────────────────► │  ├─ recomendador (funções puras)│
│ (avaliações e listas)        │ /api/library      │  ├─ biblioteca da conta ────────┼──► PostgreSQL
│ Sincronização em 2º plano    │ ────────────────► │  └─ /api/auth (Better Auth) ────┼──► (Drizzle)
└──────────────────────────────┘                   │ Páginas de título (RSC)         │
                                                   └─────────────────────────────────┘
```

- **Local primeiro:** as avaliações vivem no `localStorage` (store Zustand persistido e validado com
  Zod), então a interface responde na hora, com ou sem login. O navegador envia as notas para o
  servidor, que calcula as recomendações.
- **Contas e sincronização:** com login, o `localStorage` vira uma cópia local da conta. Cada
  alteração entra numa fila (`sync.pendingKeys`) e é enviada em segundo plano, agrupada, com novas
  tentativas em caso de falha e `keepalive` ao fechar a aba (`src/features/library/sync`). Na
  conta, cada título é uma linha com a sua situação em todas as listas (`LibraryItem`), o que
  permite juntar bibliotecas título a título (vale a ação mais recente). Ao voltar para a aba, o
  app busca o que mudou em outros dispositivos.
- **Segurança:** toda rota da biblioteca identifica o usuário pela sessão (nunca por um id enviado
  pelo cliente); o retorno pós-login só aceita caminhos internos; um login com Google só é ligado
  a uma conta de e-mail e senha cujo e-mail foi verificado (pelo link de redefinição de senha), o
  que evita o sequestro de contas pré-cadastradas com o e-mail de outra pessoa.
- **Chave protegida:** o TMDB só é chamado no servidor (`import 'server-only'`); a chave nunca chega
  ao navegador.
- **Cache:** as consultas ao TMDB usam `'use cache'` + `cacheLife` (detalhes por dias, buscas por
  horas). A primeira recomendação leva alguns segundos; as seguintes, milissegundos.
- **Imagens:** servidas direto pelo CDN do TMDB no tamanho certo, via um `loader` do `next/image`.

### Estrutura de pastas

```text
src/
├── app/                 # Rotas (App Router): páginas, layouts e Route Handlers em app/api
├── components/
│   ├── ui/              # Componentes genéricos e reutilizáveis (Button, Badge, EmptyState…)
│   ├── media/           # Blocos de título reaproveitados em todo o app (MediaCard, MediaGrid…)
│   └── layout/          # Cabeçalho, navegação, rodapé e containers
├── features/            # Funcionalidades, cada uma com seus componentes, hooks e regras
│   ├── catalog/         # Listagem e busca de títulos (cliente da API interna)
│   ├── rating/          # Escala de avaliação e tela "Avaliar"
│   ├── recommendations/ # Tela de recomendações e "foto" das avaliações
│   ├── library/         # Biblioteca do usuário: store, backup, telas de listas e sincronização
│   ├── auth/            # Telas e formulários de login, cadastro e recuperação de senha
│   ├── account/         # Liga a sessão à biblioteca: menu da conta, logout e junção de dados
│   ├── title/           # Página de detalhes do título
│   └── home/            # Página inicial
├── domain/              # Tipos e regras de negócio puros (sem React/Next), com schemas Zod
├── server/              # Código exclusivo do servidor
│   ├── tmdb/            # Cliente, tipos, conversores e catálogo do TMDB
│   ├── recommendations/ # Motor de recomendação
│   ├── auth/            # Configuração do Better Auth e leitura da sessão
│   ├── db/              # Conexão e schema do banco (Drizzle)
│   ├── library/         # Biblioteca sincronizada de cada usuário (repositório)
│   ├── email/           # Envio de e-mails (SMTP) e modelos
│   └── http/            # Utilitários dos Route Handlers (erros padronizados)
├── lib/                 # Utilitários genéricos (formatação, rotas, http, arrays…)
├── hooks/               # Hooks genéricos
└── config/              # Configurações do site, da navegação e da autenticação
drizzle/                 # Migrações SQL do banco (geradas pelo Drizzle Kit)
test/                    # Configuração e fixtures dos testes
```

### Convenções

- **Camadas:** `domain` não depende de nada do app; `server` não é importado pelo cliente;
  componentes de `ui` não conhecem o domínio. As regras ficam em funções puras e testáveis
  (ex.: `domain/library.ts`); hooks e componentes apenas as conectam.
- **Componentes reutilizáveis:** o `MediaCard` é a base de todos os cards (avaliar, recomendação,
  lista e relacionados), que só preenchem os seus “slots”.
- **Estilo:** cores e tokens em `src/app/globals.css` (`@theme`); variantes com
  `class-variance-authority`; classes combinadas com `cn()`.
- **Erros da API:** sempre no formato `{ error: { code, message } }`, com mensagens em português.
- **Idioma:** identificadores em inglês; comentários, textos da interface e documentação em português.
- **Arquivos:** nomes em `kebab-case`, exportações nomeadas e imports absolutos (`@/…`).

## Testes

```bash
npm test
```

Os testes cobrem o motor de recomendação (com um catálogo falso), os conversores do TMDB, as
regras da biblioteca, a sincronização com a conta (com um servidor falso), a junção de bibliotecas,
o backup, a “foto” das avaliações, utilitários, as rotas da API, a tela de login e componentes de
interface. Os testes não precisam de banco de dados. A CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) roda lint, tipos,
formatação, testes e build a cada push e pull request.

## Limitações e próximos passos

- **Sem login, dados só no navegador:** trocar de navegador ou limpar os dados apaga as avaliações —
  crie uma conta ou use o backup em _Minhas avaliações_.
- **Conflitos entre dispositivos:** se o mesmo título for alterado em dois dispositivos ao mesmo
  tempo, vale o último envio.
- **Limite de tentativas de login:** o Better Auth guarda o contador em memória; com vários
  servidores, configure um armazenamento compartilhado (`rateLimit.storage`).
- **Cache em memória:** o cache do Next.js fica na memória do servidor. Em hospedagem serverless
  as entradas não persistem entre requisições; nesse caso, configure um
  [cache handler remoto](https://nextjs.org/docs/app/api-reference/directives/use-cache-remote).
- **Ideias:** diversificar a lista (evitar muitos títulos da mesma franquia), tema claro, testes
  ponta a ponta com Playwright e filtros por plataforma de streaming.

## Créditos

Dados e imagens fornecidos pelo [TMDB](https://www.themoviedb.org). Este produto usa a API do TMDB,
mas não é endossado nem certificado pelo TMDB. Informações de “onde assistir” fornecidas pela
[JustWatch](https://www.justwatch.com).
