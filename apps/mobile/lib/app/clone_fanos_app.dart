import 'package:flutter/material.dart';

import '../core/storage/onboarding_store.dart';
import '../core/storage/session_store.dart';
import 'app_theme.dart';
import '../features/auth/domain/auth_repository.dart';
import '../features/auth/presentation/auth_gate.dart';
import '../features/auth/state/app_state.dart';
import '../features/analytics/domain/analytics_repository.dart';
import '../features/engagement/domain/engagement_repository.dart';
import '../features/discovery/domain/discovery_repository.dart';
import '../features/player/domain/player_repository.dart';
import '../features/subscription/domain/subscription_repository.dart';
import 'app_config.dart';
import 'app_scope.dart';

class CloneFanosApp extends StatefulWidget {
  const CloneFanosApp({super.key});

  @override
  State<CloneFanosApp> createState() => _CloneFanosAppState();
}

class _CloneFanosAppState extends State<CloneFanosApp> {
  late final AppConfig _config;
  late final AppState _appState;

  @override
  void initState() {
    super.initState();
    _config = AppConfig.fromEnvironment();
    _appState = AppState(
      authRepository: createAuthRepository(_config),
      contentRepository: createDiscoveryRepository(_config),
      playerRepository: createPlayerRepository(_config),
      engagementRepository: createEngagementRepository(_config),
      subscriptionRepository: createSubscriptionRepository(_config),
      analyticsRepository: createAnalyticsRepository(_config),
      onboardingStore: InMemoryOnboardingStore(),
      sessionStore: InMemorySessionStore(),
    );
    _appState.bootstrap();
  }

  @override
  void dispose() {
    _appState.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AppScope(
      appState: _appState,
      child: MaterialApp(
        debugShowCheckedModeBanner: false,
        title: _config.appName,
        theme: buildCloneFanosTheme(),
        home: const AuthGate(),
      ),
    );
  }
}
