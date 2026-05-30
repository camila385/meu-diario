import type { User, Note, Follow, Like, Comment } from '@/generated/prisma';

// ====== Re-exports of Prisma types ======

export type { User, Note, Follow, Like, Comment };

// ====== Feed Item Response DTO ======

export interface FeedItemResponse {
    id: string;
    title: string;
    excerpt: string; // first 150 chars of content
    tags: string[];
    author: {
        id: string;
        username: string;
        avatarUrl: string | null;
    };
    likeCount: number;
    commentCount: number;
    createdAt: string; // ISO8601
}

// ====== Pagination Metadata ======

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
}

export interface FeedResponse {
    success: boolean;
    data: FeedItemResponse[];
    meta: PaginationMeta;
}

// ====== Follow User Response DTO ======

export interface FollowUserResponse {
    id: string;
    username: string;
    avatarUrl: string | null;
    isPublic: boolean;
}

export interface FollowListResponse {
    success: boolean;
    data: FollowUserResponse[];
    meta: PaginationMeta;
}

// ====== Comment Response DTOs ======

export interface CommentDetailResponse {
    id: string;
    content: string;
    author: {
        id: string;
        username: string;
        avatarUrl: string | null;
    };
    createdAt: string; // ISO8601
    likesCount: number;
    likedByMe: boolean;
}

export interface CommentListResponse {
    success: boolean;
    data: CommentDetailResponse[];
    meta: PaginationMeta;
}

export interface CreateCommentResponse {
    success: boolean;
    data: CommentDetailResponse;
}

// ====== Profile Response DTOs ======

export interface ProfileDetailResponse {
    id: string;
    username: string;
    avatarUrl: string | null;
    isPublic: boolean;
    followerCount: number; // total count including private followers
    followingCount: number; // total count including private following
    publicNoteCount: number; // count of notes where isPublic = true
    isFollowing: boolean; // is authenticated user following this profile?
}

// ====== Report Response DTO ======

export interface ReportResponse {
    success: boolean;
    data: {
        id: string;
        createdAt: string; // ISO8601
    };
}

// ====== Like Response DTO ======

export interface LikeCountResponse {
    success: boolean;
    data: {
        likeCount: number;
    };
}

// ====== Helper: Excerpt Truncation ======

export const computeExcerpt = (content: string | null | undefined): string => {
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

// ====== Helper: Format Date to ISO8601 ======

export const toISO8601 = (date: Date | string): string => {
    if (typeof date === 'string') return date;
    return date.toISOString();
};
