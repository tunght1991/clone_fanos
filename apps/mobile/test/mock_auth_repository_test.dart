import 'package:flutter_test/flutter_test.dart';

import 'package:clone_fanos_mobile/features/auth/data/mock_auth_repository.dart';

void main() {
  test('MockAuthRepository accepts the seeded demo account', () async {
    final repository = MockAuthRepository();

    final session = await repository.login(
      email: 'demo@clonefanos.local',
      password: 'password123',
    );

    expect(session.user.displayName, 'Demo User');
    expect(session.accessToken.isNotEmpty, true);
  });

  test('MockAuthRepository accepts the seeded admin account', () async {
    final repository = MockAuthRepository();

    final session = await repository.login(
      email: 'admin@fonos.test',
      password: 'Secret123!',
    );

    expect(session.user.displayName, 'Admin One');
    expect(session.user.role.name, 'admin');
  });

  test('MockAuthRepository returns null for unknown access token', () async {
    final repository = MockAuthRepository();

    final user = await repository.me(accessToken: 'invalid-token');

    expect(user, isNull);
  });
}
