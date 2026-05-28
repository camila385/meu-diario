import type { Note as PrismaNote, Tag as PrismaTag, Mood as PrismaMood } from '@/generated/prisma'

// T006: Re-export Prisma types (P-12 compliance: models derived from Prisma)
export type Note = PrismaNote
export type Tag = PrismaTag
export type Mood = PrismaMood

/**
 * Note Summary DTO (returned by list endpoint)
 * Fields: id, title, excerpt, tags, mood, isPublic, createdAt
 */
export interface NoteSummary {
  id: string
  title: string
  excerpt: string
  tags: Tag[]
  mood?: Mood | null
  isPublic: boolean
  createdAt: Date
}

/**
 * Note Detail DTO (returned by create, get detail, update endpoints)
 * Fields: id, title, content, tags, mood, isPublic, createdAt, updatedAt, owner
 */
export interface NoteDetail {
  id: string
  title: string
  content?: string | null
  tags: Tag[]
  mood?: Mood | null
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
  owner: {
    id: string
    username: string
  }
}

/**
 * Compute excerpt from note content
 * - First 150 characters of content
 * - Trimmed to word boundary
 * - Returns empty string if content is empty
 */
export function computeExcerpt(content?: string | null): string {
  if (!content || content.trim().length === 0) {
    return ''
  }
  const maxLength = 150
  if (content.length <= maxLength) {
    return content
  }
  const truncated = content.substring(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')
  const trimmed = lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated
  return trimmed + '...'
}

/**
 * Map Prisma Note + relations to NoteSummary DTO
 */
export function toNoteSummary(
  note: PrismaNote & { noteTags?: Array<{ tag: Tag }> | undefined }
): NoteSummary {
  const tags = note.noteTags?.map((link) => link.tag) ?? []
  return {
    id: note.id,
    title: note.title,
    excerpt: computeExcerpt(note.content),
    tags,
    mood: undefined, // Populated by service layer if needed
    isPublic: note.isPublic,
    createdAt: note.createdAt,
  }
}

/**
 * Map Prisma Note + relations to NoteDetail DTO
 */
export function toNoteDetail(
  note: PrismaNote & {
    user?: { id: string; username: string }
    noteTags?: Array<{ tag: Tag }> | undefined
    mood?: Mood | null
  }
): NoteDetail {
  const tags = note.noteTags?.map((link) => link.tag) ?? []
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
  }
}
