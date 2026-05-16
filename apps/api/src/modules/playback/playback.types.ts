export interface PlaybackProgressRow {
  id: string;
  userId: string;
  audiobookId: string;
  chapterId: string;
  positionMs: number;
  completed: boolean;
  lastPlayedAt: Date | null;
  updatedAt: Date;
}

