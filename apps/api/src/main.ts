import { loadAndValidateApiEnvironment, readAssetAccessRuntimeConfig, readAuthRuntimeConfig } from './config/index.js';
import { readSubscriptionRuntimeConfig } from './config/index.js';
import { PostgresDatabase, readDatabaseRuntimeConfig } from './db/index.js';
import { AuthController, AuthService, AuthTokenService, createAuthRepositoryBundle } from './modules/auth/index.js';
import { AnalyticsController, AnalyticsService, createAnalyticsRepositoryBundle } from './modules/analytics/index.js';
import { AssetAccessService, createAssetAccessServiceConfig } from './modules/assets/index.js';
import {
  AdminContentService,
  ContentController,
  ContentAuditService,
  ContentMutationService,
  ContentService,
  createContentAuditRepositoryBundle,
  createContentRepositoryBundle,
} from './modules/content/index.js';
import {
  EngagementController,
  EngagementService,
  createEngagementRepositoryBundle,
} from './modules/engagement/index.js';
import { NotificationController, NotificationService } from './modules/notification/index.js';
import { PlaybackController, PlaybackService, createPlaybackRepositoryBundle } from './modules/playback/index.js';
import { RetentionController, RetentionService } from './modules/retention/index.js';
import {
  SearchController,
  SearchReindexService,
  SearchService,
  createSearchIndexBundle,
  createSearchRepositoryBundle,
} from './modules/search/index.js';
import {
  SubscriptionController,
  SubscriptionService,
  buildSubscriptionPolicy,
  createSubscriptionRepositoryBundle,
} from './modules/subscription/index.js';

export const apiAppName = 'clone-fanos-api';

export type ApiRuntime = ReturnType<typeof bootstrapApiRuntime>;

export function bootstrapApiRuntime() {
  const env = loadAndValidateApiEnvironment();
  const databaseRuntimeConfig = readDatabaseRuntimeConfig(env);
  const database = new PostgresDatabase(databaseRuntimeConfig);
  const authRepositories = createAuthRepositoryBundle(database);
  const authRuntimeConfig = readAuthRuntimeConfig(env);
  const authTokenService = new AuthTokenService({
    issuer: 'clone-fanos-api',
    secret: authRuntimeConfig.tokenSecret,
    tokenTtlSeconds: authRuntimeConfig.tokenTtlSeconds,
  });
  const authService = new AuthService({
    repositories: authRepositories,
    tokenService: authTokenService,
    refreshTokenTtlSeconds: authRuntimeConfig.refreshTokenTtlSeconds,
  });
  const authController = new AuthController(authService);
  const contentRepositories = createContentRepositoryBundle(database);
  const contentAuditRepositories = createContentAuditRepositoryBundle(database);
  const contentAuditService = new ContentAuditService(contentAuditRepositories.contentAuditRepository);
  const contentService = new ContentService(contentRepositories);
  const contentController = new ContentController(contentService);
  const adminContentService = new AdminContentService(database);
  const engagementRepositories = createEngagementRepositoryBundle(database);
  const engagementService = new EngagementService({
    repositories: engagementRepositories,
    contentRepositories,
  });
  const engagementController = new EngagementController(engagementService);
  const playbackRepositories = createPlaybackRepositoryBundle(database);
  const playbackService = new PlaybackService({
    repositories: playbackRepositories,
    contentRepositories,
  });
  const playbackController = new PlaybackController(playbackService);
  const notificationService = new NotificationService({
    contentRepositories,
    engagementRepositories,
    playbackRepositories,
  });
  const notificationController = new NotificationController(notificationService);
  const retentionService = new RetentionService({
    contentRepositories,
    engagementRepositories,
    playbackRepositories,
  });
  const retentionController = new RetentionController(retentionService);
  const searchRepositories = createSearchRepositoryBundle(database);
  const searchService = new SearchService({
    repositories: searchRepositories,
  });
  const searchController = new SearchController(searchService);
  const searchIndexBundle = createSearchIndexBundle(database);
  const searchReindexService = new SearchReindexService({
    documentSource: searchIndexBundle.documentSource,
    indexRepository: searchIndexBundle.indexRepository,
    aliasManager: searchIndexBundle.aliasManager,
  });
  const contentMutationService = new ContentMutationService({
    repositories: contentRepositories,
    auditLogger: contentAuditService,
    reindexQueue: {
      async enqueueAudiobookReindex(input) {
        await searchReindexService.reindexPublishedAudiobook(input.audiobookId);
      },
    },
    transaction: async (work) =>
      database.withTransaction(async (client) => {
        const transactionRepositories = createContentRepositoryBundle(client);
        return work(transactionRepositories);
      }),
  });
  const analyticsRepositories = createAnalyticsRepositoryBundle(database);
  const analyticsService = new AnalyticsService({
    repositories: analyticsRepositories,
  });
  const analyticsController = new AnalyticsController(analyticsService);
  const subscriptionRepositories = createSubscriptionRepositoryBundle(database);
  const assetAccessRuntimeConfig = readAssetAccessRuntimeConfig(env);
  const assetAccessDependencies = createAssetAccessServiceConfig(assetAccessRuntimeConfig);
  const subscriptionRuntimeConfig = readSubscriptionRuntimeConfig(env);
  const subscriptionPolicy = buildSubscriptionPolicy(subscriptionRuntimeConfig);
  const subscriptionService = new SubscriptionService({
    policy: subscriptionPolicy,
    repositories: subscriptionRepositories,
    webhookSecret: subscriptionRuntimeConfig.webhookSecret,
    allowedReturnUrlOrigins: subscriptionRuntimeConfig.allowedReturnUrlOrigins,
  });
  const subscriptionController = new SubscriptionController(subscriptionService);

  return {
    database,
    databaseRuntimeConfig,
    authRepositories,
    authRuntimeConfig,
    authTokenService,
    authService,
    authController,
    contentRepositories,
    contentAuditRepositories,
    contentAuditService,
    contentService,
    contentController,
    adminContentService,
    engagementRepositories,
    engagementService,
    engagementController,
    contentMutationService,
    analyticsRepositories,
    analyticsService,
    analyticsController,
    playbackRepositories,
    playbackService,
    playbackController,
    notificationService,
    notificationController,
    retentionService,
    retentionController,
    searchRepositories,
    searchService,
    searchController,
    searchIndexBundle,
    searchReindexService,
    subscriptionRepositories,
    subscriptionService,
    subscriptionController,
    assetAccessService: new AssetAccessService(assetAccessDependencies),
    assetAccessRuntimeConfig,
    subscriptionRuntimeConfig,
    subscriptionPolicy,
  };
}
