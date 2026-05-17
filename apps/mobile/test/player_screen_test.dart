import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:clone_fanos_mobile/app/app_scope.dart';
import 'package:clone_fanos_mobile/core/storage/onboarding_store.dart';
import 'package:clone_fanos_mobile/core/storage/session_store.dart';
import 'package:clone_fanos_mobile/features/analytics/data/mock_analytics_repository.dart';
import 'package:clone_fanos_mobile/features/auth/data/mock_auth_repository.dart';
import 'package:clone_fanos_mobile/features/auth/state/app_state.dart';
import 'package:clone_fanos_mobile/features/engagement/data/mock_engagement_repository.dart';
import 'package:clone_fanos_mobile/features/discovery/data/mock_discovery_repository.dart';
import 'package:clone_fanos_mobile/features/player/data/mock_player_repository.dart';
import 'package:clone_fanos_mobile/features/player/presentation/player_screen.dart';
import 'package:clone_fanos_mobile/features/subscription/domain/subscription_models.dart';
import 'package:clone_fanos_mobile/features/subscription/data/mock_subscription_repository.dart';

void main() {
  testWidgets('Player screen loads asset access, resumes progress and advances playback', (tester) async {
    final discoveryRepository = MockDiscoveryRepository();
    final detail = await discoveryRepository.getAudiobookDetail('book-clean-architecture');
    expect(detail, isNotNull);
    final analyticsRepository = MockAnalyticsRepository();

    final appState = AppState(
      authRepository: MockAuthRepository(),
      contentRepository: discoveryRepository,
      playerRepository: MockPlayerRepository(),
      engagementRepository: MockEngagementRepository(),
      subscriptionRepository: MockSubscriptionRepository(),
      analyticsRepository: analyticsRepository,
      onboardingStore: InMemoryOnboardingStore(),
      sessionStore: InMemorySessionStore(),
    );

    await appState.bootstrap();
    await appState.completeOnboarding();
    await appState.login(
      email: 'demo@clonefanos.local',
      password: 'password123',
    );

    await tester.pumpWidget(
      AppScope(
        appState: appState,
        child: MaterialApp(
          home: PlayerScreen(
            appState: appState,
            audiobookId: 'book-clean-architecture',
            initialDetail: detail,
            autoplay: false,
          ),
        ),
      ),
    );

    await tester.pump();
    await tester.pump(const Duration(milliseconds: 10));
    await tester.pumpAndSettle();

    expect(find.text('Player'), findsOneWidget);
    expect(find.text('Pause'), findsNothing);
    expect(find.text('Play'), findsOneWidget);
    expect(find.text('14:20'), findsWidgets);
    expect(find.text('LOCALFILE'), findsOneWidget);

    await tester.tap(find.byIcon(Icons.bookmark_add_outlined));
    await tester.pumpAndSettle();

    expect(
      await appState.engagementRepository.listBookmarks(),
      hasLength(2),
    );

    await tester.tap(find.text('Play'));
    await tester.pump();
    await tester.pump(const Duration(seconds: 2));

    expect(find.text('Pause'), findsOneWidget);
    expect(find.text('14:22'), findsWidgets);

    final eventNames = analyticsRepository.recordedEvents.map((record) => record.event.eventName).toList();
    expect(eventNames, contains('chapter_started'));
    expect(eventNames, contains('bookmark_created'));
  });

  testWidgets('Player screen unlocks premium content after entitlement refresh', (tester) async {
    final discoveryRepository = MockDiscoveryRepository();
    final detail = await discoveryRepository.getAudiobookDetail('book-system-design');
    expect(detail, isNotNull);

    final subscriptionRepository = MockSubscriptionRepository();
    final analyticsRepository = MockAnalyticsRepository();
    final appState = AppState(
      authRepository: MockAuthRepository(),
      contentRepository: discoveryRepository,
      playerRepository: MockPlayerRepository(),
      engagementRepository: MockEngagementRepository(),
      subscriptionRepository: subscriptionRepository,
      analyticsRepository: analyticsRepository,
      onboardingStore: InMemoryOnboardingStore(),
      sessionStore: InMemorySessionStore(),
    );

    await appState.bootstrap();
    await appState.completeOnboarding();
    await appState.login(
      email: 'demo@clonefanos.local',
      password: 'password123',
    );

    await tester.pumpWidget(
      AppScope(
        appState: appState,
        child: MaterialApp(
          home: PlayerScreen(
            appState: appState,
            audiobookId: 'book-system-design',
            initialDetail: detail,
            autoplay: false,
          ),
        ),
      ),
    );

    await tester.pump();
    await tester.pump(const Duration(milliseconds: 10));
    await tester.pumpAndSettle();

    expect(find.text('Premium locked'), findsWidgets);
    expect(find.text('Play'), findsNothing);

    final checkout = await subscriptionRepository.checkout(
      request: const SubscriptionCheckoutRequest(
        planId: 'premium-monthly',
        provider: 'mock',
      ),
      userId: appState.currentUserId,
      accessToken: appState.accessToken,
    );
    await subscriptionRepository.verifySubscription(
      userId: appState.currentUserId,
      accessToken: appState.accessToken,
      request: SubscriptionVerifyRequest(
        checkoutSessionId: checkout.checkoutSessionId,
        receiptToken: 'receipt-${checkout.checkoutSessionId}',
        transactionId: 'transaction-${checkout.checkoutSessionId}',
        orderId: 'order-${checkout.checkoutSessionId}',
        provider: checkout.provider,
        platform: 'mobile',
      ),
    );
    await appState.refreshSubscription();
    await tester.pumpAndSettle();

    expect(find.text('Play'), findsOneWidget);
    expect(find.text('Premium locked'), findsNothing);
    expect(find.text('LOCALFILE'), findsOneWidget);
  });
}
