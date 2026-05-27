# MDD — Meta Documento de Desenvolvimento

> **Projeto:** API Backend do aplicativo *Meu Diário*
> **Metodologia:** Spec-Driven Development (SDD)
> **Fase atual:** Fase 1 — Constituição / Contexto
> **Versão:** 1.0.0
> **Última atualização:** 2025-05-27
> **Autoras:** Camila Pereira Braga · Maria Cecilia Leite Cardoso
> **Instituição:** IFPB — Campus Cajazeiras · Engenharia de Software

---

## Sobre este documento

Este é o documento-base (constituição) do projeto, na terminologia do Spec-Driven Development. Ele NÃO descreve funcionalidades específicas — isso é tarefa das *specs* na Fase 2. Aqui ficam registrados o **contexto**, os **princípios não-negociáveis**, os **padrões de projeto** e as **decisões de arquitetura** que toda spec, plano e implementação posterior deve respeitar.

Em SDD, o fluxo de trabalho tem 4 fases, cada uma com um ponto de revisão humano:

```
Fase 1: Constituição   →  este documento (mdd.md)
Fase 2: Specify        →  specs por funcionalidade (spec-*.md)
Fase 3: Plan / Tasks   →  plano técnico + quebra em tarefas
Fase 4: Implement      →  código gerado a partir das specs
```

Regra central do SDD: **a especificação é a fonte da verdade; o código serve à especificação, não o contrário.** Quando um requisito muda, edita-se a spec e regenera-se o código afetado.

Toda spec criada na Fase 2 deve ser validada contra este documento. Se uma spec entrar em conflito com um princípio aqui definido, ou este documento é emendado de forma explícita e versionada, ou a spec é corrigida.

---

## 1. Contexto do projeto

### 1.1 Visão geral

O *Meu Diário* é um aplicativo móvel de diário pessoal com gamificação e funcionalidades sociais. Este repositório trata exclusivamente do **backend**: uma API REST que serve o aplicativo móvel (cliente Android).

O backend é responsável por:

- Autenticação e gestão de contas de usuário;
- Persistência de anotações, tags, registros de humor;
- Lógica de gamificação (pontos, streaks, níveis, conquistas);
- Funcionalidades sociais (feed, curtidas, comentários, seguir);
- Cálculo de insights e agregações;
- Moderação de conteúdo público.

### 1.2 O que está fora do escopo do backend

- Interface gráfica e renderização (responsabilidade do app móvel);
- Notificações push locais agendadas no dispositivo;
- Armazenamento local / offline do app (banco local do cliente);
- Biometria e PIN (recursos do dispositivo).

### 1.3 Atores do sistema

| Ator | Descrição |
|------|-----------|
| Usuário não autenticado | Pode registrar-se e autenticar-se apenas. |
| Usuário básico | Usuário autenticado; acessa recursos pessoais (anotações, humor, gamificação). |
| Usuário social | Usuário básico com perfil público; acessa feed, curtidas, comentários, seguir. |
| Administrador | Modera conteúdo público e gere denúncias. |

### 1.4 Glossário rápido

| Termo | Significado |
|-------|-------------|
| Anotação | Registro textual do usuário, com título, texto, tags, humor e mídia opcional. |
| Streak | Dias consecutivos com ao menos uma anotação registrada. |
| Badge | Conquista desbloqueada ao cumprir critérios. |
| Feed | Listagem cronológica de anotações públicas. |
| Spec | Documento de especificação de uma funcionalidade (Fase 2). |

---

## 2. Stack tecnológica

Decisões de tecnologia já tomadas. Specs e planos devem assumir esta stack como dada.

| Camada | Tecnologia | Observação |
|--------|-----------|------------|
| Runtime | Node.js (LTS) | Versão LTS ativa no início do projeto. |
| Framework HTTP | Express.js | Framework principal da API. |
| Banco de dados | PostgreSQL | Banco relacional. |
| Acesso a dados | Query builder / ORM | Definir na Fase 3 (ex.: Knex, Prisma, Sequelize). |
| Autenticação | JWT (JSON Web Token) | API stateless. |
| Hash de senha | bcrypt | Nunca armazenar senha em texto puro. |
| Validação de entrada | Biblioteca de schema | Ex.: Zod ou Joi — definir na Fase 3. |
| Variáveis de ambiente | dotenv | Configuração fora do código. |
| Linguagem | JavaScript | TypeScript opcional, decidir na Fase 3. |

### 2.1 Decisões pendentes (a resolver na Fase 3 — Plan)

- Escolha definitiva entre ORM e query builder;
- Biblioteca de validação de schema;
- Estratégia de migrations do banco;
- Adoção ou não de TypeScript.

