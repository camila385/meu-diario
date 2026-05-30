import type { User, Note, Follow, Like, Comment } from '@/generated/prisma';

export type { User, Note, Follow, Like, Comment };

export interface FeedItemResponse {
    id: string;
    title: string;
    excerpt: string;
    tags: string[];
    author: {
        id: string;
        username: string;
        avatarUrl: string | null;
    };
    likeCount: number;
    commentCount: number;
    createdAt: string;
}

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

export interface CommentDetailResponse {
    id: string;
    content: string;
    author: {
        id: string;
        username: string;
        avatarUrl: string | null;
    };
    createdAt: string;
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

export interface ProfileDetailResponse {
    id: string;
    username: string;
    avatarUrl: string | null;
    isPublic: boolean;
    followerCount: number;
    followingCount: number;
    publicNoteCount: number;
    isFollowing: boolean;
}

export interface ReportResponse {
    success: boolean;
    data: {
        id: string;
        createdAt: string;
    };
}

export interface LikeCountResponse {
    success: boolean;
    data: {
        likeCount: number;
    };
}
