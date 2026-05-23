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
import 'package:clone_fanos_mobile/features/home/presentation/home_shell.dart';
import 'package:clone_fanos_mobile/features/player/data/mock_player_repository.dart';
import 'package:clone_fanos_mobile/features/subscription/domain/subscription_models.dart';
import 'package:clone_fanos_mobile/features/subscription/data/mock_subscription_repository.dart';

void main() {
  testWidgets('Home shell supports browse, search and detail navigation', (tester) async {
    final analyticsRepository = MockAnalyticsRepository();
    final appState = AppState(
      authRepository: MockAuthRepository(),
      contentRepository: MockDiscoveryRepository(),
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
          home: HomeShell(appState: appState),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Continue listening'), findsWidgets);
    expect(analyticsRepository.recordedEvents.any((record) => record.event.eventName == 'home_viewed'), isTrue);

    await tester.tap(find.byIcon(Icons.search_outlined));
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField), 'clean architecture');
    await tester.testTextInput.receiveAction(TextInputAction.search);
    await tester.pumpAndSettle();

    await tester.drag(find.byType(ListView).first, const Offset(0, -700));
    await tester.pumpAndSettle();

    expect(find.textContaining('Clean Architecture cho Product Teams'), findsWidgets);

    await tester.tap(find.byKey(const ValueKey('search-card-book-clean-architecture')));
    await tester.pumpAndSettle();

    expect(find.text('Audiobook detail'), findsOneWidget);
    await tester.drag(find.byType(ListView).last, const Offset(0, -600));
    await tester.pumpAndSettle();
    expect(find.text('Chapters'), findsOneWidget);

    await tester.pageBack();
    await tester.pumpAndSettle();

    await tester.tap(find.byIcon(Icons.person_outline));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Favorites'));
    await tester.pumpAndSettle();

    expect(find.text('Clean Architecture cho Product Teams'), findsWidgets);
    final eventNames = analyticsRepository.recordedEvents.map((record) => record.event.eventName).toList();
    expect(eventNames, containsAll([
      'search_viewed',
      'search_submitted',
      'search_result_clicked',
      'audiobook_viewed',
    ]));
  });

  testWidgets('Home shell supports search sort by title and order', (tester) async {
    final analyticsRepository = MockAnalyticsRepository();
    final appState = AppState(
      authRepository: MockAuthRepository(),
      contentRepository: MockDiscoveryRepository(),
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
          home: HomeShell(appState: appState),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.byIcon(Icons.search_outlined));
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField), 'cho');
    await tester.testTextInput.receiveAction(TextInputAction.search);
    await tester.pumpAndSettle();

    expect(find.text('Sort'), findsOneWidget);

    await tester.tap(find.text('Title'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Desc'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Asc'));
    await tester.pumpAndSettle();

    final eventNames = analyticsRepository.recordedEvents.map((record) => record.event.eventName).toList();
    expect(eventNames, contains('search_filter_changed'));
  });

  testWidgets('Home shell shows and dismisses subscription refresh banner', (tester) async {
    final appState = AppState(
      authRepository: MockAuthRepository(),
      contentRepository: MockDiscoveryRepository(),
      playerRepository: MockPlayerRepository(),
      engagementRepository: MockEngagementRepository(),
      subscriptionRepository: _FailingSubscriptionRepository(),
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
          home: HomeShell(appState: appState),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Subscription info needs a refresh.'), findsOneWidget);
    expect(appState.subscriptionRefreshError, isNotNull);

    await tester.tap(find.text('Dismiss'));
    await tester.pumpAndSettle();

    expect(find.text('Subscription info needs a refresh.'), findsNothing);
    expect(appState.subscriptionRefreshError, isNull);
  });

  testWidgets('Home shell unlocks premium detail after entitlement refresh', (tester) async {
    final analyticsRepository = MockAnalyticsRepository();
    final subscriptionRepository = MockSubscriptionRepository();
    final appState = AppState(
      authRepository: MockAuthRepository(),
      contentRepository: MockDiscoveryRepository(),
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
          home: HomeShell(appState: appState),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.byIcon(Icons.search_outlined));
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField), 'system design');
    await tester.testTextInput.receiveAction(TextInputAction.search);
    await tester.pumpAndSettle();

    await tester.drag(find.byType(ListView).first, const Offset(0, -700));
    await tester.pumpAndSettle();

    await tester.tap(find.byKey(const ValueKey('search-card-book-system-design')));
    await tester.pumpAndSettle();

    expect(find.text('Upgrade'), findsOneWidget);
    expect(find.text('Premium locked'), findsOneWidget);

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

    expect(find.text('Start listening'), findsOneWidget);
    expect(find.text('Premium locked'), findsNothing);
  });
}

class _FailingSubscriptionRepository extends MockSubscriptionRepository {
  @override
  Future<SubscriptionState?> getMySubscription({
    required String? userId,
    required String? accessToken,
  }) async {
    throw StateError('subscription refresh failed');
  }
}
