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
import 'package:clone_fanos_mobile/features/subscription/presentation/subscription_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('Subscription screen follows paywall -> select plan -> payment -> verify -> unlock', (tester) async {
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

    await tester.tap(find.byKey(const ValueKey('subscription-payment-button')), warnIfMissed: false);
    await tester.pumpAndSettle();

    expect(find.text('Premium access enabled'), findsOneWidget);
    expect(find.text('Unlocked'), findsWidgets);

    final eventNames = analyticsRepository.recordedEvents.map((record) => record.event.eventName).toList();
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
}
