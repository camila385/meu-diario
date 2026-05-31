# SDD — Spec-Driven Development Constitution

> **Projeto:** API Backend do aplicativo *Meu Diário*
> **Metodologia:** Spec-Driven Development (SDD)
> **Fase atual:** Fase 1 — Constituição / Contexto
> **Versão:** 2.0.0
> **Última atualização:** 2026-05-27
> **Autoras:** Camila Pereira Braga · Maria Cecilia Leite Cardoso
> **Instituição:** IFPB — Campus Cajazeiras · Engenharia de Software

---

## Sobre este documento

Este é o documento-base (constituição) do projeto, na terminologia do Spec-Driven Development. Ele NÃO descreve funcionalidades específicas — isso é tarefa das *specs* na Fase 2. Aqui ficam registrados o **contexto**, os **princípios não-negociáveis**, os **padrões de projeto** e as **decisões de arquitetura** que toda spec, plano e implementação posterior deve respeitar.

Em SDD, o fluxo de trabalho tem 4 fases, cada uma com um ponto de revisão humano:

```
Fase 1: Constituição   →  este documento (sdd.md)
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
- Cálculo de insights e agregações.

### 1.2 O que está fora do escopo do backend

- Interface gráfica e renderização (responsabilidade do app móvel);
- Notificações push locais agendadas no dispositivo;
- Armazenamento local / offline do app (banco local do cliente);
- Biometria e PIN (recursos do dispositivo);
- Moderação administrativa de conteúdo (fora do escopo atual).

### 1.3 Atores do sistema

O sistema tem um único tipo de usuário autenticado. A distinção entre "básico" e "social" é feita por um campo `isPublic` no perfil — não por roles diferentes. Isso simplifica a autorização.

| Ator | Descrição |
|------|-----------|
| Visitante | Não autenticado. Pode apenas registrar-se e fazer login. |
| Usuário | Autenticado. Acessa todos os recursos — pessoais e sociais — conforme sua configuração de perfil. |

> **Decisão:** não há role de Administrador neste momento. Moderação de conteúdo é escopo futuro.

### 1.4 Glossário rápido

| Termo | Significado |
|-------|-------------|
| Anotação | Registro textual do usuário, com título, texto, tags, humor e mídia opcional. |
| Streak | Dias consecutivos com ao menos uma anotação registrada. |
| Badge | Conquista desbloqueada ao cumprir critérios. |
| Feed | Listagem cronológica de anotações públicas de outros usuários. |
| Spec | Documento de especificação de uma funcionalidade (Fase 2). |
| DTO | Data Transfer Object — interface TypeScript que define o formato de entrada ou saída de um endpoint. |
| Model | Representação TypeScript de uma entidade do banco, derivada do schema Prisma. |

---

## 2. Stack tecnológica

Todas as decisões abaixo são **definitivas**. Specs e código devem assumir esta stack como dada — sem substituições.

| Camada | Tecnologia | Versão / Observação |
|--------|-----------|----------------------|
| Linguagem | TypeScript | Strict mode habilitado. Sem `any` explícito. |
| Runtime | Node.js | LTS ativo. |
| Framework HTTP | Express.js | Framework principal da API. |
| Banco de dados | PostgreSQL | Banco relacional. |
| ORM | Prisma | Schema em `prisma/schema.prisma`. Client gerado em `src/generated/prisma`. |
| Autenticação | JWT (JSON Web Token) | API stateless. Lib: `jsonwebtoken`. |
| Hash de senha | bcrypt | Lib: `bcryptjs`. Nunca armazenar senha em texto puro. |
| Validação de entrada | Zod | Schemas em `src/validators/`. Integração com Express via middleware. |
| Documentação da API | Swagger (OpenAPI 3.0) | Libs: `swagger-ui-express` + `swagger-jsdoc`. Rota: `/api/docs`. |
| Variáveis de ambiente | dotenv + Zod | Validação do `.env` na inicialização via schema Zod em `src/config/env.ts`. |
| Linter / Formatter | ESLint + Prettier | Configurados na raiz do projeto. |

> **Testes automatizados:** fora do escopo deste projeto. O código deve ser estruturalmente testável (services puros, sem acoplamento a `req`/`res`), mas nenhum arquivo de teste será criado.

---

## 3. Princípios não-negociáveis

Estes princípios são a "constituição" do projeto. Toda spec e todo código devem respeitá-los. Cada um tem um identificador para ser referenciado nas specs.

### P-01 — A especificação é a fonte da verdade
Nenhuma funcionalidade é implementada sem uma spec aprovada na Fase 2. Mudança de comportamento começa pela spec.

### P-02 — API REST consistente
Todos os endpoints seguem as convenções REST definidas na Seção 5. Sem exceções por conveniência.

### P-03 — Separação de responsabilidades em camadas
O código é organizado em camadas (Seção 4). Uma camada nunca pula outra: rota não acessa o banco diretamente, controller não usa Prisma Client.

### P-04 — Validação na borda com Zod
Toda entrada vinda do cliente (body, params, query) é validada por um schema Zod antes de chegar ao controller. O middleware `validate` rejeita entradas inválidas com `400` e detalha os erros campo a campo.

### P-05 — Segurança por padrão
Senhas sempre com hash bcrypt. Segredos sempre em variáveis de ambiente, nunca no código nem no controle de versão. Rotas protegidas exigem JWT válido.

### P-06 — Respostas previsíveis
Todas as respostas — de sucesso ou erro — seguem o formato padrão da Seção 6. O cliente nunca precisa adivinhar a estrutura.

### P-07 — Sem lógica de negócio em controllers
Controllers apenas orquestram: recebem a requisição, chamam services, formatam a resposta. Regras de negócio vivem na camada de service.

### P-08 — Tratamento centralizado de erros
Erros não são tratados ad-hoc em cada rota. Há um middleware único de tratamento de erros (Seção 6.3). Services lançam erros via classes customizadas de `src/errors/`.

### P-09 — TypeScript estrito
Sem `any` explícito. Todos os objetos de entrada e saída têm tipos definidos — via Zod inference para DTOs de entrada e interfaces/types para saída. O tipo `unknown` é preferível a `any` quando necessário.

### P-10 — Nomenclatura e idioma consistentes
Código (variáveis, funções, arquivos, tipos) em inglês. Mensagens voltadas ao usuário final em português. Sem mistura dentro da mesma categoria.

### P-11 — Documentação inline com Swagger
Todo endpoint deve ter anotação JSDoc com `@swagger` descrevendo rota, parâmetros, body, respostas e autenticação. A documentação é gerada automaticamente e acessível em `/api/docs`.

### P-12 — Models derivam do Prisma
Nunca criar interfaces manuais para entidades do banco. Os types das entidades vêm do Prisma Client gerado (`import type { User } from '@/generated/prisma'`). DTOs de entrada e saída são definidos separadamente via Zod ou interfaces TypeScript.

---

## 4. Arquitetura

### 4.1 Estilo arquitetural

Arquitetura em **camadas (layered architecture)**, com fluxo de dependência unidirecional:

```
Requisição HTTP
      │
      ▼
