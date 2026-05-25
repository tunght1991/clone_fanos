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
import 'package:clone_fanos_mobile/features/auth/domain/auth_models.dart';
import 'package:clone_fanos_mobile/features/subscription/domain/subscription_models.dart';

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
    expect(analyticsRepository.recordedEvents.single.event.eventName,
        'app_opened');
  });

  test(
      'AppState keeps authenticated session if subscription refresh fails during bootstrap',
      () async {
    final sessionStore = InMemorySessionStore();
    await sessionStore.write(
      AuthSession(
        tokenType: 'Bearer',
        accessToken: 'access-1',
        refreshToken: 'refresh-1',
        expiresAt: DateTime.utc(2026, 6, 1, 0, 0, 0),
        refreshExpiresAt: DateTime.utc(2026, 7, 1, 0, 0, 0),
        user: const AuthUser(
          id: 'user-demo',
          email: 'demo@clonefanos.local',
          displayName: 'Demo User',
          avatarAssetKey: null,
          role: AuthRole.user,
          isActive: true,
        ),
      ),
    );

    final appState = AppState(
      authRepository: _SessionValidatingAuthRepository(),
      contentRepository: MockDiscoveryRepository(),
      playerRepository: MockPlayerRepository(),
      engagementRepository: MockEngagementRepository(),
      subscriptionRepository: _FailingSubscriptionRepository(),
      onboardingStore: InMemoryOnboardingStore(),
      sessionStore: sessionStore,
    );

    await appState.bootstrap();

    expect(appState.phase, AppPhase.authenticated);
    expect(appState.currentUser?.email, 'demo@clonefanos.local');
    expect(appState.session, isNotNull);
    expect(appState.currentSubscription, isNull);
    expect(appState.errorMessage, isNull);
    expect(appState.subscriptionRefreshError,
        contains('subscription refresh failed'));
  });

  test('AppState clears stored session when auth validation fails during bootstrap',
      () async {
    final sessionStore = InMemorySessionStore();
    await sessionStore.write(
      AuthSession(
        tokenType: 'Bearer',
        accessToken: 'access-invalid',
        refreshToken: 'refresh-invalid',
        expiresAt: DateTime.utc(2026, 6, 1, 0, 0, 0),
        refreshExpiresAt: DateTime.utc(2026, 7, 1, 0, 0, 0),
        user: const AuthUser(
          id: 'user-demo',
          email: 'demo@clonefanos.local',
          displayName: 'Demo User',
          avatarAssetKey: null,
          role: AuthRole.user,
          isActive: true,
        ),
      ),
    );

    final appState = AppState(
      authRepository: MockAuthRepository(),
      contentRepository: MockDiscoveryRepository(),
      playerRepository: MockPlayerRepository(),
      engagementRepository: MockEngagementRepository(),
      subscriptionRepository: MockSubscriptionRepository(),
      onboardingStore: InMemoryOnboardingStore(),
      sessionStore: sessionStore,
    );

    await appState.bootstrap();

    expect(appState.phase, AppPhase.onboarding);
    expect(appState.session, isNull);
    expect(await sessionStore.read(), isNull);
  });

  test(
      'AppState refreshes expired session during bootstrap and keeps the restored session',
      () async {
    final sessionStore = InMemorySessionStore();
    await sessionStore.write(
      AuthSession(
        tokenType: 'Bearer',
        accessToken: 'access-expired',
        refreshToken: 'refresh-1',
        expiresAt: DateTime.utc(2024, 6, 1, 0, 0, 0),
        refreshExpiresAt: DateTime.utc(2026, 7, 1, 0, 0, 0),
        user: const AuthUser(
          id: 'user-demo',
          email: 'demo@clonefanos.local',
          displayName: 'Demo User',
          avatarAssetKey: null,
          role: AuthRole.user,
          isActive: true,
        ),
      ),
    );

    final appState = AppState(
      authRepository: _RefreshingAuthRepository(),
      contentRepository: MockDiscoveryRepository(),
      playerRepository: MockPlayerRepository(),
      engagementRepository: MockEngagementRepository(),
      subscriptionRepository: MockSubscriptionRepository(),
      onboardingStore: InMemoryOnboardingStore(),
      sessionStore: sessionStore,
    );

    await appState.bootstrap();

    expect(appState.phase, AppPhase.authenticated);
    expect(appState.currentUser?.email, 'demo@clonefanos.local');
    expect(appState.session?.accessToken, 'access-refreshed');
  });

  test('AppState clears expired session during bootstrap when refresh fails',
      () async {
    final sessionStore = InMemorySessionStore();
    await sessionStore.write(
      AuthSession(
        tokenType: 'Bearer',
        accessToken: 'access-expired',
        refreshToken: 'refresh-1',
        expiresAt: DateTime.utc(2024, 6, 1, 0, 0, 0),
        refreshExpiresAt: DateTime.utc(2026, 7, 1, 0, 0, 0),
        user: const AuthUser(
          id: 'user-demo',
          email: 'demo@clonefanos.local',
          displayName: 'Demo User',
          avatarAssetKey: null,
          role: AuthRole.user,
          isActive: true,
        ),
      ),
    );

    final appState = AppState(
      authRepository: _FailingRefreshAuthRepository(),
      contentRepository: MockDiscoveryRepository(),
      playerRepository: MockPlayerRepository(),
      engagementRepository: MockEngagementRepository(),
      subscriptionRepository: MockSubscriptionRepository(),
      onboardingStore: InMemoryOnboardingStore(),
      sessionStore: sessionStore,
    );

    await appState.bootstrap();

    expect(appState.phase, AppPhase.onboarding);
    expect(appState.session, isNull);
    expect(await sessionStore.read(), isNull);
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

  test(
      'AppState keeps authenticated after login when subscription refresh fails',
      () async {
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

    expect(appState.phase, AppPhase.authenticated);
    expect(appState.currentUser?.email, 'demo@clonefanos.local');
    expect(appState.currentSubscription, isNull);
    expect(appState.errorMessage, isNull);
    expect(appState.subscriptionRefreshError,
        contains('subscription refresh failed'));
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

  test(
      'AppState keeps authenticated after register when subscription refresh fails',
      () async {
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
    await appState.register(
      displayName: 'New User',
      email: 'new-user@clonefanos.local',
      password: 'password123',
    );

    expect(appState.phase, AppPhase.authenticated);
    expect(appState.currentUser?.email, 'new-user@clonefanos.local');
    expect(appState.currentSubscription, isNull);
    expect(appState.errorMessage, isNull);
    expect(appState.subscriptionRefreshError,
        contains('subscription refresh failed'));
  });

  test('AppState logout clears session and returns to unauthenticated',
      () async {
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

  test('AppState logout keeps clearing local state even if remote revoke fails',
      () async {
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

class _FailingSubscriptionRepository extends MockSubscriptionRepository {
  @override
  Future<SubscriptionState?> getMySubscription({
    required String? userId,
    required String? accessToken,
  }) async {
    throw StateError('subscription refresh failed');
  }
}

class _RefreshingAuthRepository extends MockAuthRepository {
  @override
  Future<AuthSession> refresh({
    required String refreshToken,
  }) async {
    return AuthSession(
      tokenType: 'Bearer',
      accessToken: 'access-refreshed',
      refreshToken: 'refresh-refreshed',
      expiresAt: DateTime.utc(2026, 6, 1, 0, 0, 0),
      refreshExpiresAt: DateTime.utc(2026, 7, 1, 0, 0, 0),
      user: const AuthUser(
        id: 'user-demo',
        email: 'demo@clonefanos.local',
        displayName: 'Demo User',
        avatarAssetKey: null,
        role: AuthRole.user,
        isActive: true,
      ),
    );
  }

  @override
  Future<AuthUser?> me({
    required String accessToken,
  }) async {
    if (accessToken != 'access-refreshed') {
      return null;
    }

    return const AuthUser(
      id: 'user-demo',
      email: 'demo@clonefanos.local',
      displayName: 'Demo User',
      avatarAssetKey: null,
      role: AuthRole.user,
      isActive: true,
    );
  }
}

class _FailingRefreshAuthRepository extends MockAuthRepository {
  @override
  Future<AuthSession> refresh({
    required String refreshToken,
  }) async {
    throw StateError('refresh failed');
  }
}

class _SessionValidatingAuthRepository extends MockAuthRepository {
  @override
  Future<AuthUser?> me({
    required String accessToken,
  }) async {
    if (accessToken != 'access-1') {
      return null;
    }

    return const AuthUser(
      id: 'user-demo',
      email: 'demo@clonefanos.local',
      displayName: 'Demo User',
      avatarAssetKey: null,
      role: AuthRole.user,
      isActive: true,
    );
  }
}
