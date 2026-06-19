import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:clone_fanos_mobile/app/app_scope.dart';
import 'package:clone_fanos_mobile/core/storage/onboarding_store.dart';
import 'package:clone_fanos_mobile/core/storage/session_store.dart';
import 'package:clone_fanos_mobile/features/analytics/data/mock_analytics_repository.dart';
import 'package:clone_fanos_mobile/features/auth/data/mock_auth_repository.dart';
import 'package:clone_fanos_mobile/features/auth/state/app_state.dart';
import 'package:clone_fanos_mobile/features/engagement/data/mock_engagement_repository.dart';
import 'package:clone_fanos_mobile/features/discovery/data/mock_discovery_repository.dart';
import 'package:clone_fanos_mobile/features/discovery/domain/discovery_models.dart';
import 'package:clone_fanos_mobile/features/discovery/domain/discovery_repository.dart';
import 'package:clone_fanos_mobile/features/home/presentation/home_shell.dart';
import 'package:clone_fanos_mobile/features/notification/data/mock_notification_repository.dart';
import 'package:clone_fanos_mobile/features/retention/data/mock_retention_repository.dart';
import 'package:clone_fanos_mobile/features/player/data/mock_player_repository.dart';
import 'package:clone_fanos_mobile/features/subscription/domain/subscription_models.dart';
import 'package:clone_fanos_mobile/features/subscription/data/mock_subscription_repository.dart';