┌─────────────┐
│   Routes    │  Define endpoints, encadeia middlewares, chama controller.
└─────────────┘
      │
      ▼
┌─────────────┐
│ Middlewares │  Auth (JWT), validação (Zod), logging. Tarefas transversais.
└─────────────┘
      │
      ▼
┌─────────────┐
│ Controllers │  Extrai dados da req, chama service, devolve resposta padrão.
└─────────────┘
      │
      ▼
┌─────────────┐
│  Validators │  Schemas Zod. Definem e validam DTOs de entrada.
└─────────────┘
      │
      ▼
┌─────────────┐
│  Services   │  Regras de negócio. Não conhece req/res. Usa repositories.
└─────────────┘
      │
      ▼
┌─────────────┐
│ Repositories│  Acesso ao banco via Prisma. Único lugar que usa PrismaClient.
└─────────────┘
      │
      ▼
┌─────────────┐
│   Models    │  Types gerados pelo Prisma + interfaces de saída (DTOs out).
└─────────────┘
      │
      ▼
┌─────────────┐
│  PostgreSQL │
└─────────────┘
```

Regra de dependência: cada camada só conhece a camada imediatamente abaixo. Nunca o inverso, nunca pulando camadas.

### 4.2 Responsabilidade de cada camada

| Camada | Responsabilidade | Não pode |
|--------|------------------|----------|
| Routes | Mapear URL + método HTTP; encadear middlewares; delegar ao controller. | Conter qualquer lógica. |
| Middlewares | Auth JWT, validação Zod, logging, error handler. | Conter regra de negócio. |
| Controllers | Extrair dados da req; chamar service; montar resposta padrão. | Usar Prisma; conter regra de negócio. |
| Validators | Definir schemas Zod; exportar tipos inferidos (DTOs de entrada). | Conter lógica de negócio ou acesso a banco. |
| Services | Implementar regras de negócio; orquestrar repositories. | Conhecer `req`/`res`; usar Prisma diretamente. |
| Repositories | Executar operações no banco via PrismaClient; retornar Models. | Conter regra de negócio. |
| Models | Tipos das entidades (gerados pelo Prisma) + interfaces de resposta (DTOs out). | Conter lógica. |

### 4.3 Estrutura de pastas

```
meudiario-api/
├── prisma/
│   ├── schema.prisma        # Schema do banco — fonte da verdade do modelo de dados
│   └── migrations/          # Migrations geradas pelo Prisma
├── src/
│   ├── config/
│   │   ├── env.ts            # Validação e exportação das variáveis de ambiente (Zod)
│   │   └── swagger.ts        # Configuração do swagger-jsdoc
│   ├── generated/
│   │   └── prisma/           # Prisma Client gerado (não editar manualmente)
│   ├── routes/
│   │   ├── index.ts          # Agrega todas as rotas em /api/v1
│   │   ├── auth.routes.ts
│   │   ├── notes.routes.ts
│   │   ├── moods.routes.ts
│   │   ├── gamification.routes.ts
│   │   ├── social.routes.ts
│   │   └── insights.routes.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── notes.controller.ts
│   │   ├── moods.controller.ts
│   │   ├── gamification.controller.ts
│   │   ├── social.controller.ts
│   │   └── insights.controller.ts
│   ├── validators/
│   │   ├── auth.validator.ts
│   │   ├── notes.validator.ts
│   │   ├── moods.validator.ts
│   │   ├── social.validator.ts
│   │   └── common.validator.ts  # Schemas reutilizáveis (paginação, id, etc.)
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── notes.service.ts
│   │   ├── moods.service.ts
│   │   ├── gamification.service.ts
│   │   ├── social.service.ts
│   │   └── insights.service.ts
│   ├── repositories/
│   │   ├── prisma.client.ts     # Instância singleton do PrismaClient
│   │   ├── users.repository.ts
│   │   ├── notes.repository.ts
│   │   ├── moods.repository.ts
│   │   ├── gamification.repository.ts
│   │   └── social.repository.ts
│   ├── models/
│   │   ├── user.model.ts        # Re-exporta types do Prisma + define DTOs de resposta
│   │   ├── note.model.ts
│   │   ├── mood.model.ts
│   │   ├── gamification.model.ts
│   │   └── social.model.ts
│   ├── middlewares/
│   │   ├── auth.middleware.ts   # Verifica e decodifica JWT
│   │   ├── validate.middleware.ts # Aplica schema Zod na req
│   │   └── error.middleware.ts  # Error handler global (último middleware)
│   ├── errors/
│   │   ├── AppError.ts          # Classe base
│   │   ├── NotFoundError.ts
│   │   ├── UnauthorizedError.ts
│   │   ├── ForbiddenError.ts
│   │   ├── ConflictError.ts
│   │   └── ValidationError.ts
│   ├── utils/
│   │   ├── jwt.ts               # Assinar e verificar tokens
│   │   ├── hash.ts              # Funções bcrypt
│   │   ├── pagination.ts        # Helpers de paginação
│   │   └── response.ts          # Funções auxiliares de resposta padronizada
│   └── app.ts                   # Monta o Express: middlewares globais, rotas, error handler
├── specs/                        # Specs da Fase 2 (spec-*.md)
├── .specify/                     # Spec-kit (constitution, templates)
├── .github/                      # Copilot instructions, prompts
├── .env.example
├── .gitignore
├── sdd.md                        # Este documento
├── tsconfig.json
├── package.json
└── server.ts                     # Ponto de entrada: instancia o app e sobe o servidor
```

### 4.4 Organização por recurso

Cada recurso de domínio tem um arquivo correspondente em cada camada, com sufixo de camada:

```
routes/notes.routes.ts
controllers/notes.controller.ts
validators/notes.validator.ts
services/notes.service.ts
repositories/notes.repository.ts
models/note.model.ts
```

---

## 5. Models e DTOs

### 5.1 Models (entidades do banco)

Os types das entidades do banco são **gerados automaticamente pelo Prisma** a partir do `schema.prisma`. Nunca reescreva essas interfaces manualmente.

```typescript
// Correto — importar do Prisma gerado
import type { Note, User, Mood } from '@/generated/prisma'

