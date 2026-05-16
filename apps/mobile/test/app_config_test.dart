import 'package:flutter_test/flutter_test.dart';

import 'package:clone_fanos_mobile/app/app_config.dart';
import 'package:clone_fanos_mobile/features/auth/domain/auth_repository.dart';
import 'package:clone_fanos_mobile/features/auth/data/mock_auth_repository.dart';
import 'package:clone_fanos_mobile/features/discovery/domain/discovery_repository.dart';
import 'package:clone_fanos_mobile/features/discovery/data/mock_discovery_repository.dart';
import 'package:clone_fanos_mobile/features/engagement/domain/engagement_repository.dart';
import 'package:clone_fanos_mobile/features/engagement/data/mock_engagement_repository.dart';
import 'package:clone_fanos_mobile/features/player/domain/player_repository.dart';
import 'package:clone_fanos_mobile/features/player/data/mock_player_repository.dart';
import 'package:clone_fanos_mobile/features/subscription/domain/subscription_repository.dart';
import 'package:clone_fanos_mobile/features/subscription/data/mock_subscription_repository.dart';

void main() {
  test('web runtime uses mock repositories even when API base url is http', () {
    final config = AppConfig(
      appName: 'Clone Fanos',
      apiBaseUri: Uri.parse('http://localhost:3000'),
    );

    expect(shouldUseMockRepositories(config, isWeb: true), isTrue);
    expect(createAuthRepository(config, isWeb: true), isA<MockAuthRepository>());
    expect(createDiscoveryRepository(config, isWeb: true), isA<MockDiscoveryRepository>());
    expect(createPlayerRepository(config, isWeb: true), isA<MockPlayerRepository>());
    expect(createEngagementRepository(config, isWeb: true), isA<MockEngagementRepository>());
    expect(createSubscriptionRepository(config, isWeb: true), isA<MockSubscriptionRepository>());
  });
}
