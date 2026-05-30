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

export const toISO8601 = (date: Date | string): string => {
    if (typeof date === 'string') {
        return date;
    }
    return date.toISOString();
};

export default {
    computeExcerpt,
    toISO8601,
};
