import type { Request, Response, NextFunction } from 'express'
import { SocialService } from './social.service'

export class SocialController {
  private service = new SocialService()

  async createReport(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = req.body
      const result = await this.service.createReport(dto)
      return res.status(201).json({ success: true, data: result })
    } catch (err) {
      next(err)
    }
  }
}
