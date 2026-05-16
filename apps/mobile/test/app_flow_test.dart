import 'package:clone_fanos_mobile/app/app_scope.dart';
import 'package:clone_fanos_mobile/core/storage/onboarding_store.dart';
import 'package:clone_fanos_mobile/core/storage/session_store.dart';
import 'package:clone_fanos_mobile/features/auth/data/mock_auth_repository.dart';
import 'package:clone_fanos_mobile/features/auth/presentation/auth_gate.dart';
import 'package:clone_fanos_mobile/features/auth/state/app_state.dart';
import 'package:clone_fanos_mobile/features/engagement/data/mock_engagement_repository.dart';
import 'package:clone_fanos_mobile/features/discovery/data/mock_discovery_repository.dart';
import 'package:clone_fanos_mobile/features/player/data/mock_player_repository.dart';
import 'package:clone_fanos_mobile/features/subscription/data/mock_subscription_repository.dart';
import 'package:clone_fanos_mobile/features/subscription/domain/subscription_models.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('Mobile main flow covers onboarding, auth, browse, search, detail and player', (tester) async {
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

    await tester.pumpWidget(
      AppScope(
        appState: appState,
        child: const MaterialApp(
          home: AuthGate(),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Listen with focus'), findsOneWidget);

    await tester.tap(find.text('Skip'));
    await tester.pumpAndSettle();

    expect(find.text('Welcome back'), findsOneWidget);

    await tester.tap(find.widgetWithText(FilledButton, 'Login'));
    await tester.pumpAndSettle();

    expect(find.textContaining('Hello, Demo User'), findsOneWidget);
    expect(find.text('Continue listening'), findsWidgets);

    await tester.tap(
      find.descendant(
        of: find.byType(AppBar),
        matching: find.byIcon(Icons.search),
      ),
    );
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField), 'clean architecture');
    await tester.testTextInput.receiveAction(TextInputAction.search);
    await tester.pumpAndSettle();

    expect(find.textContaining('Clean Architecture cho Product Teams'), findsWidgets);

    await tester.tap(find.byKey(const ValueKey('search-card-book-clean-architecture')));
    await tester.pumpAndSettle();

    expect(find.text('Audiobook detail'), findsOneWidget);
    await tester.drag(find.byType(ListView).last, const Offset(0, -500));
    await tester.pumpAndSettle();
    expect(find.text('Start listening'), findsOneWidget);

    await tester.tap(find.text('Start listening'));
    await tester.pumpAndSettle();

    expect(find.text('Player'), findsOneWidget);
    expect(find.text('Clean Architecture cho Product Teams'), findsWidgets);
    expect(find.text('Tư duy domain-first'), findsWidgets);
  });

  testWidgets('Subscription smoke flow opens paywall then unlocks premium detail after payment verification', (tester) async {
    final subscriptionRepository = MockSubscriptionRepository();
    final appState = AppState(
      authRepository: MockAuthRepository(),
      contentRepository: MockDiscoveryRepository(),
      playerRepository: MockPlayerRepository(),
      engagementRepository: MockEngagementRepository(),
      subscriptionRepository: subscriptionRepository,
      onboardingStore: InMemoryOnboardingStore(),
      sessionStore: InMemorySessionStore(),
    );

    await appState.bootstrap();

    await tester.pumpWidget(
      AppScope(
        appState: appState,
        child: const MaterialApp(
          home: AuthGate(),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('Skip'));
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(FilledButton, 'Login'));
    await tester.pumpAndSettle();

    await tester.tap(
      find.descendant(
        of: find.byType(AppBar),
        matching: find.byIcon(Icons.search),
      ),
    );
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField), 'system design');
    await tester.testTextInput.receiveAction(TextInputAction.search);
    await tester.pumpAndSettle();

    await tester.tap(find.byKey(const ValueKey('search-card-book-system-design')));
    await tester.pumpAndSettle();

    expect(find.text('Upgrade'), findsWidgets);
    await tester.tap(find.text('Upgrade').first);
    await tester.pumpAndSettle();

    expect(find.text('Subscription'), findsOneWidget);
    expect(find.text('Premium access locked'), findsWidgets);
    expect(find.byKey(const ValueKey('plan-premium-monthly')), findsOneWidget);

    await tester.tap(find.byKey(const ValueKey('plan-premium-monthly')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const ValueKey('subscription-payment-button')));
    await tester.pumpAndSettle();

    expect(find.text('Premium access enabled'), findsOneWidget);
    expect(find.text('Unlocked'), findsWidgets);

    await tester.pageBack();
    await tester.pumpAndSettle();

    expect(find.text('Audiobook detail'), findsOneWidget);
    expect(find.text('Start listening'), findsOneWidget);
    expect(find.text('Premium locked'), findsNothing);

    await tester.tap(find.text('Start listening'));
    await tester.pumpAndSettle();

    expect(find.text('Player'), findsOneWidget);
    expect(find.text('Premium locked'), findsNothing);
  });
}
