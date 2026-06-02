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
    { id: 'first-note',  code: 'first-note',  name: 'Primeira Palavra',      description: 'Criar a primeira anotação.',        kind: 'notes-count', threshold: 1   },
    { id: 'notes-10',   code: 'notes-10',    name: 'Dez Histórias',          description: 'Criar 10 anotações.',               kind: 'notes-count', threshold: 10  },
    { id: 'notes-50',   code: 'notes-50',    name: 'Cinquenta Capítulos',    description: 'Criar 50 anotações.',               kind: 'notes-count', threshold: 50  },
    { id: 'notes-100',  code: 'notes-100',   name: 'Centenário',             description: 'Criar 100 anotações.',              kind: 'notes-count', threshold: 100 },
    { id: 'streak-7',   code: 'streak-7',    name: 'Uma Semana',             description: 'Manter streak de 7 dias.',          kind: 'streak',      threshold: 7   },
    { id: 'streak-30',  code: 'streak-30',   name: 'Um Mês',                 description: 'Manter streak de 30 dias.',         kind: 'streak',      threshold: 30  },
    { id: 'streak-100', code: 'streak-100',  name: 'Cem Dias',               description: 'Manter streak de 100 dias.',        kind: 'streak',      threshold: 100 },
    { id: 'level-5',    code: 'level-5',     name: 'Meio Caminho',           description: 'Atingir nível 5.',                  kind: 'level',       threshold: 5   },
    { id: 'level-10',   code: 'level-10',    name: 'Lendário',               description: 'Atingir nível 10.',                 kind: 'level',       threshold: 10  },
    { id: 'mood-7',     code: 'mood-7',      name: 'Semana Emocional',       description: 'Registrar humor em 7 ocasiões.',    kind: 'mood-count',  threshold: 7   },
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
        await prisma.badge.upsert({
            where: { code: badge.code },
            create: badge,
            update: {
                name: badge.name,
                description: badge.description,
                kind: badge.kind,
                threshold: badge.threshold,
            },
        });
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