// Errado — nunca fazer isso
interface Note { id: string; title: string; ... }
```

O arquivo `src/models/recurso.model.ts` serve para:
1. Re-exportar convenientemente os tipos Prisma do recurso;
2. Definir **DTOs de saída** (o que a API devolve ao cliente), que podem ser subconjuntos ou transformações do Model;
3. Definir tipos auxiliares de domínio que não existem no banco.

Exemplo:

```typescript
// src/models/note.model.ts
import type { Note, Tag } from '@/generated/prisma'

// Re-exporta o Model completo
export type { Note }

// DTO de saída — o que o endpoint GET /notes/:id retorna
export interface NoteResponse {
  id: string
  title: string
  content: string
  mood: number | null
  tags: string[]
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

// DTO de saída para listagem (sem content completo)
export interface NoteListItem {
  id: string
  title: string
  mood: number | null
  tags: string[]
  createdAt: string
}
```

### 5.2 Validators / DTOs de entrada (Zod)

Os **DTOs de entrada** são definidos como schemas Zod em `src/validators/`. O tipo TypeScript é inferido do schema — nunca escrito manualmente.

```typescript
// src/validators/notes.validator.ts
import { z } from 'zod'

export const createNoteSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(200),
  content: z.string().max(10000).optional(),
  mood: z.number().int().min(1).max(5).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  isPublic: z.boolean().optional().default(false),
})

