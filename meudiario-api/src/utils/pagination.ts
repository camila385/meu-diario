export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
}

export const getPaginationParams = (page = 1, limit = 20): PaginationParams => ({
  page: Math.max(1, page),
  limit: Math.min(100, Math.max(1, limit)),
})

export const getPrismaSkipTake = (params: PaginationParams) => ({
  skip: (params.page - 1) * params.limit,
  take: params.limit,
})

export const buildMeta = (params: PaginationParams, total: number): PaginationMeta => ({
  page: params.page,
  limit: params.limit,
  total,
})
