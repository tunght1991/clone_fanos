import type { ContentRepositoryBundle } from '../content/content.repository.js';
import type { EngagementRepositoryBundle } from '../engagement/engagement.repository.js';
import type { PlaybackRepositoryBundle, RecentPlaybackSummaryRow } from '../playback/playback.repository.js';
import type { NotificationHomeResponseDto, NotificationResumeReminderDto } from './notification.dto.js';
import { NOTIFICATION_HOME_WINDOW_DAYS } from './notification.dto.js';

export interface NotificationServiceDependencies {
  contentRepositories: ContentRepositoryBundle;
  engagementRepositories: EngagementRepositoryBundle;
  playbackRepositories: PlaybackRepositoryBundle;
  clock?: () => Date;
}

interface ReminderCandidate {
  progress: RecentPlaybackSummaryRow;
  engagementCount: number;
}

export class NotificationService {
  constructor(private readonly dependencies: NotificationServiceDependencies) {}

  async getHome(userId: string): Promise<NotificationHomeResponseDto> {
    const now = this.dependencies.clock?.() ?? new Date();
    const windowStart = new Date(now.getTime() - NOTIFICATION_HOME_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    const [recentProgress, bookmarks, favorites, notes] = await Promise.all([
      this.dependencies.playbackRepositories.progressRepository.listRecentByUser(userId, 10),
      this.dependencies.engagementRepositories.bookmarkRepository.listBookmarks(userId, {
        page: 1,
        pageSize: 50,
      }),
      this.dependencies.engagementRepositories.favoriteRepository.listFavorites(userId, {
        page: 1,
        pageSize: 50,
      }),
      this.dependencies.engagementRepositories.noteRepository.listNotes(userId, {
        page: 1,
        pageSize: 50,
      }),
    ]);

    const engagementCounts = new Map<string, number>();
    for (const row of [...bookmarks.data, ...favorites.data, ...notes.data]) {
      if (row.createdAt < windowStart) {
        continue;
      }

      engagementCounts.set(row.audiobookId, (engagementCounts.get(row.audiobookId) ?? 0) + 1);
    }

    const candidates = recentProgress
      .filter((row) => row.lastPlayedAt >= windowStart)
      .filter((row) => !row.completed)
      .filter((row) => row.totalDurationMs > 0 && row.positionMs < row.totalDurationMs)
      .map<ReminderCandidate | null>((progress) => {
        if (!progress.lastPlayedAt) {
          return null;
        }

        return {
          progress,
          engagementCount: engagementCounts.get(progress.audiobookId) ?? 0,
        };
      })
      .filter((candidate): candidate is ReminderCandidate => candidate !== null)
      .sort((left, right) => {
        if (right.engagementCount !== left.engagementCount) {
          return right.engagementCount - left.engagementCount;
        }

        const rightLastPlayedAt = right.progress.lastPlayedAt?.getTime() ?? 0;
        const leftLastPlayedAt = left.progress.lastPlayedAt?.getTime() ?? 0;
        if (rightLastPlayedAt !== leftLastPlayedAt) {
          return rightLastPlayedAt - leftLastPlayedAt;
        }

        if (right.progress.positionMs !== left.progress.positionMs) {
          return right.progress.positionMs - left.progress.positionMs;
        }

        return left.progress.audiobookTitle.localeCompare(right.progress.audiobookTitle);
      });

    const reminder = await selectBestReminder(
      candidates,
      this.dependencies.contentRepositories,
    );

    return {
      data: {
        resumeReminder: reminder,
      },
      meta: {
        generatedAt: now.toISOString(),
        windowDays: NOTIFICATION_HOME_WINDOW_DAYS,
      },
    };
  }
}

async function selectBestReminder(
  candidates: ReminderCandidate[],
  contentRepositories: ContentRepositoryBundle,
): Promise<NotificationResumeReminderDto | null> {
  for (const candidate of candidates) {
    const audiobook = await contentRepositories.audiobookRepository.findPublishedById(
      candidate.progress.audiobookId,
    );
    if (!audiobook) {
      continue;
    }

    const chapter = await contentRepositories.chapterRepository.findById(candidate.progress.chapterId);
    if (!chapter || chapter.audiobookId !== audiobook.id || chapter.status !== 'published') {
      continue;
    }

    return {
      audiobookId: audiobook.id,
      chapterId: chapter.id,
      title: audiobook.title,
      subtitle: `Resume ${chapter.title} at ${formatPosition(candidate.progress.positionMs)}`,
      progressMs: candidate.progress.positionMs,
      lastActivityAt: candidate.progress.lastPlayedAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  return null;
}

function formatPosition(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