// Tipo inferido — usar este nos controllers e services
export type CreateNoteDTO = z.infer<typeof createNoteSchema>

export const updateNoteSchema = createNoteSchema.partial()
export type UpdateNoteDTO = z.infer<typeof updateNoteSchema>
```

### 5.3 Schema Prisma (visão inicial)

O schema definitivo é mantido em `prisma/schema.prisma`. A seguir, a visão inicial das entidades:

```prisma
model User {
  id           String    @id @default(uuid())
  email        String    @unique
  username     String    @unique
  passwordHash String
  avatarUrl    String?
  isPublic     Boolean   @default(false)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  notes        Note[]
  moods        Mood[]
  gamification Gamification?
  userBadges   UserBadge[]
  following    Follow[]  @relation("follower")
  followers    Follow[]  @relation("following")
  likes        Like[]
  comments     Comment[]
}

model Note {
  id        String    @id @default(uuid())
  userId    String
  title     String
  content   String?
  isPublic  Boolean   @default(false)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  noteTags  NoteTag[]
  mood      Mood?
  likes     Like[]
  comments  Comment[]
}

model Tag {
  id       String    @id @default(uuid())
  name     String    @unique
  noteTags NoteTag[]
}

model NoteTag {
  noteId String
  tagId  String

  note   Note @relation(fields: [noteId], references: [id], onDelete: Cascade)
  tag    Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([noteId, tagId])
}

model Mood {
  id        String   @id @default(uuid())
  userId    String
  noteId    String?  @unique
  value     Int      // 1 a 5
  date      DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  note      Note?    @relation(fields: [noteId], references: [id])
}

