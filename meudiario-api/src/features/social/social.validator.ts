import { z } from 'zod'

export const reportSchema = z.object({
  reporterId: z.string().uuid(),
  targetType: z.enum(['note', 'comment', 'user']),
  targetId: z.string(),
  reason: z.string().min(1).max(500),
})

export type CreateReportDTO = z.infer<typeof reportSchema>
