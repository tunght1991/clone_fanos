import type { NotificationHomeResponseDto } from './notification.dto.js';
import type { NotificationService } from './notification.service.js';

export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  async getHome(userId: string): Promise<NotificationHomeResponseDto> {
    return this.notificationService.getHome(userId);
  }
}