model Gamification {
  id           String   @id @default(uuid())
  userId       String   @unique
  points       Int      @default(0)
  level        Int      @default(1)
  streak       Int      @default(0)
  lastActivity DateTime?

  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Badge {
  id         String      @id @default(uuid())
  name       String      @unique
  description String
  criteria   String
  userBadges UserBadge[]
}

model UserBadge {
  userId    String
  badgeId   String
  unlockedAt DateTime @default(now())

  user      User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  badge     Badge  @relation(fields: [badgeId], references: [id])

  @@id([userId, badgeId])
}

model Follow {
  followerId  String
  followingId String
  createdAt   DateTime @default(now())

  follower    User @relation("follower",  fields: [followerId],  references: [id], onDelete: Cascade)
  following   User @relation("following", fields: [followingId], references: [id], onDelete: Cascade)

  @@id([followerId, followingId])
}

model Like {
  userId    String
  noteId    String
  createdAt DateTime @default(now())

  user      User @relation(fields: [userId], references: [id], onDelete: Cascade)
  note      Note @relation(fields: [noteId], references: [id], onDelete: Cascade)

  @@id([userId, noteId])
}

model Comment {
  id        String   @id @default(uuid())
  userId    String
  noteId    String
  content   String
  createdAt DateTime @default(now())

  user      User @relation(fields: [userId], references: [id], onDelete: Cascade)
  note      Note @relation(fields: [noteId], references: [id], onDelete: Cascade)
}
```

---

## 6. Padrões da API REST

### 6.1 Convenções de URL

- Recursos no plural, em inglês, minúsculas: `/users`, `/notes`, `/moods`.
- Prefixo de versão em todas as rotas: `/api/v1/...`.
- Sub-recursos aninhados quando há relação de posse: `/api/v1/notes/:id/comments`.
- Sem verbos na URL — o verbo é o método HTTP.

| Errado | Certo |
|--------|-------|
| `/api/v1/getNotes` | `GET /api/v1/notes` |
| `/api/v1/note` | `/api/v1/notes` |
| `/api/v1/createNote` | `POST /api/v1/notes` |

### 6.2 Métodos HTTP

| Método | Uso | Exemplo |
|--------|-----|---------|
| GET | Ler recurso(s). Nunca altera estado. | `GET /api/v1/notes` |
| POST | Criar recurso. | `POST /api/v1/notes` |
| PUT | Substituir recurso por completo. | `PUT /api/v1/notes/:id` |
| PATCH | Atualizar parcialmente. | `PATCH /api/v1/notes/:id` |
| DELETE | Remover recurso. | `DELETE /api/v1/notes/:id` |

### 6.3 Códigos de status HTTP

| Código | Quando usar |
|--------|-------------|
| 200 OK | Sucesso em GET, PUT, PATCH, DELETE com corpo. |
| 201 Created | Recurso criado com sucesso (POST). |
| 204 No Content | Sucesso sem corpo de resposta (ex.: DELETE). |
| 400 Bad Request | Entrada inválida — falha de validação Zod. |
| 401 Unauthorized | Falta de autenticação ou token inválido/expirado. |
| 403 Forbidden | Autenticado, mas sem permissão para o recurso. |
| 404 Not Found | Recurso não existe. |
| 409 Conflict | Conflito de estado (ex.: e-mail já cadastrado). |
| 500 Internal Server Error | Erro inesperado do servidor. |

### 6.4 Paginação, filtro e ordenação

Listagens usam query params padronizados, validados pelo `common.validator.ts`:

- Paginação: `?page=1&limit=20` (limite máximo: 100).
- Filtro: `?tag=trabalho&mood=4`.
- Ordenação: `?sort=createdAt&order=desc`.

A resposta de listagem inclui metadados de paginação (ver 7.1).

---

## 7. Padrão de respostas

### 7.1 Resposta de sucesso

```typescript
// Recurso único
{ success: true, data: NoteResponse }

// Listagem com paginação
{
  success: true,
  data: NoteListItem[],
  meta: {
    page: number,
    limit: number,
    total: number
  }
}
```

```json
// Exemplo — recurso único
{ "success": true, "data": { "id": "uuid", "title": "Meu dia" } }

// Exemplo — listagem
{
  "success": true,
  "data": [ ],
  "meta": { "page": 1, "limit": 20, "total": 137 }
}
```

### 7.2 Resposta de erro

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados de entrada inválidos.",
    "details": [
      { "field": "title", "message": "Título é obrigatório." }
    ]
  }
}
```

- `code`: string estável em `UPPER_SNAKE_CASE`, em inglês. Legível por máquina.
- `message`: mensagem amigável em português, voltada ao usuário final.
- `details`: opcional. Lista de erros por campo, gerada automaticamente pelo Zod.

### 7.3 Tratamento de erros

- Existe um único middleware de erro em `src/middlewares/error.middleware.ts`, registrado por último no Express.
- Services lançam erros usando classes de `src/errors/`. Cada classe define `statusCode` e `code`.
- O middleware captura qualquer erro, monta a resposta padrão e responde. Stack trace nunca vai ao cliente.
- Erros não previstos viram `500` com `code: "INTERNAL_ERROR"`.

```typescript
// src/errors/AppError.ts
export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message)
  }
}

// Uso no service
throw new NotFoundError('Anotação não encontrada.')
```

---

## 8. Documentação Swagger

### 8.1 Configuração

A documentação é gerada automaticamente via `swagger-jsdoc` a partir de anotações JSDoc nos arquivos de rotas. Acessível em `/api/docs` em desenvolvimento.

```typescript
// src/config/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc'

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Meu Diário API',
      version: '1.0.0',
      description: 'API REST do aplicativo Meu Diário',
    },
    servers: [{ url: '/api/v1' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
})
```

### 8.2 Anotação obrigatória por endpoint

Todo endpoint deve ter anotação JSDoc com `@swagger`. Exemplo mínimo:

```typescript
/**
 * @swagger
 * /notes:
 *   post:
 *     summary: Criar nova anotação
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateNoteDTO'
 *     responses:
 *       201:
 *         description: Anotação criada com sucesso
 *       400:
 *         description: Dados de entrada inválidos
 *       401:
 *         description: Não autenticado
 */
router.post('/', authenticate, validate(createNoteSchema), notesController.create)
```

---

## 9. Padrões de projeto adotados

| Padrão | Onde se aplica | Objetivo |
|--------|----------------|----------|
| Layered Architecture | Todo o backend | Separar responsabilidades, isolar mudanças. |
| Repository Pattern | Camada de repositories | Abstrair o acesso ao Prisma. |
| Service Layer | Camada de services | Concentrar regras de negócio em um só lugar. |
| Middleware (Chain of Responsibility) | Auth, validação, erros | Tratar preocupações transversais de forma componível. |
| DTO (Data Transfer Object) | Validators (entrada) e Models (saída) | Contratos explícitos entre cliente e API. |
| Centralized Error Handling | `error.middleware.ts` | Tratamento de erro único e consistente. |
| Singleton | `prisma.client.ts` | Uma única instância do PrismaClient na aplicação. |
| Environment Validation | `config/env.ts` com Zod | Falha rápida se variável obrigatória estiver ausente. |

### 9.1 Convenções de código TypeScript

- Nomes de arquivos: `recurso.camada.ts` (ex.: `notes.service.ts`).
- Funções e variáveis: `camelCase`, em inglês.
- Tipos, interfaces e classes: `PascalCase`.
- Constantes globais: `UPPER_SNAKE_CASE`.
- Funções de service são `async` e propagam erros via `throw`.
- Preferir `interface` para objetos extensíveis, `type` para unions e intersections.
- Sem `any` explícito. Usar `unknown` + type guard quando necessário.
- Uma função, uma responsabilidade.

### 9.2 Padrões de implementação por camada

#### P-14 — Repositories: Singleton PrismaClient

**Regra:** Toda repository importa o PrismaClient via singleton em `src/repositories/prisma.client.ts`, nunca instancia um novo `new PrismaClient()`.

**Correto:**
```typescript
// src/repositories/notes.repository.ts
import { prisma } from './prisma.client'

export async function findNoteById(noteId: string) {
  return await prisma.note.findUnique({ where: { id: noteId } })
}
```

**Incorreto:**
```typescript
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
```

**Benefício:** Uma única instância de conexão compartilhada em toda a aplicação, sem vazamento de recursos.

---

#### P-15 — Controllers: Sem try/catch, sem NextFunction

**Regra:** Controllers não usam `try/catch`. Erros propagam naturalmente para o middleware de erro central. Sem importar `NextFunction`. Controllers são exportados como objeto com métodos (não `export function`).

**Correto:**
```typescript
// src/controllers/notes.controller.ts
export const notesController = {
  async createNote(req: Request, res: Response): Promise<void> {
    const body = req.body as CreateNoteRequest
    const userId = req.userId!
    const note = await notesService.createNote(userId, body)
    sendSuccess(res, note, 201)
  },
}
```

#### P-19 — Estilo de código padronizado

- Ponto e vírgula obrigatório no fim das declarações
- Aspas simples, trailing comma em tudo, printWidth 100, indentação de 4 espaços
- O arquivo .prettierrc é a fonte da verdade da formatação
- Proibido deixar comentários de task/scaffolding do spec-kit no código final (ex: "// T0XX:", "// Placeholder", "// Scaffolding")
- Comentários apenas para lógica de negócio não óbvia e anotações @swagger

**Incorreto:**
```typescript
export async function createNote(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as CreateNoteRequest
    const note = await notesService.createNote(req.userId!, body)
    sendSuccess(res, note, 201)
  } catch (error) {
    next(error)
  }
}
```

**Benefício:** Reduz verbosidade, padroniza tratamento de erros através do middleware global.

---

#### P-16 — Models: Defina mappers com arrow functions

**Regra:** Todo mapper (função que transforma um tipo em outro) deve usar arrow function com `export const`, nunca `export function`.

**Correto:**
```typescript
// src/models/note.model.ts
export const toNoteDetail = (note: Note & { mood?: Mood }): NoteResponse => ({
  id: note.id,
  title: note.title,
  content: note.content,
  mood: note.mood?.value ?? null,
})

export const toNoteSummary = (note: Note): NoteSummaryResponse => ({
  id: note.id,
  title: note.title,
  excerpt: note.content?.substring(0, 150) ?? '',
})
```

**Incorreto:**
```typescript
export function toNoteDetail(note: Note): NoteResponse {
  return {
    id: note.id,
    title: note.title,
    content: note.content,
  }
}
```

**Benefício:** Consistência com a base de código, aparência mais moderna e funcional.

#### P-20 — Mappers: Transformações fora dos models

**Regra:** Funções de transformação de DTOs e respostas devem viver em `src/mappers/`, não em `src/models/`.

**Escopo:** Models ficam restritos a types, interfaces e reexports de tipos do Prisma. Services e controllers consomem mappers explicitamente quando precisarem converter entidades para respostas.

**Benefício:** Evita mistura de responsabilidades, facilita a manutenção das respostas e mantém a camada de model estritamente tipada.

### P-21 — Um repository por entidade

- Cada entidade do domínio tem seu próprio repository, responsável exclusivamente por operações de banco daquela entidade.
- Um repository NUNCA acessa ou manipula uma entidade que não é a sua, mesmo que exista relacionamento entre elas.
- Exemplos de fronteira correta:
  - `NotesRepository` -> apenas `Note`, `NoteTag`, `Tag`.
  - `CommentsRepository` -> apenas `Comment` e `CommentLike`.
  - `MoodsRepository` -> apenas `Mood`.
  - `UsersRepository` -> apenas `User` (inclui campos de gamificação no `User`).
  - `SocialRepository` -> apenas `Follow` e `Like` (relações sociais sobre `Note`).
- Quando um service precisa de dados de múltiplas entidades, ele orquestra chamadas a múltiplos repositories, sem um repository invadir o outro.
- Tags são exceção tratada como parte do agregado `Note`: a criação/vínculo de tags pode ocorrer dentro do `NotesRepository` por serem parte da transação de criação da nota.

### P-22 — Tipos nomeados para retornos de repositories

- Repositories não devem expor tipos inline complexos em assinaturas de métodos.
- Quando um método retornar um objeto composto, o formato deve ser descrito por um type/interface nomeado no módulo apropriado.
- Preferência de localização:
  - Tipos de saída do domínio em `src/models/` quando forem reaproveitáveis fora do repository.
  - Tipos específicos de infraestrutura no próprio arquivo do repository, se o formato não fizer sentido fora dele.
- A mesma regra vale para parâmetros compostos e helpers internos de service quando a assinatura ficar longa ou frágil.
- Assinaturas como `Promise<{ ... }>` e casts para `any` em bootstrap de repository devem ser substituídos por tipos nomeados.
- Objetivo: reduzir duplicação, facilitar leitura e evitar assinaturas longas e frágeis como `Promise<{ ... }>` espalhadas pelo código.

---

#### P-17 — Swagger: Formatação de anotações OpenAPI

**Regra:** Anotações `@swagger` devem usar `*` em cada linha (padrão JSDoc). Paths no swagger devem ser relativos (sem `/api/v1`), pois o servidor monta em `/api/v1`. Operações múltiplas no mesmo path (GET, PATCH, DELETE) são consolidadas em uma única anotação, não em 3 separadas.

**Correto:**
```typescript
/**
 * @swagger
 * /notes/{id}:
 *   parameters:
 *     - name: id
 *       in: path
 *       required: true
 *       schema:
 *         type: string
 *         format: uuid
 *   get:
 *     summary: Obter anotação por ID
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Anotação encontrada
 *   patch:
 *     summary: Atualizar anotação
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Anotação atualizada
 *   delete:
 *     summary: Deletar anotação
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Anotação deletada
 */
router.get('/:id', authenticate, notesController.getNoteById)
router.patch('/:id', authenticate, notesController.updateNote)
router.delete('/:id', authenticate, notesController.deleteNote)
```

**Incorreto:**
```typescript
/**
 @swagger
 /api/v1/notes/{id}:
   get:
     summary: Get note
 */
router.get('/:id', ...)

/**
 @swagger
 /api/v1/notes/{id}:
   patch:
     summary: Update note
 */
router.patch('/:id', ...)

/**
 @swagger
 /api/v1/notes/{id}:
   delete:
     summary: Delete note
 */
router.delete('/:id', ...)

---

#### P-18 — Services, Controllers e Repositories: Usar classes com injeção de dependência

**Regra:** Services, Controllers e Repositories são implementados como classes (não objetos literais ou funções). Dependências são injetadas via construtor. Instanciação ocorre no arquivo de rotas, nunca em singleton global. Classes são sempre exportadas com `export class`, nunca `export default class`.

**Correto:**
```typescript
// src/repositories/users.repository.ts
import { prisma } from './prisma.client'
import type { User } from '@/generated/prisma'

export class UsersRepository {
  async findByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({ where: { email } })
  }

  async findById(id: string): Promise<User | null> {
    return await prisma.user.findUnique({ where: { id } })
  }
}

