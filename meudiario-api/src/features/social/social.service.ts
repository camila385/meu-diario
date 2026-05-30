import type { CreateReportDTO } from './social.validator';
import { SocialRepository } from './social.repository';

export class SocialService {
    private repo = new SocialRepository();

    async createReport(dto: CreateReportDTO) {
        return this.repo.createReport(dto);
    }
}
