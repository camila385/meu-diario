import type { InsightsRepository } from '@/repositories/insights.repository';
import type { OverviewResponse } from '@/models/insights.model';

export class InsightsService {
    constructor(private readonly insightsRepository: InsightsRepository) {}

    findCalendarDays(userId: string, year: number, month: number) {
        return this.insightsRepository.findCalendarDays(userId, year, month);
    }

    async findWeekdayCounts(userId: string) {
        const rows = await this.insightsRepository.findWeekdayCounts(userId);
        const map = new Map(rows.map((r) => [r.weekday, r.count]));
        return Array.from({ length: 7 }, (_, d) => ({ weekday: d, count: map.get(d) ?? 0 }));
    }

    getOverview(userId: string): Promise<OverviewResponse> {
        return this.insightsRepository.findOverviewMetrics(userId);
    }
}
