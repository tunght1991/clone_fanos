import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:clone_fanos_mobile/core/storage/onboarding_store.dart';
import 'package:clone_fanos_mobile/core/storage/session_store.dart';
import 'package:clone_fanos_mobile/features/analytics/data/mock_analytics_repository.dart';
import 'package:clone_fanos_mobile/features/auth/data/mock_auth_repository.dart';
import 'package:clone_fanos_mobile/features/auth/presentation/auth_screen.dart';
import 'package:clone_fanos_mobile/features/auth/state/app_state.dart';
import 'package:clone_fanos_mobile/features/discovery/data/mock_discovery_repository.dart';
import 'package:clone_fanos_mobile/features/engagement/data/mock_engagement_repository.dart';
import 'package:clone_fanos_mobile/features/player/data/mock_player_repository.dart';
import 'package:clone_fanos_mobile/features/subscription/data/mock_subscription_repository.dart';

void main() {
  testWidgets(
      'Auth screen enforces backend password minimum length and tracks view',
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

    await tester.pumpWidget(
      MaterialApp(
        home: AuthScreen(appState: appState),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('Register'));
    await tester.pumpAndSettle();

    await tester.enterText(
        find.widgetWithText(TextFormField, 'Display name'), '  Test User  ');
    await tester.enterText(
        find.widgetWithText(TextFormField, 'Email'), 'test@example.com');
    await tester.enterText(
        find.widgetWithText(TextFormField, 'Password'), '123456');
    await tester.tap(find.text('Create account'));
    await tester.pumpAndSettle();

    expect(find.text('Password must be at least 8 chars'), findsOneWidget);
    final eventNames = analyticsRepository.recordedEvents
        .map((record) => record.event.eventName)
        .toList();
    expect(eventNames, contains('auth_viewed'));
  });

  testWidgets('Auth screen tracks login success', (tester) async {
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

    await tester.pumpWidget(
      MaterialApp(
        home: AuthScreen(appState: appState),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.widgetWithText(FilledButton, 'Login'));
    await tester.pumpAndSettle();

    final eventNames = analyticsRepository.recordedEvents
        .map((record) => record.event.eventName)
        .toList();
    expect(eventNames, contains('auth_login_submitted'));
    expect(eventNames, contains('auth_login_success'));
  });

  testWidgets('Auth screen failure analytics uses normalized error category',
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

    await tester.pumpWidget(
      MaterialApp(
        home: AuthScreen(appState: appState),
      ),
    );
    await tester.pumpAndSettle();

    await tester.enterText(
      find.widgetWithText(TextFormField, 'Password'),
      'wrong-password',
    );
    await tester.tap(find.widgetWithText(FilledButton, 'Login'));
    await tester.pumpAndSettle();

    final failed = analyticsRepository.recordedEvents
        .where((record) => record.event.eventName == 'auth_login_failed')
        .toList();
    expect(failed, hasLength(1));
    expect(failed.single.event.payload['errorCategory'],
        'auth_invalid_credentials');
    expect(failed.single.event.payload.containsKey('error'), isFalse);
  });
}