> Testes automatizados **não são prioridade neste momento** do projeto (decisão das autoras). O código deve, ainda assim, ser escrito de forma testável (ver Princípio P-07), para que testes possam ser adicionados depois sem refatoração estrutural.

---

## 3. Princípios não-negociáveis

Estes princípios são a "constituição" do projeto. Toda spec e todo código devem respeitá-los. Cada um tem um identificador para ser referenciado nas specs.

### P-01 — A especificação é a fonte da verdade
Nenhuma funcionalidade é implementada sem uma spec aprovada na Fase 2. Mudança de comportamento começa pela spec.

### P-02 — API REST consistente
Todos os endpoints seguem as convenções REST definidas na Seção 5. Sem exceções por conveniência.

### P-03 — Separação de responsabilidades em camadas
O código é organizado em camadas (Seção 4). Uma camada nunca pula outra: rota não acessa o banco diretamente, controller não escreve SQL.

### P-04 — Validação na borda
Toda entrada vinda do cliente (body, params, query) é validada antes de chegar à lógica de negócio. Dados inválidos são rejeitados com `400` e mensagem clara.

### P-05 — Segurança por padrão
Senhas sempre com hash (bcrypt). Segredos sempre em variáveis de ambiente, nunca no código nem no controle de versão. Rotas protegidas exigem JWT válido.

### P-06 — Respostas previsíveis
Todas as respostas — de sucesso ou erro — seguem o formato padrão da Seção 6. O cliente nunca precisa adivinhar a estrutura.

### P-07 — Código testável
Mesmo sem testes obrigatórios agora, a lógica de negócio fica em services puros e isoláveis, sem dependência direta do objeto `req`/`res` do Express, permitindo testes futuros.

### P-08 — Sem lógica de negócio em controllers
Controllers apenas orquestram: recebem a requisição, chamam services, formatam a resposta. Regras de negócio vivem na camada de service.

### P-09 — Tratamento centralizado de erros
Erros não são tratados ad-hoc em cada rota. Há um middleware único de tratamento de erros (Seção 6.3).

### P-10 — Nomenclatura e idioma consistentes
Código (variáveis, funções, arquivos) em inglês. Mensagens voltadas ao usuário final em português. Sem mistura dentro da mesma categoria.

---

## 4. Arquitetura

### 4.1 Estilo arquitetural

Arquitetura em **camadas (layered architecture)**, com fluxo de dependência unidirecional:

```
Requisição HTTP
      │
      ▼
┌─────────────┐
│   Routes    │  Define os endpoints e associa middlewares.
└─────────────┘
      │
      ▼
┌─────────────┐
│ Middlewares │  Autenticação, validação, etc. (transversais)
└─────────────┘
      │
      ▼
┌─────────────┐
│ Controllers │  Orquestra: lê req, chama service, devolve res.
└─────────────┘
      │
      ▼
┌─────────────┐
│  Services   │  Regras de negócio. Não conhece req/res.
└─────────────┘
      │
      ▼
┌─────────────┐
│ Repositories│  Acesso ao banco. Único lugar com SQL/ORM.
└─────────────┘
      │
      ▼
┌─────────────┐
│  PostgreSQL │
└─────────────┘
```

Regra de dependência: cada camada só conhece a camada imediatamente abaixo. Routes → Controllers → Services → Repositories. Nunca o inverso, nunca pulando camadas.

### 4.2 Responsabilidade de cada camada

| Camada | Responsabilidade | Não pode |
|--------|------------------|----------|
| Routes | Mapear URL + método HTTP para um controller; encadear middlewares. | Conter lógica. |
| Middlewares | Tarefas transversais: autenticar JWT, validar schema, logar. | Conter regra de negócio. |
| Controllers | Extrair dados da requisição, chamar service, montar resposta padrão. | Acessar banco; conter regra de negócio. |
| Services | Implementar regras de negócio; orquestrar repositories. | Conhecer `req`/`res`; escrever SQL. |
| Repositories | Executar queries no PostgreSQL; mapear linhas para objetos. | Conter regra de negócio. |

### 4.3 Estrutura de pastas

```
meu-diario-backend/
├── src/
│   ├── config/          # Conexão com banco, leitura de env
│   ├── routes/          # Definição das rotas (um arquivo por recurso)
│   ├── controllers/     # Controllers (um arquivo por recurso)
│   ├── services/        # Regras de negócio (um arquivo por recurso)
│   ├── repositories/    # Acesso a dados (um arquivo por recurso)
│   ├── middlewares/     # auth, validação, tratamento de erro
│   ├── validators/      # Schemas de validação de entrada
│   ├── utils/           # Funções auxiliares (hash, jwt, etc.)
│   ├── errors/          # Classes de erro customizadas
│   └── app.js           # Montagem do Express
├── specs/               # Specs da Fase 2 (spec-*.md)
├── .env.example         # Modelo de variáveis de ambiente
├── .gitignore
├── mdd.md               # Este documento
├── package.json
└── server.js            # Ponto de entrada (sobe o servidor)
```