// src/services/auth.service.ts
import { ConflictError, UnauthorizedError } from '@/errors'
import { hashPassword, comparePassword } from '@/utils/hash'
import type { UsersRepository } from '@/repositories/users.repository'
import type { AuthResponse } from '@/models/user.model'
import type { LoginDTO, RegisterDTO } from '@/validators/auth.validator'

export class AuthService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async register(input: RegisterDTO): Promise<AuthResponse> {
    const existing = await this.usersRepository.findByEmail(input.email)
    if (existing) throw new ConflictError('E-mail já cadastrado.')
    const passwordHash = await hashPassword(input.password)
    const user = await this.usersRepository.create({ ...input, passwordHash })
    return { id: user.id, email: user.email, token: signToken(user.id) }
  }

  async login(input: LoginDTO): Promise<AuthResponse> {
    const user = await this.usersRepository.findByEmail(input.email)
    if (!user || !(await comparePassword(input.password, user.passwordHash))) {
      throw new UnauthorizedError('Credenciais inválidas.')
    }
    return { id: user.id, email: user.email, token: signToken(user.id) }
  }
}

// src/controllers/auth.controller.ts
import type { Request, Response } from 'express'
import { sendSuccess } from '@/utils/response'
import type { AuthService } from '@/services/auth.service'

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async register(req: Request, res: Response): Promise<void> {
    const result = await this.authService.register(req.body)
    sendSuccess(res, result, 201)
  }

  async login(req: Request, res: Response): Promise<void> {
    const result = await this.authService.login(req.body)
    sendSuccess(res, result)
  }
}

