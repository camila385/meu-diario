import { PrismaClient } from '@prisma/client';
import type { CreateReportDTO } from './social.validator';

const prisma = new PrismaClient();

export class SocialRepository {
    async createReport(dto: CreateReportDTO) {
        const r = await prisma.report.create({
            data: {
                reporterId: dto.reporterId,
                targetType: dto.targetType,
                targetId: dto.targetId,
                reason: dto.reason,
            },
        });

        return { id: r.id, createdAt: r.createdAt };
    }
}
