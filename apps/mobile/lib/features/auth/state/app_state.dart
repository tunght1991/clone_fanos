import 'dart:async';

import 'package:flutter/foundation.dart';

import '../../../core/storage/onboarding_store.dart';
import '../../../core/storage/session_store.dart';
import '../../analytics/domain/analytics_models.dart';
import '../../analytics/domain/analytics_repository.dart';
import '../../discovery/domain/discovery_repository.dart';
import '../../engagement/domain/engagement_repository.dart';
import '../../player/domain/player_repository.dart';
import '../../subscription/domain/subscription_models.dart';
import '../../subscription/domain/subscription_repository.dart';
import '../domain/auth_models.dart';
import '../domain/auth_repository.dart';

enum AppPhase { booting, onboarding, unauthenticated, authenticated }

class AppState extends ChangeNotifier {
  final AuthRepository authRepository;
  final DiscoveryRepository contentRepository;
  final PlayerRepository playerRepository;
  final EngagementRepository engagementRepository;
  final SubscriptionRepository subscriptionRepository;
  final AnalyticsRepository analyticsRepository;
  final OnboardingStore onboardingStore;
  final SessionStore sessionStore;

  AppPhase _phase = AppPhase.booting;
  bool _busy = false;
  String? _errorMessage;
  String? _subscriptionRefreshError;
  AuthSession? _session;
  SubscriptionState? _subscription;

  AppState({
    required this.authRepository,
    required this.contentRepository,
    required this.playerRepository,
    required this.engagementRepository,
    required this.subscriptionRepository,
    this.analyticsRepository = const NoopAnalyticsRepository(),
    required this.onboardingStore,
    required this.sessionStore,
  });

  String? get currentUserId => _session?.user.id;
  String? get accessToken => _session?.accessToken;

  AppPhase get phase => _phase;
  bool get isBusy => _busy;
  String? get errorMessage => _errorMessage;
  String? get subscriptionRefreshError => _subscriptionRefreshError;
  AuthSession? get session => _session;
  AuthUser? get currentUser => _session?.user;
  SubscriptionState? get currentSubscription => _subscription;

  Future<void> bootstrap() async {
    await _runBusy(() async {
      try {
        final onboardingCompleted = await onboardingStore.isCompleted();
        final storedSession = await sessionStore.read();
        if (storedSession == null) {
          _setUnauthenticatedState(
            onboardingCompleted: onboardingCompleted,
          );
        } else {
          final restoredSession = await _restoreSession(storedSession);
          if (restoredSession == null) {
            _setUnauthenticatedState(
              onboardingCompleted: onboardingCompleted,
            );
          } else {
            _activateSession(restoredSession);
            await _syncSubscriptionAfterAuth();
          }
        }
        unawaited(
          trackAnalyticsEvent(
            'app_opened',
            payload: {
              'phase': _phase.name,
              'hasSession': _session != null,
              'onboardingCompleted': onboardingCompleted,
            },
          ),
        );
      } catch (error) {
        _errorMessage = error.toString();
        _phase = AppPhase.onboarding;
      }
    });
  }

  Future<void> completeOnboarding() async {
    await onboardingStore.markCompleted();
    _phase =
        _session != null ? AppPhase.authenticated : AppPhase.unauthenticated;
    _errorMessage = null;
    notifyListeners();
  }

  Future<void> login({
    required String email,
    required String password,
  }) async {
    await _runBusy(() async {
      _resetAuthStateErrors();
      try {
        final session =
            await authRepository.login(email: email, password: password);
        await sessionStore.write(session);
        _activateSession(session);
        await _syncSubscriptionAfterAuth();
      } catch (error) {
        _errorMessage = error.toString();
      }
    });
  }

  Future<void> register({
    required String displayName,
    required String email,
    required String password,
  }) async {
    await _runBusy(() async {
      _resetAuthStateErrors();
      try {
        final session = await authRepository.register(
          displayName: displayName,
          email: email,
          password: password,
        );
        await sessionStore.write(session);
        _activateSession(session);
        await _syncSubscriptionAfterAuth();
      } catch (error) {
        _errorMessage = error.toString();
      }
    });
  }

  Future<void> logout() async {
    await _runBusy(() async {
      final refreshToken = _session?.refreshToken;
      if (refreshToken != null) {
        try {
          await authRepository.logout(refreshToken: refreshToken);
        } catch (_) {
          // Best effort: local sign-out must still complete even if remote revoke fails.
        }
      }

      await sessionStore.clear();
      _setSignedOutState();
    });
  }

  Future<SubscriptionState?> refreshSubscription() async {
    if (_session == null) {
      _subscription = null;
      _subscriptionRefreshError = null;
      notifyListeners();
      return null;
    }

    try {
      final subscription = await subscriptionRepository.getMySubscription(
        userId: _session!.user.id,
        accessToken: _session!.accessToken,
      );
      _subscription = subscription;
      _subscriptionRefreshError = null;
      notifyListeners();
      return subscription;
    } catch (error) {
      _subscription = null;
      _subscriptionRefreshError = error.toString();
      notifyListeners();
      rethrow;
    }
  }

  Future<void> _syncSubscriptionAfterAuth() async {
    try {
      await refreshSubscription();
    } catch (_) {}
  }

  Future<AuthSession?> _restoreSession(AuthSession storedSession) async {
    final now = DateTime.now().toUtc();
    if (storedSession.expiresAt.isAfter(now)) {
      return storedSession;
    }

    if (storedSession.refreshExpiresAt.isBefore(now)) {
      await sessionStore.clear();
      return null;
    }

    try {
      final refreshedSession = await authRepository.refresh(
        refreshToken: storedSession.refreshToken,
      );
      await sessionStore.write(refreshedSession);
      return refreshedSession;
    } catch (_) {
      await sessionStore.clear();
      return null;
    }
  }

  Future<void> trackAnalyticsEvent(
    String eventName, {
    Map<String, Object?> payload = const {},
  }) async {
    try {
      await analyticsRepository.trackEvent(
        event: AnalyticsEvent(
          eventName: eventName,
          sourcePlatform: kIsWeb ? 'web' : 'mobile',
          payload: payload,
          occurredAt: DateTime.now().toUtc(),
        ),
        userId: currentUserId,
        accessToken: accessToken,
      );
    } catch (_) {
      // Best effort: analytics must not break the user flow.
    }
  }

  Future<void> _runBusy(Future<void> Function() action) async {
    _setBusy(true);
    try {
      await action();
    } finally {
      _setBusy(false);
    }
  }

  void _resetAuthStateErrors() {
    _errorMessage = null;
    _subscriptionRefreshError = null;
  }

  void _setUnauthenticatedState({
    required bool onboardingCompleted,
  }) {
    _session = null;
    _subscription = null;
    _errorMessage = null;
    _subscriptionRefreshError = null;
    _phase = onboardingCompleted
        ? AppPhase.unauthenticated
        : AppPhase.onboarding;
  }

  void _setSignedOutState() {
    _session = null;
    _subscription = null;
    _subscriptionRefreshError = null;
    _phase = AppPhase.unauthenticated;
    _errorMessage = null;
  }

  void _activateSession(AuthSession session) {
    _session = session;
    _phase = AppPhase.authenticated;
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  void clearSubscriptionRefreshError() {
    _subscriptionRefreshError = null;
    notifyListeners();
  }

  void _setBusy(bool value) {
    _busy = value;
    notifyListeners();
  }
}
