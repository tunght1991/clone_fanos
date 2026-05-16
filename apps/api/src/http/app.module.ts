import { Module } from '@nestjs/common';

import { bootstrapApiRuntime } from '../main.js';
import { AuthController } from '../modules/auth/index.js';
import { AnalyticsController } from '../modules/analytics/index.js';
import { ContentAuditService, ContentController, ContentMutationService } from '../modules/content/index.js';
import { EngagementController } from '../modules/engagement/index.js';
import { PlaybackController } from '../modules/playback/index.js';
import { SearchController, SearchReindexService } from '../modules/search/index.js';
import { SubscriptionController } from '../modules/subscription/index.js';
import { AdminHttpController } from './admin.http.controller.js';
import { AnalyticsHttpController } from './analytics.http.controller.js';
import { AuthHttpController } from './auth.http.controller.js';
import { EngagementHttpController } from './engagement.http.controller.js';
import { ContentHttpController } from './content.http.controller.js';
import { AssetsHttpController } from './assets.http.controller.js';
import { HealthHttpController } from './health.http.controller.js';
import { API_RUNTIME_TOKEN } from './http.tokens.js';
import { PlaybackHttpController } from './playback.http.controller.js';
import { SearchHttpController } from './search.http.controller.js';
import { SubscriptionHttpController } from './subscription.http.controller.js';
import { AssetAccessService } from '../modules/assets/index.js';

@Module({
  controllers: [
    HealthHttpController,
    AuthHttpController,
    AdminHttpController,
    AnalyticsHttpController,
    PlaybackHttpController,
    SearchHttpController,
    EngagementHttpController,
    ContentHttpController,
    AssetsHttpController,
    SubscriptionHttpController,
  ],
  providers: [
    {
      provide: API_RUNTIME_TOKEN,
      useFactory: bootstrapApiRuntime,
    },
    {
      provide: ContentController,
      useFactory: (runtime: ReturnType<typeof bootstrapApiRuntime>) => runtime.contentController,
      inject: [API_RUNTIME_TOKEN],
    },
    {
      provide: ContentMutationService,
      useFactory: (runtime: ReturnType<typeof bootstrapApiRuntime>) => runtime.contentMutationService,
      inject: [API_RUNTIME_TOKEN],
    },
    {
      provide: ContentAuditService,
      useFactory: (runtime: ReturnType<typeof bootstrapApiRuntime>) => runtime.contentAuditService,
      inject: [API_RUNTIME_TOKEN],
    },
    {
      provide: PlaybackController,
      useFactory: (runtime: ReturnType<typeof bootstrapApiRuntime>) => runtime.playbackController,
      inject: [API_RUNTIME_TOKEN],
    },
    {
      provide: AuthController,
      useFactory: (runtime: ReturnType<typeof bootstrapApiRuntime>) => runtime.authController,
      inject: [API_RUNTIME_TOKEN],
    },
    {
      provide: AnalyticsController,
      useFactory: (runtime: ReturnType<typeof bootstrapApiRuntime>) => runtime.analyticsController,
      inject: [API_RUNTIME_TOKEN],
    },
    {
      provide: SubscriptionController,
      useFactory: (runtime: ReturnType<typeof bootstrapApiRuntime>) => runtime.subscriptionController,
      inject: [API_RUNTIME_TOKEN],
    },
    {
      provide: SearchController,
      useFactory: (runtime: ReturnType<typeof bootstrapApiRuntime>) => runtime.searchController,
      inject: [API_RUNTIME_TOKEN],
    },
    {
      provide: EngagementController,
      useFactory: (runtime: ReturnType<typeof bootstrapApiRuntime>) => runtime.engagementController,
      inject: [API_RUNTIME_TOKEN],
    },
    {
      provide: SearchReindexService,
      useFactory: (runtime: ReturnType<typeof bootstrapApiRuntime>) => runtime.searchReindexService,
      inject: [API_RUNTIME_TOKEN],
    },
    {
      provide: AssetAccessService,
      useFactory: (runtime: ReturnType<typeof bootstrapApiRuntime>) => runtime.assetAccessService,
      inject: [API_RUNTIME_TOKEN],
    },
  ],
})
export class AppModule {}
