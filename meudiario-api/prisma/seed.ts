import { prisma } from '../src/repositories/prisma.client';

const levels = [
    { level: 1, name: 'Iniciante', minimumPoints: 0 },
    { level: 2, name: 'Aprendiz', minimumPoints: 100 },
    { level: 3, name: 'Explorador', minimumPoints: 300 },
    { level: 4, name: 'Escritor', minimumPoints: 600 },
    { level: 5, name: 'Narrador', minimumPoints: 1000 },
    { level: 6, name: 'Cronista', minimumPoints: 1500 },
    { level: 7, name: 'Memorialista', minimumPoints: 2200 },
    { level: 8, name: 'Guardião', minimumPoints: 3000 },
    { level: 9, name: 'Mestre', minimumPoints: 4000 },
    { level: 10, name: 'Lendário', minimumPoints: 5500 },
];

const badges = [
    {
        id: 'first-note',
        code: 'first-note',
        name: 'Primeira Palavra',
        description: 'Criar a primeira anotação.',
        kind: 'notes-count',
        threshold: 1,
        criteria: 'notes-count:1',
    },
    {
        id: 'streak-7',
        code: 'streak-7',
        name: 'Uma Semana',
        description: 'Manter streak de 7 dias.',
        kind: 'streak',
        threshold: 7,
        criteria: 'streak:7',
    },
    {
        id: 'streak-30',
        code: 'streak-30',
        name: 'Um Mês',
        description: 'Manter streak de 30 dias.',
        kind: 'streak',
        threshold: 30,
        criteria: 'streak:30',
    },
    {
        id: 'streak-100',
        code: 'streak-100',
        name: 'Cem Dias',
        description: 'Manter streak de 100 dias.',
        kind: 'streak',
        threshold: 100,
        criteria: 'streak:100',
    },
    {
        id: 'notes-10',
        code: 'notes-10',
        name: 'Dez Histórias',
        description: 'Criar 10 anotações.',
        kind: 'notes-count',
        threshold: 10,
        criteria: 'notes-count:10',
    },
    {
        id: 'notes-50',
        code: 'notes-50',
        name: 'Cinquenta Capítulos',
        description: 'Criar 50 anotações.',
        kind: 'notes-count',
        threshold: 50,
        criteria: 'notes-count:50',
    },
    {
        id: 'notes-100',
        code: 'notes-100',
        name: 'Centenário',
        description: 'Criar 100 anotações.',
        kind: 'notes-count',
        threshold: 100,
        criteria: 'notes-count:100',
    },
    {
        id: 'level-5',
        code: 'level-5',
        name: 'Meio Caminho',
        description: 'Atingir nível 5.',
        kind: 'level',
        threshold: 5,
        criteria: 'level:5',
    },
    {
        id: 'level-10',
        code: 'level-10',
        name: 'Lendário',
        description: 'Atingir nível 10.',
        kind: 'level',
        threshold: 10,
        criteria: 'level:10',
    },
    {
        id: 'mood-7',
        code: 'mood-7',
        name: 'Semana Emocional',
        description: 'Registrar humor 7 dias seguidos.',
        kind: 'mood-streak',
        threshold: 7,
        criteria: 'mood-streak:7',
    },
];

async function main(): Promise<void> {
    for (const level of levels) {
        await prisma.level.upsert({
            where: { level: level.level },
            update: level,
            create: level,
        });
    }

    for (const badge of badges) {
        await prisma.$executeRaw`
            INSERT INTO "Badge" ("id", "code", "name", "description", "criteria", "kind", "threshold")
            VALUES (${badge.id}, ${badge.code}, ${badge.name}, ${badge.description}, ${badge.criteria}, ${badge.kind}, ${badge.threshold})
            ON CONFLICT ("code") DO UPDATE SET
                "id" = EXCLUDED."id",
                "name" = EXCLUDED."name",
                "description" = EXCLUDED."description",
                "criteria" = EXCLUDED."criteria",
                "kind" = EXCLUDED."kind",
                "threshold" = EXCLUDED."threshold"
        `;
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (error) => {
        console.error(error);
        await prisma.$disconnect();
        process.exit(1);
    });
