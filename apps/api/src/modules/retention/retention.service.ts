import type { ContentRepositoryBundle } from '../content/content.repository.js';
import type { EngagementRepositoryBundle } from '../engagement/engagement.repository.js';
import type { PlaybackRepositoryBundle } from '../playback/playback.repository.js';
import type {
  RetentionHomeResponseDto,
  RetentionRecommendationDto,
  RetentionRecommendationReasonType,
  RetentionWeeklySummaryDto,
} from './retention.dto.js';

export interface RetentionServiceDependencies {
  contentRepositories: ContentRepositoryBundle;
  engagementRepositories: EngagementRepositoryBundle;
  playbackRepositories: PlaybackRepositoryBundle;
  clock?: () => Date;
}

type ActivityKind = 'progress' | 'bookmark' | 'favorite' | 'note';

interface RetentionActivityRow {
  audiobookId: string;
  audiobookTitle: string;
  authorName: string;
  occurredAt: Date;
  kind: ActivityKind;
}

interface RecommendationCandidate {
  audiobookId: string;
  title: string;
  description: string | null;
  coverImageAssetKey: string | null;
  authorId: string;
  authorName: string;
  durationSec: number;
  premiumFlag: boolean;
  status: 'draft' | 'published' | 'unpublished' | 'archived';
  publishedAt: Date | null;
}

interface ScoredRecommendation {
  item: RecommendationCandidate;
  score: number;
  reasonType: RetentionRecommendationReasonType;
  reason: string;
}

export class RetentionService {
  constructor(private readonly dependencies: RetentionServiceDependencies) {}

  async getHome(userId: string): Promise<RetentionHomeResponseDto> {
    const now = this.dependencies.clock?.() ?? new Date();
    const windowStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [publishedAudiobooks, recentProgress, bookmarks, favorites, notes] = await Promise.all([
      this.dependencies.contentRepositories.audiobookRepository.listPublished({
        limit: 100,
        offset: 0,
      }),
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

    const progressActivities = recentProgress
      .filter((row) => row.lastPlayedAt >= windowStart)
      .map<RetentionActivityRow>((row) => ({
        audiobookId: row.audiobookId,
        audiobookTitle: row.audiobookTitle,
        authorName: row.authorName,
        occurredAt: row.lastPlayedAt,
        kind: 'progress',
      }));
    const bookmarkActivities = bookmarks.data
      .filter((row) => row.createdAt >= windowStart)
      .map<RetentionActivityRow>((row) => ({
        audiobookId: row.audiobookId,
        audiobookTitle: row.audiobookTitle,
        authorName: row.authorName,
        occurredAt: row.createdAt,
        kind: 'bookmark',
      }));
    const favoriteActivities = favorites.data
      .filter((row) => row.createdAt >= windowStart)
      .map<RetentionActivityRow>((row) => ({
        audiobookId: row.audiobookId,
        audiobookTitle: row.audiobookTitle,
        authorName: row.authorName,
        occurredAt: row.createdAt,
        kind: 'favorite',
      }));
    const noteActivities = notes.data
      .filter((row) => row.createdAt >= windowStart)
      .map<RetentionActivityRow>((row) => ({
        audiobookId: row.audiobookId,
        audiobookTitle: row.audiobookTitle,
        authorName: row.authorName,
        occurredAt: row.createdAt,
        kind: 'note',
      }));

    const activities = [
      ...progressActivities,
      ...bookmarkActivities,
      ...favoriteActivities,
      ...noteActivities,
    ];

    const activityDays = new Set<string>();
    for (const activity of activities) {
      activityDays.add(activity.occurredAt.toISOString().slice(0, 10));
    }

    const topActivity = selectTopActivity(activities);
    const latestActivity = activities.length
      ? activities.reduce((latest, current) =>
          current.occurredAt.getTime() > latest.occurredAt.getTime() ? current : latest,
        )
      : null;
    const topAudiobook = topActivity
      ? publishedAudiobooks.find((item) => item.id === topActivity.audiobookId) ?? null
      : null;
    const topAuthorName = topAudiobook?.authorName ?? topActivity?.authorName ?? null;

    const recommendations = scoreRecommendations(
      publishedAudiobooks.map<RecommendationCandidate>((item) => ({
        audiobookId: item.id,
        title: item.title,
        description: item.description,
        coverImageAssetKey: item.coverImageAssetKey,
        authorId: item.authorId,
        authorName: item.authorName,
        durationSec: item.durationSec,
        premiumFlag: item.premiumFlag,
        status: item.status,
        publishedAt: item.publishedAt,
      })),
      activities,
      topAudiobook?.id ?? null,
      now,
    );

    const weeklySummary: RetentionWeeklySummaryDto = {
      periodStart: windowStart.toISOString(),
      periodEnd: now.toISOString(),
      headline: buildHeadline(activityDays.size, activities.length),
      description: buildSummaryDescription({
        activeTitlesCount: new Set(activities.map((item) => item.audiobookId)).size,
        bookmarksCreated: bookmarkActivities.length,
        notesCreated: noteActivities.length,
        favoritesAdded: favoriteActivities.length,
      }),
      activeDays: activityDays.size,
      listeningSessions: progressActivities.length,
      bookmarksCreated: bookmarkActivities.length,
      notesCreated: noteActivities.length,
      favoritesAdded: favoriteActivities.length,
      topAudiobookTitle: topAudiobook?.title ?? null,
      topAuthorName,
      lastActivityAt: latestActivity?.occurredAt.toISOString() ?? null,
    };

    return {
      data: {
        weeklySummary,
        recommendations,
      },
      meta: {
        generatedAt: now.toISOString(),
        windowDays: 7,
      },
    };
  }
}

function scoreRecommendations(
  candidates: RecommendationCandidate[],
  activities: RetentionActivityRow[],
  currentAudiobookId: string | null,
  now: Date,
): RetentionRecommendationDto[] {
  const seedAudiobookIds = new Set<string>(activities.map((activity) => activity.audiobookId));
  if (currentAudiobookId) {
    seedAudiobookIds.add(currentAudiobookId);
  }

  const seedAuthors = new Set(activities.map((activity) => activity.authorName));
  const freshPickWindowDays = 21;
  const scored = candidates
    .filter((candidate) => !seedAudiobookIds.has(candidate.audiobookId))
    .map<ScoredRecommendation | null>((candidate) => {
      let score = 0;
      let reasonType: RetentionRecommendationReasonType = 'HABIT_BUILDER';
      let reason = 'Keep building your listening habit';

      if (candidate.publishedAt) {
        const ageDays = Math.floor((now.getTime() - candidate.publishedAt.getTime()) / 86400000);
        if (ageDays <= freshPickWindowDays) {
          score += 1;
          reasonType = 'FRESH_PICK';
          reason = 'Fresh pick';
        }
      }

      if (seedAuthors.has(candidate.authorName)) {
        score += 8;
        reasonType = 'MORE_FROM_AUTHOR';
        reason = `More from ${candidate.authorName}`;
      }

      if (candidate.publishedAt) {
        const ageDays = Math.floor((now.getTime() - candidate.publishedAt.getTime()) / 86400000);
        if (ageDays <= 7) {
          score += 2;
        }
      }

      if (candidate.status !== 'published') {
        score -= 100;
      }

      return {
        item: candidate,
        score,
        reasonType,
        reason,
      };
    })
    .filter((item): item is ScoredRecommendation => item !== null)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      const rightPublishedAt = right.item.publishedAt?.getTime() ?? 0;
      const leftPublishedAt = left.item.publishedAt?.getTime() ?? 0;
      if (rightPublishedAt !== leftPublishedAt) {
        return rightPublishedAt - leftPublishedAt;
      }

      return left.item.title.localeCompare(right.item.title);
    })
    .slice(0, 4);

