import { Response } from 'express'
import { PaginationMeta } from './pagination'

export const sendSuccess = <T>(res: Response, data: T, statusCode = 200, meta?: PaginationMeta): void => {
  if (meta) {
    res.status(statusCode).json({ success: true, data, meta })
  } else {
    res.status(statusCode).json({ success: true, data })
  }
}

export const sendPaginated = <T>(
  res: Response,
  data: T[],
  meta: PaginationMeta
): void => {
  res.status(200).json({ success: true, data, meta })
}