### 4.4 Organização por recurso

Cada recurso de domínio (ex.: `users`, `notes`, `moods`, `tags`, `gamification`, `social`) tem um arquivo correspondente em cada camada, com nome consistente:

```
routes/notes.routes.js
controllers/notes.controller.js
services/notes.service.js
repositories/notes.repository.js
validators/notes.validator.js
```

---

## 5. Padrões da API REST

### 5.1 Convenções de URL

- Recursos no plural, em inglês, minúsculas: `/users`, `/notes`, `/moods`.
- Prefixo de versão em todas as rotas: `/api/v1/...`.
- Sub-recursos aninhados quando há relação de posse: `/api/v1/notes/:id/comments`.
- Sem verbos na URL — o verbo é o método HTTP.

| Errado | Certo |
|--------|-------|
| `/api/v1/getNotes` | `GET /api/v1/notes` |
| `/api/v1/note` | `/api/v1/notes` |
| `/api/v1/createNote` | `POST /api/v1/notes` |

### 5.2 Métodos HTTP

| Método | Uso | Exemplo |
|--------|-----|---------|
| GET | Ler recurso(s). Nunca altera estado. | `GET /api/v1/notes` |
| POST | Criar recurso. | `POST /api/v1/notes` |
| PUT | Substituir recurso por completo. | `PUT /api/v1/notes/:id` |
| PATCH | Atualizar parcialmente. | `PATCH /api/v1/notes/:id` |
| DELETE | Remover recurso. | `DELETE /api/v1/notes/:id` |

### 5.3 Códigos de status HTTP

| Código | Quando usar |
|--------|-------------|
| 200 OK | Sucesso em GET, PUT, PATCH, DELETE. |
| 201 Created | Recurso criado com sucesso (POST). |
| 204 No Content | Sucesso sem corpo de resposta. |
| 400 Bad Request | Entrada inválida (falha de validação). |
| 401 Unauthorized | Falta de autenticação ou token inválido. |
| 403 Forbidden | Autenticado, mas sem permissão para o recurso. |
| 404 Not Found | Recurso não existe. |
| 409 Conflict | Conflito de estado (ex.: e-mail já cadastrado). |
| 422 Unprocessable Entity | Entrada bem-formada mas semanticamente inválida. |
| 500 Internal Server Error | Erro inesperado do servidor. |

### 5.4 Paginação, filtro e ordenação

Listagens usam query params padronizados:

- Paginação: `?page=1&limit=20` (limite máximo definido na spec do recurso).
- Filtro: `?tag=trabalho&mood=4`.
- Ordenação: `?sort=createdAt&order=desc`.

A resposta de listagem inclui metadados de paginação (ver 6.1).

---

## 6. Padrão de respostas

### 6.1 Resposta de sucesso

Toda resposta de sucesso tem a forma:

```json
{
  "success": true,
  "data": { }
}
```

Para listagens, `data` é um array e há um bloco `meta`:

```json
{
  "success": true,
  "data": [ ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 137
  }
}
```

### 6.2 Resposta de erro

