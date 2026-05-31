# Sistema de Moods (Humores) — Arquitetura e Fluxos

## Visão Geral

O módulo de **Moods** gerencia registros emocionais do usuário com escala de 1 a 5 (muito ruim → muito bom). Ele suporta:
- Registros independentes de humor para cada dia
- Associação opcional de humor a uma nota específica
- Histórico paginado com filtros de data
- Resumos semanais e mensais com agregações

## Modelo de Dados

### Entidade Mood (Prisma)

```prisma
model Mood {
  id        String   @id @default(uuid())
  userId    String
  noteId    String?  @unique      // Cada nota vinculada a no máximo 1 humor
  value     Int                   // 1-5: escala de humor
  date      DateTime @default(now())
  createdAt DateTime @default(now())

  user  User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  note  Note?  @relation(fields: [noteId], references: [id], onDelete: Cascade)

  @@unique([userId, date])        // Um humor por usuário por dia
}
```

### Constraints Críticas

1. **`@@unique([userId, date])`**: Um usuário pode ter **no máximo UM registro de humor por dia**
   - A data é sempre normalizada para UTC midnight
   - Garante unicidade diária

2. **`noteId @unique`**: Uma nota está vinculada a **no máximo UM Mood**
   - Não há múltiplos moods por nota
   - Moods podem existir sem nota (independentes)

## Fluxos de Criação de Moods

### Fluxo 1: Criar Humor via Endpoint de Moods (`POST /api/v1/moods`)

**Entrada:**
```json
{
  "value": 4,
  "noteId": "uuid-optional"
}
```

**Processo (MoodsService.createMood):**

1. Normaliza a data para UTC midnight
2. Verifica se já existe humor para aquele dia
3. Se `noteId` foi enviado:
   - Valida ownership: nota deve pertencer ao userId autenticado
   - Verifica se já há outro humor vinculado a essa nota
4. **Upsert**: atualiza se existe, cria se não
   - Se atualiza: preserva `noteId` antigo, a menos que novo seja enviado
   
**Resposta (201 ou 200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "value": 4,
    "date": "2026-05-31T00:00:00Z",
    "noteId": "uuid-optional"
  }
}
```

### Fluxo 2: Criar Humor ao Criar Nota (`POST /api/v1/notes`)

**Entrada:**
```json
{
  "title": "Meu dia",
  "content": "...",
  "mood": 5,
  "tags": []
}
```

**Processo (NotesRepository.createNote):**

1. Cria o note com `userId`, `title`, `content`
2. Se `input.mood` existe:
   - Cria um novo Mood record com `value: input.mood` e `noteId: note.id`
   - Não faz validação de conflito com humor existente
3. Cria tags se informadas
4. Gamificação é acionada

**⚠️ Consideração:** Se o usuário já tinha registrado um humor para hoje:
- **Hoje**: Cria novo Mood com a nota (violará `@@unique([userId, date])`!)
- **Comportamento atual**: Erro na transação
- **Comportamento ideal**: Deveria fazer upsert ao invés de create

### Fluxo 3: Atualizar Nota com Mood (`PATCH /api/v1/notes/{id}`)

**Entrada:**
```json
{
  "title": "Título atualizado",
  "mood": 3
}
```

**Processo (NotesRepository.updateNote):**

1. Atualiza o note
2. Se `input.mood` é undefined: não modifica Mood
3. Se `input.mood` é definido:
   - Delete Mood existente
   - Cria novo Mood com aquele value

**⚠️ Risco:** Se o Mood antigo tinha associação a outra nota, a referência é perdida

## DTOs e Tipos

### CreateMoodRequest
```typescript
{
  value: number;        // 1-5
  noteId?: string;      // UUID opcional
}
```

### MoodResponse
```typescript
{
  id: string;
  value: number;
  date: string;         // ISO datetime
  noteId: string | null;
}
```

### MoodHistoryItem
Idêntico a `MoodResponse`, retornado em listagens com paginação.

### WeeklySummary
```typescript
{
  days: Array<number | null>;  // 7 posições, indices 0-6 (antigo→hoje)
  average: number | null;      // Média dos dias com registro
  count: number;               // Total de dias com registro
}
```

### MonthlySummary
```typescript
{
  days: Array<number | null>;     // Uma posição por dia do mês
  average: number | null;
  count: number;
  mostFrequent: number | null;    // Humor mais frequente
}
```

## Endpoints

### Registrar/Atualizar Humor do Dia
```
POST /api/v1/moods
Authorization: Bearer {token}

Body:
{
  "value": 4,
  "noteId": "optional-uuid"
}

