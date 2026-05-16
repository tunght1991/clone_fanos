import type { PlaybackProgressDto, PlaybackProgressRequestDto } from './playback.dto.js';
import type { PlaybackService } from './playback.service.js';

export class PlaybackController {
  constructor(private readonly playbackService: PlaybackService) {}

  async saveProgress(userId: string, request: PlaybackProgressRequestDto): Promise<PlaybackProgressDto> {
    return this.playbackService.saveProgress(userId, request);
  }

  async getProgress(userId: string, audiobookId: string): Promise<PlaybackProgressDto | null> {
    return this.playbackService.getProgress(userId, audiobookId);
  }
}

