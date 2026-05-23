import 'package:flutter_test/flutter_test.dart';

import 'package:clone_fanos_mobile/app/app_config.dart';
import 'package:clone_fanos_mobile/features/auth/domain/auth_repository.dart';
import 'package:clone_fanos_mobile/features/auth/data/mock_auth_repository.dart';
import 'package:clone_fanos_mobile/features/auth/data/http_auth_repository.dart';
import 'package:clone_fanos_mobile/features/discovery/domain/discovery_repository.dart';
import 'package:clone_fanos_mobile/features/discovery/data/mock_discovery_repository.dart';
import 'package:clone_fanos_mobile/features/discovery/data/http_discovery_repository.dart';
import 'package:clone_fanos_mobile/features/engagement/domain/engagement_repository.dart';
import 'package:clone_fanos_mobile/features/engagement/data/mock_engagement_repository.dart';
import 'package:clone_fanos_mobile/features/engagement/data/http_engagement_repository.dart';
import 'package:clone_fanos_mobile/features/player/domain/player_repository.dart';
import 'package:clone_fanos_mobile/features/player/data/mock_player_repository.dart';
import 'package:clone_fanos_mobile/features/player/data/http_player_repository.dart';
import 'package:clone_fanos_mobile/features/subscription/domain/subscription_repository.dart';
import 'package:clone_fanos_mobile/features/subscription/data/mock_subscription_repository.dart';
import 'package:clone_fanos_mobile/features/subscription/data/http_subscription_repository.dart';

void main() {
  test('http api base url uses api repositories by default', () {
    final config = AppConfig(
      appName: 'Clone Fanos',
      apiBaseUri: Uri.parse('http://localhost:3000'),
    );

    expect(shouldUseMockRepositories(config), isFalse);
    expect(createAuthRepository(config), isA<HttpAuthRepository>());
    expect(createDiscoveryRepository(config), isA<HttpDiscoveryRepository>());
    expect(createPlayerRepository(config), isA<HttpPlayerRepository>());
    expect(createEngagementRepository(config), isA<HttpEngagementRepository>());
    expect(createSubscriptionRepository(config),
        isA<HttpSubscriptionRepository>());
  });

  test('explicit mock mode still forces mock repositories', () {
    final config = AppConfig(
      appName: 'Clone Fanos',
      apiBaseUri: Uri.parse('http://localhost:3000'),
      useMockRepositories: true,
    );

    expect(shouldUseMockRepositories(config), isTrue);
    expect(createAuthRepository(config), isA<MockAuthRepository>());
    expect(createDiscoveryRepository(config), isA<MockDiscoveryRepository>());
    expect(createPlayerRepository(config), isA<MockPlayerRepository>());
    expect(createEngagementRepository(config), isA<MockEngagementRepository>());
    expect(createSubscriptionRepository(config),
        isA<MockSubscriptionRepository>());
  });

  test('mock api base url still forces mock repositories', () {
    final config = AppConfig(
      appName: 'Clone Fanos',
      apiBaseUri: Uri.parse('mock://demo'),
    );

    expect(shouldUseMockRepositories(config), isTrue);
    expect(createAuthRepository(config), isA<MockAuthRepository>());
  });
}