Response: 201 Created or 200 OK
{
  "success": true,
  "data": { MoodResponse }
}
```

**Comportamento:**
- Se já existe humor para hoje: atualiza (upsert)
- Se `noteId` novo: valida ownership da nota

### Listar Histórico
```
GET /api/v1/moods/history?page=1&limit=20&dateFrom=...&dateTo=...
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "data": [ MoodHistoryItem[] ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45
  }
}
```

**Filtros:**
- `page`, `limit`: paginação
- `dateFrom`, `dateTo`: intervalo ISO datetime (inclusive ambos)

### Resumo Semanal
```
GET /api/v1/moods/summary/weekly
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "data": { WeeklySummary }
}
```

**Notas:**
- Sempre retorna 7 dias a partir de hoje (índice 0) até 6 dias atrás
- Dias sem registro têm `null`

### Resumo Mensal
```
GET /api/v1/moods/summary/monthly?year=2026&month=5
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "data": { MonthlySummary }
}
```

## Fluxo de Dados

```
┌─────────────────────────────────┐
│   Notes ou Moods Endpoint       │
└────────────┬────────────────────┘
             │
             ▼
     ┌──────────────┐
     │  Validator   │  (Zod)
     │  - Range 1-5 │
     │  - UUID      │
     └──────┬───────┘
            │
            ▼
      ┌───────────┐
      │  Service  │  Regra de negócio:
      │  Layer    │  - Upsert (moods)
      │           │  - Ownership check
      └──────┬────┘
             │
             ▼
      ┌────────────────┐
      │  Repository    │  Transações Prisma
      │  Layer         │  - Create/Update Mood
      │                │  - Manage Tags (notes)
      └────────┬───────┘
               │
               ▼
        ┌─────────────────┐
        │  Prisma Client  │
        │  (SQLite/PgSQL) │
        └────────┬────────┘
                 │
                 ▼
        ┌─────────────────┐
        │   PostgreSQL    │  @@unique constraints
        │   Database      │  FK relations
        └─────────────────┘
```

## Sincronização Notas ↔ Moods

### Cenário 1: Note é criada com Mood
```
1. POST /notes { title, mood: 5 }
2. NotesRepository.createNote() cria Note + Mood(noteId=note.id, value=5)
3. Gamificação é acionada
4. Response retorna note com mood embarcado
```

### Cenário 2: Atualizar Mood da Nota via Notes Endpoint
```
1. PATCH /notes/{id} { mood: 3 }
2. NotesRepository.updateNote()
   - DELETE Mood antigo (se existir)
   - CREATE novo Mood com value=3
3. Note continua a mesma, apenas Mood muda
```

### Cenário 3: Gerenciar Mood Independente (Recomendado)
```
1. POST /moods { value: 4 }
   - Cria/atualiza Mood para hoje SEM associar nota
2. Notas podem ter seu próprio Mood em um dia diferente
3. OU: POST /moods { value: 4, noteId: "xyz" }
   - Cria Mood vinculado à nota
```

**⚠️ Aviso**: Não há proteção contra criar note com mood E depois tentar createMood via endpoint no mesmo dia. Isso resultará em erro de constraint.

## Regras de Negócio Implementadas

✅ **Um humor por dia por usuário**
- Constraint `@@unique([userId, date])`
- Data normalizada para UTC midnight

✅ **Upsert automático em Moods endpoint**
- Se existe: atualiza value e noteId (se novo)
- Se não existe: cria novo record

✅ **Validação de Ownership**
- Ao vincular mood a nota: nota deve pertencer ao userId autenticado

✅ **Uma nota por Mood**
- Constraint `noteId @unique`
- Previne múltiplos records de humor por nota

✅ **Resumos com null para dias sem registro**
- WeeklySummary: array[7] com null onde não há record
- MonthlySummary: array[dias_do_mês] com null

⚠️ **Não implementado** (requer clarificação de spec)
- Tratamento de conflito: NotePosta com mood + CreateMood mesmo dia
- Permitir desvincular notebook de Mood (remover noteId em upsert)

## Validações em Camadas

### Validator (Zod)
- `value`: integer 1-5
- `noteId`: UUID ou undefined
- Query filters: dateFrom/dateTo ISO datetime

### Service
- Ownership: `moodsRepository.findNoteOwner(noteId)` verifica userId
- Conflito de tags: não aplicável a moods
- Duação: `new Date(query.dateFrom).setHours(0, 0, 0, 0)` = UTC midnight

### Repository
- Transações: garante atomicidade
- Unique constraints: deixa DB enforçar
- Queries: select mínimo de colunas necessárias

### Database
- Primary key: `id @id @default(uuid())`
- Unique indexes: `@@unique([userId, date])`, `noteId @unique`
- Foreign keys: com `onDelete: Cascade`

## Exemplo de Fluxo Completo

```typescript
// 1. Criar note com mood
const note = await notesRepository.createNote(userId, {
  title: "Dia feliz",
  content: "...",
  mood: 5,      // Cria Mood(userId, date, value=5, noteId=note.id)
  tags: []
});

// 2. Listar moods do mês
const monthly = await moodsService.monthlySummary(userId, {
  year: 2026,
  month: 5
});
// → { days: [...], average: 4.2, count: 20, mostFrequent: 5 }

// 3. Atualizar mood da nota
const updated = await notesRepository.updateNote(noteId, {
  mood: 4      // DELETE Mood antigo, CREATE novo com value=4
});

// 4. Registrar humor independente outro dia
const mood = await moodsService.createMood(userId, {
  value: 3
  // Sem noteId → humor independente
});
```

## Próximos Passos

1. **Clarificar conflito**: Note + Mood mesmo dia → erro OU upsert automático?
2. **Adicionar testes**: Validar upsert, constraints, edge cases
3. **Documentar API**: Atualizar Swagger com exemplos
4. **Performance**: Considerar índices adicionais se muitos moods por usuário
5. **Migração**: Caso haja dados legados, validar transição para a nova constraint

---

*Última atualização: 31 de maio de 2026*
*Versão: 1.0 — Arquitetura Estável*
