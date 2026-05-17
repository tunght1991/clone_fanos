import 'dart:async';

import 'package:flutter/foundation.dart';

import '../../../core/storage/onboarding_store.dart';
import '../../../core/storage/session_store.dart';
import '../../analytics/domain/analytics_models.dart';
import '../../analytics/domain/analytics_repository.dart';
import '../../engagement/domain/engagement_repository.dart';
import '../../discovery/domain/discovery_repository.dart';
import '../../player/domain/player_repository.dart';
import '../../subscription/domain/subscription_repository.dart';
import '../../subscription/domain/subscription_models.dart';
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
  AuthSession? get session => _session;
  AuthUser? get currentUser => _session?.user;
  SubscriptionState? get currentSubscription => _subscription;

  Future<void> bootstrap() async {
    _setBusy(true);
    try {
      final onboardingCompleted = await onboardingStore.isCompleted();
      _session = await sessionStore.read();
      _phase = _session != null
          ? AppPhase.authenticated
          : (onboardingCompleted ? AppPhase.unauthenticated : AppPhase.onboarding);
      if (_session != null) {
        await refreshSubscription();
      } else {
        _subscription = null;
      }
      _errorMessage = null;
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
    } finally {
      _setBusy(false);
    }
  }

  Future<void> completeOnboarding() async {
    await onboardingStore.markCompleted();
    _phase = _session != null ? AppPhase.authenticated : AppPhase.unauthenticated;
    _errorMessage = null;
    notifyListeners();
  }

  Future<void> login({
    required String email,
    required String password,
  }) async {
    _errorMessage = null;
    _setBusy(true);
    try {
      final session = await authRepository.login(email: email, password: password);
      await sessionStore.write(session);
      _session = session;
      _phase = AppPhase.authenticated;
      await refreshSubscription();
      _errorMessage = null;
    } catch (error) {
      _errorMessage = error.toString();
    } finally {
      _setBusy(false);
    }
  }

  Future<void> register({
    required String displayName,
    required String email,
    required String password,
  }) async {
    _errorMessage = null;
    _setBusy(true);
    try {
      final session = await authRepository.register(
        displayName: displayName,
        email: email,
        password: password,
      );
      await sessionStore.write(session);
      _session = session;
      _phase = AppPhase.authenticated;
      await refreshSubscription();
      _errorMessage = null;
    } catch (error) {
      _errorMessage = error.toString();
    } finally {
      _setBusy(false);
    }
  }

  Future<void> logout() async {
    _setBusy(true);
    try {
      final refreshToken = _session?.refreshToken;
      if (refreshToken != null) {
        try {
          await authRepository.logout(refreshToken: refreshToken);
        } catch (_) {
          // Best effort: local sign-out must still complete even if remote revoke fails.
        }
      }

      await sessionStore.clear();
      _session = null;
      _subscription = null;
      _phase = AppPhase.unauthenticated;
      _errorMessage = null;
    } finally {
      _setBusy(false);
    }
  }

  Future<SubscriptionState?> refreshSubscription() async {
    if (_session == null) {
      _subscription = null;
      notifyListeners();
      return null;
    }

    final subscription = await subscriptionRepository.getMySubscription(
      userId: _session!.user.id,
      accessToken: _session!.accessToken,
    );
    _subscription = subscription;
    notifyListeners();
    return subscription;
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

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  void _setBusy(bool value) {
    _busy = value;
    notifyListeners();
  }
}
