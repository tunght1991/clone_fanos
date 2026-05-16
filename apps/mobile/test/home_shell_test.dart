import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:clone_fanos_mobile/app/app_scope.dart';
import 'package:clone_fanos_mobile/core/storage/onboarding_store.dart';
import 'package:clone_fanos_mobile/core/storage/session_store.dart';
import 'package:clone_fanos_mobile/features/auth/data/mock_auth_repository.dart';
import 'package:clone_fanos_mobile/features/auth/state/app_state.dart';
import 'package:clone_fanos_mobile/features/engagement/data/mock_engagement_repository.dart';
import 'package:clone_fanos_mobile/features/discovery/data/mock_discovery_repository.dart';
import 'package:clone_fanos_mobile/features/home/presentation/home_shell.dart';
import 'package:clone_fanos_mobile/features/player/data/mock_player_repository.dart';
import 'package:clone_fanos_mobile/features/subscription/domain/subscription_models.dart';
import 'package:clone_fanos_mobile/features/subscription/data/mock_subscription_repository.dart';

void main() {
  testWidgets('Home shell supports browse, search and detail navigation', (tester) async {
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

    await tester.pumpWidget(
      AppScope(
        appState: appState,
        child: MaterialApp(
          home: HomeShell(appState: appState),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Continue listening'), findsWidgets);

    await tester.tap(find.byIcon(Icons.search_outlined));
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField), 'clean architecture');
    await tester.testTextInput.receiveAction(TextInputAction.search);
    await tester.pumpAndSettle();

    expect(find.textContaining('Clean Architecture cho Product Teams'), findsWidgets);

    await tester.tap(find.byKey(const ValueKey('search-card-book-clean-architecture')));
    await tester.pumpAndSettle();

    expect(find.text('Audiobook detail'), findsOneWidget);
    await tester.drag(find.byType(ListView).last, const Offset(0, -600));
    await tester.pumpAndSettle();
    expect(find.text('Chapters'), findsOneWidget);

    await tester.pageBack();
    await tester.pumpAndSettle();

    await tester.tap(find.byIcon(Icons.person_outline));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Favorites'));
    await tester.pumpAndSettle();

    expect(find.text('Clean Architecture cho Product Teams'), findsWidgets);
  });

  testWidgets('Home shell unlocks premium detail after entitlement refresh', (tester) async {
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
    await appState.completeOnboarding();
    await appState.login(
      email: 'demo@clonefanos.local',
      password: 'password123',
    );

    await tester.pumpWidget(
      AppScope(
        appState: appState,
        child: MaterialApp(
          home: HomeShell(appState: appState),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.byIcon(Icons.search_outlined));
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField), 'system design');
    await tester.testTextInput.receiveAction(TextInputAction.search);
    await tester.pumpAndSettle();

    await tester.tap(find.byKey(const ValueKey('search-card-book-system-design')));
    await tester.pumpAndSettle();

    expect(find.text('Upgrade'), findsOneWidget);
    expect(find.text('Premium locked'), findsOneWidget);

    final checkout = await subscriptionRepository.checkout(
      request: const SubscriptionCheckoutRequest(
        planId: 'premium-monthly',
        provider: 'mock',
      ),
      userId: appState.currentUserId,
      accessToken: appState.accessToken,
    );
    await subscriptionRepository.verifySubscription(
      userId: appState.currentUserId,
      accessToken: appState.accessToken,
      request: SubscriptionVerifyRequest(
        checkoutSessionId: checkout.checkoutSessionId,
        receiptToken: 'receipt-${checkout.checkoutSessionId}',
        transactionId: 'transaction-${checkout.checkoutSessionId}',
        orderId: 'order-${checkout.checkoutSessionId}',
        provider: checkout.provider,
        platform: 'mobile',
      ),
    );
    await appState.refreshSubscription();
    await tester.pumpAndSettle();

    expect(find.text('Start listening'), findsOneWidget);
    expect(find.text('Premium locked'), findsNothing);
  });
}
