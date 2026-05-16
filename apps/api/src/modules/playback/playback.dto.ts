export interface PlaybackProgressRequestDto {
  audiobookId: string;
  chapterId: string;
  positionMs: number;
  completed?: boolean;
}

export interface PlaybackProgressDto {
  id: string;
  userId: string;
  audiobookId: string;
  chapterId: string;
  positionMs: number;
  completed: boolean;
  lastPlayedAt: string | null;
  updatedAt: string;
}

