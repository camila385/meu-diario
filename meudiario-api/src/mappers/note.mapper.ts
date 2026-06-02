import type { Note as PrismaNote } from '@/generated/prisma';
import type { NoteDetail, Tag, Mood } from '@/models/note.model';

export const toNoteDetail = (note: PrismaNote & {
    user?: { id: string; username: string };
    noteTags?: Array<{ tag: Tag }> | undefined;
    mood?: Mood | null;
}): NoteDetail => {
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
    toNoteDetail,
};