Todo erro tem a forma:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "O campo título é obrigatório.",
    "details": []
  }
}
```

- `code`: identificador estável e legível por máquina (em inglês, maiúsculas).
- `message`: mensagem amigável para o usuário final (em português).
- `details`: opcional; lista de erros campo a campo, útil em falhas de validação.

### 6.3 Tratamento de erros

- Existe um middleware único de tratamento de erros, registrado por último no Express.
- A camada de service lança erros usando classes customizadas (pasta `errors/`), ex.: `NotFoundError`, `ValidationError`, `UnauthorizedError`, `ConflictError`.
- Cada classe de erro carrega o status HTTP e o `code` correspondentes.
- O middleware captura o erro, monta a resposta padrão da Seção 6.2 e responde.
- Erros não previstos viram `500` com `code: "INTERNAL_ERROR"`, sem vazar detalhes internos (stack trace nunca vai para o cliente).

---

## 7. Padrões de projeto adotados

| Padrão | Onde se aplica | Objetivo |
|--------|----------------|----------|
| Layered Architecture | Todo o backend | Separar responsabilidades, isolar mudanças. |
| Repository Pattern | Camada de repositories | Centralizar e abstrair o acesso a dados. |
| Service Layer | Camada de services | Concentrar regras de negócio em um só lugar. |
| Middleware (Chain of Responsibility) | Autenticação, validação, erros | Tratar preocupações transversais de forma componível. |
| DTO (Data Transfer Object) | Entrada e saída dos controllers | Definir formatos de dados explícitos entre cliente e API. |
| Centralized Error Handling | Middleware de erro | Tratamento de erro único e consistente. |
| Dependency Injection (leve) | Services recebem repositories | Facilitar substituição e testes futuros. |
| Environment Configuration | `config/` + dotenv | Manter configuração fora do código. |

### 7.1 Convenções de código

- Nomes de arquivos: `recurso.camada.js` (ex.: `notes.service.js`).
- Funções e variáveis: `camelCase`, em inglês.
- Classes: `PascalCase`.
- Constantes globais: `UPPER_SNAKE_CASE`.
- Funções de service são `async` e propagam erros via `throw`.
- Uma função, uma responsabilidade. Funções longas demais devem ser quebradas.
- Sem "números mágicos" ou strings soltas — usar constantes nomeadas.

---

## 8. Segurança

- Senhas armazenadas apenas como hash bcrypt (nunca texto puro, nunca criptografia reversível).
- Autenticação via JWT: o token é enviado no header `Authorization: Bearer <token>`.
- O payload do JWT contém o mínimo necessário (ex.: `userId`, `role`); nunca dados sensíveis.
- Segredos (chave JWT, credenciais do banco) ficam em variáveis de ambiente; `.env` está no `.gitignore`.
- Rotas protegidas passam por um middleware de autenticação que valida o token antes do controller.
- Autorização: além de autenticar, verifica-se se o usuário tem permissão sobre o recurso (ex.: só edita a própria anotação).
- Validação de entrada em toda requisição (P-04) — proteção básica contra dados malformados.
- O backend nunca retorna stack traces nem detalhes internos em respostas de erro.

---

## 9. Modelo de dados (visão inicial)

Visão preliminar das entidades principais, para orientar as specs. O schema definitivo (tipos, índices, constraints) é detalhado na Fase 3.

| Entidade | Descrição | Relações principais |
|----------|-----------|---------------------|
| User | Conta de usuário. | Possui muitas Notes; possui Gamification. |
| Note | Anotação do diário. | Pertence a um User; tem muitas Tags; tem um Mood. |
| Tag | Etiqueta de organização. | Associada a muitas Notes (N:N). |
| Mood | Registro de humor (escala 1–5). | Pertence a um User e a um dia. |
| Gamification | Pontos, nível e streak do usuário. | Pertence a um User. |
| Badge | Conquista. | Associada a muitos Users (N:N). |
| Follow | Relação de "seguir" entre usuários. | Liga dois Users. |
| Like | Curtida em anotação pública. | Liga User e Note. |
| Comment | Comentário em anotação pública. | Pertence a um User e a uma Note. |
| Report | Denúncia de conteúdo. | Liga User (denunciante) e Note. |

---

## 10. Como usar este documento na Fase 2

Na Fase 2, cada funcionalidade vira uma spec em `specs/spec-<nome>.md`. Sugestão de divisão, alinhada aos módulos do documento de requisitos:

- `spec-auth.md` — registro, login, redefinição de senha, JWT.
- `spec-notes.md` — CRUD de anotações, tags, busca, filtros.
- `spec-moods.md` — registro de humor e agregações.
- `spec-gamification.md` — pontos, streaks, níveis, badges.
- `spec-social.md` — feed, curtidas, comentários, seguir, denúncias.
- `spec-insights.md` — cálculos e relatórios.

Cada spec deve conter, no mínimo:

1. **Objetivo** — o que a funcionalidade entrega.
2. **Endpoints** — método, URL, descrição, permissões.
3. **Entrada** — formato do body/params/query e regras de validação.
4. **Saída** — formato da resposta de sucesso.
5. **Erros** — erros possíveis com seus `code` e status.
6. **Regras de negócio** — comportamento esperado, casos de borda.
7. **Critérios de aceitação** — condições verificáveis de "pronto".

Toda spec deve referenciar os princípios (`P-01`…`P-10`) que a sustentam e respeitar os padrões das Seções 5, 6 e 7. Recomenda-se escrever critérios de aceitação no estilo EARS (*Easy Approach to Requirements Syntax*) — frases curtas e testáveis no formato "Quando [condição], o sistema deve [comportamento]".

---

## 11. Governança e versionamento deste documento

- Este documento é versionado junto com o código (controle de versão).
- Mudanças seguem versionamento semântico: `MAJOR.MINOR.PATCH`.
  - MAJOR: alteração que invalida specs ou código já existentes.
  - MINOR: adição de princípio ou seção sem quebrar o que existe.
  - PATCH: correção de texto, sem mudança de regra.
- Toda emenda deve registrar data, versão e motivo no histórico abaixo.
- Em caso de conflito entre uma spec e este documento, este documento prevalece — a menos que seja formalmente emendado.

### Histórico de versões

| Versão | Data | Descrição |
|--------|------|-----------|
| 1.0.0 | 2025-05-27 | Versão inicial da constituição do projeto. |