void main() {
  testWidgets('Home shell supports browse, search and detail navigation',
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
    expect(
        analyticsRepository.recordedEvents
            .any((record) => record.event.eventName == 'home_viewed'),
        isTrue);

    await tester.tap(find.byIcon(Icons.search_outlined));
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField), 'clean architecture');
    await tester.testTextInput.receiveAction(TextInputAction.search);
    await tester.pumpAndSettle();

    await tester.drag(find.byType(ListView).first, const Offset(0, -700));
    await tester.pumpAndSettle();

    expect(find.textContaining('Clean Architecture cho Product Teams'),
        findsWidgets);

    await tester
        .tap(find.byKey(const ValueKey('search-card-book-clean-architecture')));
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
    final eventNames = analyticsRepository.recordedEvents
        .map((record) => record.event.eventName)
        .toList();
    expect(
        eventNames,
        containsAll([
          'search_viewed',
          'search_submitted',
          'search_result_clicked',
          'audiobook_viewed',
        ]));
  });

  testWidgets('Home shell shows retention summary and recommendations',
      (tester) async {
    final analyticsRepository = MockAnalyticsRepository();
    final appState = AppState(
      authRepository: MockAuthRepository(),
      contentRepository: MockDiscoveryRepository(),
      playerRepository: MockPlayerRepository(),
      engagementRepository: MockEngagementRepository(),
      subscriptionRepository: MockSubscriptionRepository(),
      analyticsRepository: analyticsRepository,
      retentionRepository: const MockRetentionRepository(),
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

    expect(find.text('Weekly habit summary'), findsOneWidget);
    expect(find.text('Recommended next'), findsOneWidget);
    expect(find.text('Your habit is sticking'), findsOneWidget);
    expect(find.text('Learning Habit System'), findsWidgets);
    expect(find.text('More from Anh Lê'), findsOneWidget);

    final recommendationCard =
        find.byKey(const ValueKey('retention-card-book-habit-system'));
    await tester.ensureVisible(recommendationCard);
    await tester.pumpAndSettle();
    await tester.tap(recommendationCard);
    await tester.pumpAndSettle();

    final eventNames = analyticsRepository.recordedEvents
        .map((record) => record.event.eventName)
        .toList();
    expect(eventNames, contains('retention_recommendation_clicked'));
    expect(eventNames, contains('audiobook_card_clicked'));
  });

  testWidgets('Home shell shows and opens the resume reminder', (tester) async {
    final analyticsRepository = MockAnalyticsRepository();
    final appState = AppState(
      authRepository: MockAuthRepository(),
      contentRepository: MockDiscoveryRepository(),
      playerRepository: MockPlayerRepository(),
      engagementRepository: MockEngagementRepository(),
      subscriptionRepository: MockSubscriptionRepository(),
      analyticsRepository: analyticsRepository,
      notificationRepository: const MockNotificationRepository(),
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

    final reminderCard = find.byKey(const ValueKey('notification-reminder-card'));
    expect(reminderCard, findsOneWidget);
    expect(
      find.descendant(
        of: reminderCard,
        matching: find.text('Japanese Daily Listening'),
      ),
      findsOneWidget,
    );
    expect(
      find.descendant(
        of: reminderCard,
        matching: find.text('Resume Chapter 2 at 04:12'),
      ),
      findsOneWidget,
    );
    expect(
      analyticsRepository.recordedEvents
          .any((record) => record.event.eventName == 'notification_home_viewed'),
      isTrue,
    );

    await tester.ensureVisible(reminderCard);
    await tester.pumpAndSettle();
    await tester.tap(reminderCard);
    await tester.pumpAndSettle();

    expect(find.text('Player'), findsOneWidget);
    final eventNames = analyticsRepository.recordedEvents
        .map((record) => record.event.eventName)
        .toList();
    expect(eventNames, contains('notification_resume_clicked'));
  });

  testWidgets('Home shell uses consistent search terminology', (tester) async {
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

    await tester.tap(find.byIcon(Icons.search_outlined));
    await tester.pumpAndSettle();

    expect(find.text('Search audiobooks'), findsWidgets);
    expect(
      tester.widget<TextField>(find.byType(TextField)).decoration?.hintText,
      'Search audiobooks',
    );
    expect(find.text('Sort results'), findsOneWidget);
    expect(find.text('All categories'), findsOneWidget);
    expect(find.text('Descending'), findsOneWidget);
    expect(find.text('Ascending'), findsOneWidget);
    await tester.drag(find.byType(ListView).last, const Offset(0, -700));
    await tester.pumpAndSettle();
    expect(find.text('Type to search audiobooks'), findsOneWidget);
    expect(
      find.text(
          'Results prioritize title, author, narrator, tag, and category matches.'),
      findsOneWidget,
    );
  });

  testWidgets('Home shell supports search sort by title and order',
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

    await tester.enterText(find.byType(TextField), 'cho');
    await tester.testTextInput.receiveAction(TextInputAction.search);
    await tester.pumpAndSettle();

    expect(find.text('Sort results'), findsOneWidget);

    await tester.tap(find.text('Title'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Descending'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Ascending'));
    await tester.pumpAndSettle();

    final eventNames = analyticsRepository.recordedEvents
        .map((record) => record.event.eventName)
        .toList();
    expect(eventNames, contains('search_filter_changed'));
  });

  testWidgets(
      'Home shell ignores stale search responses and keeps latest results',
      (tester) async {
    final appState = AppState(
      authRepository: MockAuthRepository(),
      contentRepository: _OutOfOrderSearchDiscoveryRepository(),
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

    await tester.tap(find.byIcon(Icons.search_outlined));
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField), 'clean');
    await tester.pump(const Duration(milliseconds: 350));

    await tester.enterText(find.byType(TextField), 'system');
    await tester.pump(const Duration(milliseconds: 350));

    await tester.pump(const Duration(milliseconds: 600));
    await tester.pumpAndSettle();
    await tester.drag(find.byType(ListView).first, const Offset(0, -700));
    await tester.pumpAndSettle();

    expect(find.byKey(const ValueKey('search-card-book-latest-system')),
        findsOneWidget);
    expect(find.byKey(const ValueKey('search-card-book-stale-clean')),
        findsNothing);
  });

  testWidgets('Home shell shows and dismisses subscription refresh banner',
      (tester) async {
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

    await tester.pumpWidget(
      AppScope(
        appState: appState,
        child: MaterialApp(
          home: HomeShell(appState: appState),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Subscription info needs a refresh.'), findsOneWidget);
    expect(appState.subscriptionRefreshError, isNotNull);

    await tester.tap(find.text('Dismiss'));
    await tester.pumpAndSettle();

    expect(find.text('Subscription info needs a refresh.'), findsNothing);
    expect(appState.subscriptionRefreshError, isNull);
  });

  testWidgets('Home shell unlocks premium detail after entitlement refresh',
      (tester) async {
    final analyticsRepository = MockAnalyticsRepository();
    final subscriptionRepository = MockSubscriptionRepository();
    final appState = AppState(
      authRepository: MockAuthRepository(),
      contentRepository: MockDiscoveryRepository(),
      playerRepository: MockPlayerRepository(),
      engagementRepository: MockEngagementRepository(),
      subscriptionRepository: subscriptionRepository,
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

    await tester.drag(find.byType(ListView).first, const Offset(0, -700));
    await tester.pumpAndSettle();

    await tester
        .tap(find.byKey(const ValueKey('search-card-book-system-design')));
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

class _FailingSubscriptionRepository extends MockSubscriptionRepository {
  @override
  Future<SubscriptionState?> getMySubscription({
    required String? userId,
    required String? accessToken,
  }) async {
    throw StateError('subscription refresh failed');
  }
}

class _OutOfOrderSearchDiscoveryRepository extends MockDiscoveryRepository {
  @override
  Future<SearchPage> searchAudiobooks(DiscoverySearchRequest request) async {
    final normalized = request.query.trim().toLowerCase();
    if (normalized == 'clean') {
      await Future<void>.delayed(const Duration(milliseconds: 900));
    } else {
      await Future<void>.delayed(const Duration(milliseconds: 10));
    }
    final item = normalized == 'clean'
        ? _buildSummary(
            id: 'book-stale-clean',
            title: 'Stale Clean Result',
          )
        : _buildSummary(
            id: 'book-latest-system',
            title: 'Latest System Result',
          );

    return SearchPage(
      items: <AudiobookSummary>[item],
      query: request.query,
      page: 1,
      pageSize: request.pageSize,
      totalItems: 1,
      totalPages: 1,
      hasNext: false,
    );
  }

  AudiobookSummary _buildSummary({
    required String id,
    required String title,
  }) {
    return AudiobookSummary(
      id: id,
      title: title,
      description: 'test',
      coverImageAssetKey: null,
      authorId: 'author-test',
      authorName: 'Author Test',
      narratorIds: const <String>['narrator-test'],
      narratorNames: const <String>['Narrator Test'],
      categoryIds: const <String>['cat-test'],
      categoryNames: const <String>['Category Test'],
      tagNames: const <String>['tag'],
      durationSec: 600,
      premiumFlag: false,
      status: 'PUBLISHED',
      isFeatured: false,
      isNew: false,
      languageCode: 'en',
    );
  }
}
