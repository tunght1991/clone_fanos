import type { RetentionHomeResponseDto } from './retention.dto.js';
import type { RetentionService } from './retention.service.js';

export class RetentionController {
  constructor(private readonly retentionService: RetentionService) {}

  async getHome(userId: string): Promise<RetentionHomeResponseDto> {
    return this.retentionService.getHome(userId);
  }
}
