import 'package:flutter/material.dart';

import '../../../app/app_scope.dart';
import '../state/app_state.dart';
import '../../home/presentation/home_shell.dart';
import '../../onboarding/presentation/onboarding_screen.dart';
import 'auth_screen.dart';

class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = AppScope.of(context);

    return AnimatedBuilder(
      animation: appState,
      builder: (context, _) {
        switch (appState.phase) {
          case AppPhase.booting:
            return const _BootScreen();
          case AppPhase.onboarding:
            return OnboardingScreen(appState: appState);
          case AppPhase.unauthenticated:
            return AuthScreen(appState: appState);
          case AppPhase.authenticated:
            return HomeShell(appState: appState);
        }
      },
    );
  }
}

class _BootScreen extends StatelessWidget {
  const _BootScreen();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: CircularProgressIndicator(),
      ),
    );
  }
}