// src/routes/auth.routes.ts
import { UsersRepository } from '@/repositories/users.repository'
import { AuthService } from '@/services/auth.service'
import { AuthController } from '@/controllers/auth.controller'

const usersRepository = new UsersRepository()
const authService = new AuthService(usersRepository)
const authController = new AuthController(authService)

router.post('/register', validate(registerSchema), (req, res) => authController.register(req, res))
router.post('/login', validate(loginSchema), (req, res) => authController.login(req, res))
```

**Incorreto:**
```typescript
// Usar objetos literais ou funções soltas
export const usersRepository = { ... }
export async function register() { ... }
```

**Benefício:** Estrutura mais consistente, compatível com padrões conhecidos (NestJS, Spring), facilita injeção de dependência para testes futuros, agrupamento natural de métodos relacionados.

**Exceções:** Validators (schemas Zod), Models (interfaces/types), Middlewares e Utils permanecem como funções/objetos — classes não agregam valor nessas camadas.

---

## 10. Segurança

- Senhas armazenadas apenas como hash bcrypt (nunca texto puro).
- JWT enviado no header `Authorization: Bearer <token>`.
- Payload do JWT contém apenas `{ userId, iat, exp }` — sem dados sensíveis.
- Segredos em variáveis de ambiente; `.env` no `.gitignore`. Validados na inicialização.
- Rotas protegidas passam pelo `auth.middleware.ts` antes do controller.
- Autorização por recurso: o service verifica se o `userId` do token é dono do recurso antes de qualquer operação de escrita ou exclusão.
- Nunca retornar stack trace ao cliente.

---

## 11. Como usar este documento na Fase 2

Na Fase 2, cada funcionalidade vira uma spec em `specs/spec-<nome>.md`:

- `spec-auth.md` — registro, login, refresh token, JWT.
- `spec-notes.md` — CRUD de anotações, tags, busca, filtros.
- `spec-moods.md` — registro de humor e agregações.
- `spec-gamification.md` — pontos, streaks, níveis, badges.
- `spec-social.md` — feed, curtidas, comentários, seguir.
- `spec-insights.md` — cálculos e relatórios.

Cada spec deve conter, no mínimo:

1. **Objetivo** — o que a funcionalidade entrega.
2. **Endpoints** — método, URL, autenticação requerida.
3. **Entrada** — schema Zod esperado (campos, tipos, validações).
4. **Saída** — DTO de resposta com tipos TypeScript.
5. **Erros** — erros possíveis com `code`, status e condição.
6. **Regras de negócio** — comportamento esperado, casos de borda.
7. **Prisma** — operações de banco envolvidas (create, findMany, etc.).
8. **Swagger** — descrição do endpoint para a documentação.
9. **Critérios de aceitação** — no estilo EARS: "Quando [condição], o sistema deve [comportamento]."

Toda spec referencia os princípios (`P-01`…`P-12`) que a sustentam.

---

## 12. Governança e versionamento deste documento

  - MAJOR: mudança que invalida specs ou código já existentes.
  - MINOR: adição de princípio ou seção sem quebrar o que existe.
  - PATCH: correção de texto, sem mudança de regra.
- Em conflito entre spec e este documento, este prevalece — salvo emenda formal.

## 13. Commits semânticos

**Nota de ambiente:** o hook `speckit.git.commit` não funciona neste projeto.
Usar sempre `git add . && git commit -m "..."` diretamente no terminal.

Após cada tarefa implementada ou correção aplicada, realize um commit
seguindo o padrão Conventional Commits:

```
<tipo>(<escopo>): <descrição em português, imperativo, máximo 72 chars>
```

**Tipos permitidos:**

| Tipo | Quando usar |
|------|-------------|
| feat | Nova funcionalidade |
| fix | Correção de bug |
| refactor | Mudança que não adiciona feature nem corrige bug |
| chore | Configuração, dependências, arquivos de build |
| docs | Documentação |
| style | Formatação, sem mudança de lógica |

**Escopo:** nome do módulo afetado — ex: `auth`, `notes`, `prisma`, `middleware`

**Exemplos:**
```
feat(auth): adicionar endpoint de registro com JWT e gamificação
fix(prisma): corrigir engineType para conexão local com PostgreSQL
refactor(auth): mover mappers para camada de models
chore(deps): adicionar adapter pg para Prisma 7
docs(spec): adicionar spec do módulo de anotações
```

**Regras:**
- Nunca agrupar múltiplas tarefas em um único commit
- A descrição descreve o que a mudança faz, não o que foi editado
- Commitar antes de passar para a próxima tarefa
- Commits de fix arquitetural usam `refactor`, não `fix`

## Histórico de versões

| Versão | Data | Alterações |
|--------|------|------------|
| 2.1.0 | 2026-05-28 | Adição do princípio P-13: commits semânticos obrigatórios. |

### Histórico de versões

| Versão | Data | Descrição |
|--------|------|-----------|
| 1.0.0 | 2025-05-27 | Versão inicial. JavaScript, sem ORM definido. |
| 2.0.0 | 2026-05-27 | Migração para TypeScript. ORM: Prisma. Validação: Zod. Docs: Swagger. Atores simplificados. Testes removidos do escopo. Models e Validators como camadas explícitas. |
