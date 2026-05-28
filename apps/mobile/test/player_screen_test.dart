import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:clone_fanos_mobile/app/app_scope.dart';
import 'package:clone_fanos_mobile/core/storage/onboarding_store.dart';
import 'package:clone_fanos_mobile/core/storage/session_store.dart';
import 'package:clone_fanos_mobile/features/analytics/data/mock_analytics_repository.dart';
import 'package:clone_fanos_mobile/features/auth/data/mock_auth_repository.dart';
import 'package:clone_fanos_mobile/features/auth/state/app_state.dart';
import 'package:clone_fanos_mobile/features/discovery/data/mock_discovery_repository.dart';
import 'package:clone_fanos_mobile/features/engagement/data/mock_engagement_repository.dart';
import 'package:clone_fanos_mobile/features/player/audio/player_audio_controller_base.dart';
import 'package:clone_fanos_mobile/features/player/data/mock_player_repository.dart';
import 'package:clone_fanos_mobile/features/player/presentation/player_screen.dart';
import 'package:clone_fanos_mobile/features/subscription/data/mock_subscription_repository.dart';
import 'package:clone_fanos_mobile/features/subscription/domain/subscription_models.dart';

void main() {
  testWidgets(
      'Player screen loads transcript, navigates chapters, and saves bookmark notes',
      (tester) async {
    final discoveryRepository = MockDiscoveryRepository();
    final detail = (await discoveryRepository
        .getAudiobookDetail('book-clean-architecture'))!;
    final analyticsRepository = MockAnalyticsRepository();

    final appState = AppState(
      authRepository: MockAuthRepository(),
      contentRepository: discoveryRepository,
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
          home: PlayerScreen(
            appState: appState,
            audiobookId: 'book-clean-architecture',
            initialDetail: detail,
            autoplay: false,
          ),
        ),
      ),
    );

    await tester.pump();
    await tester.pump(const Duration(milliseconds: 10));
    await tester.pumpAndSettle();

    expect(find.text('Player'), findsOneWidget);
    expect(find.text('Play'), findsOneWidget);
    expect(find.text('Transcript'), findsOneWidget);
    expect(find.text('In this chapter we talk about service boundaries.'), 
        findsOneWidget);
    expect(find.text('Streaming only'), findsOneWidget);
    expect(find.text('offline-ready'), findsNothing);
    expect(find.text('Previous chapter'), findsOneWidget);
    expect(find.text('Next chapter'), findsOneWidget);

    await tester.tap(find.text('Next chapter'));
    await tester.pumpAndSettle();

    expect(find.text(detail.chapters[2].title), findsWidgets);
    expect(find.text('No transcript is available for this chapter.'),
        findsOneWidget);

    await tester.tap(find.byIcon(Icons.bookmark_add_outlined));
    await tester.pumpAndSettle();

    expect(find.text('Add bookmark note'), findsOneWidget);
    await tester.enterText(find.byType(TextField), 'Study this section');
    await tester.tap(find.text('Save'));
    await tester.pumpAndSettle();

    final bookmarks = await appState.engagementRepository.listBookmarks();
    expect(bookmarks, hasLength(2));
    expect(bookmarks.first.note, 'Study this section');

    final eventNames = analyticsRepository.recordedEvents
        .map((record) => record.event.eventName)
        .toList();
    expect(eventNames, contains('bookmark_created'));
  });

  testWidgets(
      'Player screen auto advances to the next chapter when playback ends',
      (tester) async {
    await tester.binding.setSurfaceSize(const Size(1200, 1400));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    final discoveryRepository = MockDiscoveryRepository();
    final detail = (await discoveryRepository
        .getAudiobookDetail('book-clean-architecture'))!;
    final analyticsRepository = MockAnalyticsRepository();
    late _FakePlayerAudioController controller;

    final appState = AppState(
      authRepository: MockAuthRepository(),
      contentRepository: discoveryRepository,
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
          home: PlayerScreen(
            appState: appState,
            audiobookId: 'book-clean-architecture',
            initialDetail: detail,
            initialChapterId: 'chapter-2',
            autoplay: false,
            audioControllerFactory: ({onEnded, onError}) {
              controller = _FakePlayerAudioController(
                onEnded: onEnded,
                onError: onError,
              );
              return controller;
            },
          ),
        ),
      ),
    );

    await tester.pump();
    await tester.pump(const Duration(milliseconds: 10));
    await tester.pumpAndSettle();

    expect(find.text(detail.chapters[1].title), findsWidgets);
    expect(find.text('Play'), findsOneWidget);

    final playButton = find.widgetWithText(FilledButton, 'Play');
    await tester.ensureVisible(playButton);
    await tester.tap(playButton);
    await tester.pump();
    await tester.pumpAndSettle();

    controller.triggerEnded(positionMs: detail.chapters[1].durationSec * 1000);
    await tester.pumpAndSettle();

    expect(find.text(detail.chapters[2].title), findsWidgets);
    expect(find.text('Pause'), findsOneWidget);
  });

  testWidgets('Player screen unlocks premium content after entitlement refresh',
      (tester) async {
    final discoveryRepository = MockDiscoveryRepository();
    final detail =
        (await discoveryRepository.getAudiobookDetail('book-system-design'))!;

    final subscriptionRepository = MockSubscriptionRepository();
    final analyticsRepository = MockAnalyticsRepository();
    final appState = AppState(
      authRepository: MockAuthRepository(),
      contentRepository: discoveryRepository,
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
          home: PlayerScreen(
            appState: appState,
            audiobookId: 'book-system-design',
            initialDetail: detail,
            autoplay: false,
          ),
        ),
      ),
    );

    await tester.pump();
    await tester.pump(const Duration(milliseconds: 10));
    await tester.pumpAndSettle();

    expect(find.text('Premium locked'), findsWidgets);
    expect(find.text('Play'), findsNothing);

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

    expect(find.text('Play'), findsOneWidget);
    expect(find.text('Premium locked'), findsNothing);
    expect(find.text('CDN'), findsOneWidget);
  });
}

class _FakePlayerAudioController implements PlayerAudioControllerBase {
  final void Function()? onEnded;
  final void Function(Object error)? onError;
  int _positionMs = 0;

  _FakePlayerAudioController({
    required this.onEnded,
    required this.onError,
  });

  void triggerEnded({int? positionMs}) {
    if (positionMs != null) {
      _positionMs = positionMs;
    }
    onEnded?.call();
  }

  @override
  Future<void> dispose() async {}

  @override
  Future<void> load(String sourceUrl) async {}

  @override
  Future<void> pause() async {}

  @override
  Future<void> play() async {}

  @override
  Future<int?> readCurrentPositionMs() async => _positionMs;

  @override
  Future<void> seek(Duration position) async {
    _positionMs = position.inMilliseconds;
  }

  @override
  Future<void> setPlaybackRate(double rate) async {}
}
