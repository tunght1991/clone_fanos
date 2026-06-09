import 'package:clone_fanos_mobile/app/app_scope.dart';
import 'package:clone_fanos_mobile/core/storage/onboarding_store.dart';
import 'package:clone_fanos_mobile/core/storage/session_store.dart';
import 'package:clone_fanos_mobile/features/auth/data/mock_auth_repository.dart';
import 'package:clone_fanos_mobile/features/auth/state/app_state.dart';
import 'package:clone_fanos_mobile/features/discovery/data/mock_discovery_repository.dart';
import 'package:clone_fanos_mobile/features/analytics/data/mock_analytics_repository.dart';
import 'package:clone_fanos_mobile/features/engagement/data/mock_engagement_repository.dart';
import 'package:clone_fanos_mobile/features/player/data/mock_player_repository.dart';
import 'package:clone_fanos_mobile/features/subscription/data/mock_subscription_repository.dart';
import 'package:clone_fanos_mobile/features/subscription/domain/subscription_models.dart';
import 'package:clone_fanos_mobile/features/subscription/presentation/subscription_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets(
      'Subscription screen follows paywall -> select plan -> payment -> verify -> unlock',
      (tester) async {
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
          home: SubscriptionScreen(appState: appState),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Premium access locked'), findsOneWidget);
    expect(find.text('Select Plan'), findsWidgets);
    expect(find.byKey(const ValueKey('plan-premium-monthly')), findsOneWidget);

    await tester.tap(find.byKey(const ValueKey('plan-premium-monthly')));
    await tester.pumpAndSettle();

    expect(find.text('Select Plan'), findsWidgets);

    await tester.tap(find.byKey(const ValueKey('subscription-payment-button')),
        warnIfMissed: false);
    await tester.pumpAndSettle();

    expect(find.text('Premium access enabled'), findsOneWidget);
    expect(find.text('Unlocked'), findsWidgets);

    final eventNames = analyticsRepository.recordedEvents
        .map((record) => record.event.eventName)
        .toList();
    expect(
      eventNames,
      containsAllInOrder([
        'subscription_viewed',
        'subscription_plan_selected',
        'subscription_checkout_started',
        'subscription_checkout_success',
        'subscription_verify_started',
        'subscription_verify_success',
        'subscription_unlocked',
      ]),
    );
  });

  testWidgets(
      'Subscription screen shows and dismisses subscription refresh banner',
      (tester) async {
    final appState = AppState(
      authRepository: MockAuthRepository(),
      contentRepository: MockDiscoveryRepository(),
      playerRepository: MockPlayerRepository(),
      engagementRepository: MockEngagementRepository(),
      subscriptionRepository: _FailingSubscriptionRepository(),
      analyticsRepository: MockAnalyticsRepository(),
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
          home: SubscriptionScreen(appState: appState),
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

  testWidgets(
      'Subscription screen failure analytics uses normalized error category',
      (tester) async {
    final analyticsRepository = MockAnalyticsRepository();
    final appState = AppState(
      authRepository: MockAuthRepository(),
      contentRepository: MockDiscoveryRepository(),
      playerRepository: MockPlayerRepository(),
      engagementRepository: MockEngagementRepository(),
      subscriptionRepository: _CheckoutFailingSubscriptionRepository(),
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
          home: SubscriptionScreen(appState: appState),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.byKey(const ValueKey('subscription-payment-button')));
    await tester.pumpAndSettle();

    final failed = analyticsRepository.recordedEvents
        .where((record) =>
            record.event.eventName == 'subscription_checkout_failed')
        .toList();
    expect(failed, hasLength(1));
    expect(failed.single.event.payload['errorCategory'], 'network');
    expect(failed.single.event.payload.containsKey('error'), isFalse);
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

class _CheckoutFailingSubscriptionRepository
    extends MockSubscriptionRepository {
  @override
  Future<SubscriptionCheckoutResult> checkout({
    required SubscriptionCheckoutRequest request,
    required String? userId,
    required String? accessToken,
  }) async {
    throw StateError('network timeout');
  }
}
