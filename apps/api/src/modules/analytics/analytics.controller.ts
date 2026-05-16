import type { AnalyticsIngestRequestDto, AnalyticsIngestResponseDto } from './analytics.dto.js';
import type { AnalyticsService } from './analytics.service.js';

export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  async ingest(userId: string, request: AnalyticsIngestRequestDto): Promise<AnalyticsIngestResponseDto> {
    return this.analyticsService.ingest(userId, request);
  }
}

