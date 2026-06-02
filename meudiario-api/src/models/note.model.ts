import type { Note as PrismaNote, Tag as PrismaTag, Mood as PrismaMood } from '@/generated/prisma';

export type Note = PrismaNote;
export type Tag = PrismaTag;
export type Mood = PrismaMood;

export interface NoteDetail {
    id: string;
    title: string;
    content?: string | null;
    tags: Tag[];
    mood?: Mood | null;
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
    owner: {
        id: string;
        username: string;
    };
}

