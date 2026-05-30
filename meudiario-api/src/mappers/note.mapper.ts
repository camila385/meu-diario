import type { Note as PrismaNote, Tag as PrismaTag, Mood as PrismaMood } from '@/generated/prisma';
import type { NoteSummary, NoteDetail, Tag, Mood } from '@/models/note.model';

export const computeExcerpt = (content?: string | null): string => {
    if (!content || content.trim().length === 0) {
        return '';
    }
    const maxLength = 150;
    if (content.length <= maxLength) {
        return content;
    }
    const truncated = content.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    const trimmed = lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated;
    return trimmed + '...';
};

export const toNoteSummary = (
    note: PrismaNote & { noteTags?: Array<{ tag: Tag }> | undefined },
): NoteSummary => {
    const tags = note.noteTags?.map((link) => link.tag) ?? [];
    return {
        id: note.id,
        title: note.title,
        excerpt: computeExcerpt(note.content),
        tags,
        mood: undefined,
        isPublic: note.isPublic,
        createdAt: note.createdAt,
    };
};

export const toNoteDetail = (
    note: PrismaNote & {
        user?: { id: string; username: string };
        noteTags?: Array<{ tag: Tag }> | undefined;
        mood?: Mood | null;
    },
): NoteDetail => {
    const tags = note.noteTags?.map((link) => link.tag) ?? [];
    return {
        id: note.id,
        title: note.title,
        content: note.content,
        tags,
        mood: note.mood ?? undefined,
        isPublic: note.isPublic,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        owner: {
            id: note.user?.id ?? note.userId,
            username: note.user?.username ?? 'Unknown',
        },
    };
};

export default {
    computeExcerpt,
    toNoteSummary,
    toNoteDetail,
};
