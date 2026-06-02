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

export interface LikeCountResponse {
    likeCount: number;
}