  return scored.map((entry, index) => ({
    audiobookId: entry.item.audiobookId,
    title: entry.item.title,
    description: entry.item.description,
    coverImageAssetKey: entry.item.coverImageAssetKey,
    authorId: entry.item.authorId,
    authorName: entry.item.authorName,
    durationSec: entry.item.durationSec,
    premiumFlag: entry.item.premiumFlag,
    status: entry.item.status,
    publishedAt: entry.item.publishedAt ? entry.item.publishedAt.toISOString() : null,
    reasonType: entry.reasonType,
    reason: entry.reason,
  }));
}

function selectTopActivity(activities: RetentionActivityRow[]): RetentionActivityRow | null {
  if (!activities.length) {
    return null;
  }

  const buckets = new Map<
    string,
    {
      row: RetentionActivityRow;
      count: number;
      lastOccurredAt: number;
    }
  >();

  for (const activity of activities) {
    const bucket = buckets.get(activity.audiobookId);
    if (!bucket) {
      buckets.set(activity.audiobookId, {
        row: activity,
        count: 1,
        lastOccurredAt: activity.occurredAt.getTime(),
      });
      continue;
    }

    bucket.count += 1;
    bucket.lastOccurredAt = Math.max(bucket.lastOccurredAt, activity.occurredAt.getTime());
  }

  return [...buckets.values()]
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }

      if (right.lastOccurredAt !== left.lastOccurredAt) {
        return right.lastOccurredAt - left.lastOccurredAt;
      }

      return left.row.audiobookTitle.localeCompare(right.row.audiobookTitle);
    })[0]?.row ?? null;
}

function buildHeadline(activeDays: number, activityCount: number): string {
  if (activeDays >= 4) {
    return 'Your habit is sticking';
  }

  if (activityCount >= 4) {
    return 'You kept the loop moving';
  }

  if (activityCount >= 2) {
    return 'You have momentum';
  }

  return 'Keep the next session close';
}

function buildSummaryDescription(input: {
  activeTitlesCount: number;
  bookmarksCreated: number;
  notesCreated: number;
  favoritesAdded: number;
}): string {
  return [
    `${input.activeTitlesCount} active titles`,
    `${input.bookmarksCreated} bookmarks`,
    `${input.notesCreated} notes`,
    `${input.favoritesAdded} favorites`,
  ].join(' · ');
}
