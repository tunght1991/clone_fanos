import 'package:flutter_test/flutter_test.dart';

import 'package:clone_fanos_mobile/core/storage/onboarding_store.dart';
import 'package:clone_fanos_mobile/core/storage/session_store.dart';
import 'package:clone_fanos_mobile/features/auth/data/mock_auth_repository.dart';
import 'package:clone_fanos_mobile/features/analytics/data/mock_analytics_repository.dart';
import 'package:clone_fanos_mobile/features/auth/state/app_state.dart';
import 'package:clone_fanos_mobile/features/engagement/data/mock_engagement_repository.dart';
import 'package:clone_fanos_mobile/features/discovery/data/mock_discovery_repository.dart';
import 'package:clone_fanos_mobile/features/player/data/mock_player_repository.dart';
import 'package:clone_fanos_mobile/features/subscription/data/mock_subscription_repository.dart';

void main() {
  test('AppState boots into onboarding when no session exists', () async {
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

    expect(appState.phase, AppPhase.onboarding);
    expect(analyticsRepository.recordedEvents.single.event.eventName, 'app_opened');
  });

  test('AppState moves to authenticated after login', () async {
    final appState = AppState(
      authRepository: MockAuthRepository(),
      contentRepository: MockDiscoveryRepository(),
      playerRepository: MockPlayerRepository(),
      engagementRepository: MockEngagementRepository(),
      subscriptionRepository: MockSubscriptionRepository(),
      onboardingStore: InMemoryOnboardingStore(),
      sessionStore: InMemorySessionStore(),
    );

    await appState.bootstrap();
    await appState.completeOnboarding();
    await appState.login(
      email: 'demo@clonefanos.local',
      password: 'password123',
    );

    expect(appState.phase, AppPhase.authenticated);
    expect(appState.currentUser?.email, 'demo@clonefanos.local');
  });

  test('AppState login failure sets error state without throwing', () async {
    final appState = AppState(
      authRepository: MockAuthRepository(),
      contentRepository: MockDiscoveryRepository(),
      playerRepository: MockPlayerRepository(),
      engagementRepository: MockEngagementRepository(),
      subscriptionRepository: MockSubscriptionRepository(),
      onboardingStore: InMemoryOnboardingStore(),
      sessionStore: InMemorySessionStore(),
    );

    await appState.bootstrap();
    await appState.completeOnboarding();

    await expectLater(
      appState.login(
        email: 'demo@clonefanos.local',
        password: 'wrong-password',
      ),
      completes,
    );

    expect(appState.phase, AppPhase.unauthenticated);
    expect(appState.errorMessage, isNotNull);
  });

  test('AppState logout clears session and returns to unauthenticated', () async {
    final appState = AppState(
      authRepository: MockAuthRepository(),
      contentRepository: MockDiscoveryRepository(),
      playerRepository: MockPlayerRepository(),
      engagementRepository: MockEngagementRepository(),
      subscriptionRepository: MockSubscriptionRepository(),
      onboardingStore: InMemoryOnboardingStore(),
      sessionStore: InMemorySessionStore(),
    );

    await appState.bootstrap();
    await appState.completeOnboarding();
    await appState.login(
      email: 'demo@clonefanos.local',
      password: 'password123',
    );

    await appState.logout();

    expect(appState.phase, AppPhase.unauthenticated);
    expect(appState.currentUser, isNull);
    expect(appState.session, isNull);
  });

  test('AppState logout keeps clearing local state even if remote revoke fails', () async {
    final appState = AppState(
      authRepository: _LogoutFailingAuthRepository(),
      contentRepository: MockDiscoveryRepository(),
      playerRepository: MockPlayerRepository(),
      engagementRepository: MockEngagementRepository(),
      subscriptionRepository: MockSubscriptionRepository(),
      onboardingStore: InMemoryOnboardingStore(),
      sessionStore: InMemorySessionStore(),
    );

    await appState.bootstrap();
    await appState.completeOnboarding();
    await appState.login(
      email: 'demo@clonefanos.local',
      password: 'password123',
    );

    await expectLater(appState.logout(), completes);

    expect(appState.phase, AppPhase.unauthenticated);
    expect(appState.currentUser, isNull);
    expect(appState.session, isNull);
  });
}

class _LogoutFailingAuthRepository extends MockAuthRepository {
  @override
  Future<void> logout({
    required String refreshToken,
  }) async {
    throw StateError('logout failed');
  }
}
