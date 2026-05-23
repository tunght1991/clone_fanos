import 'package:flutter_test/flutter_test.dart';

import 'package:clone_fanos_mobile/features/auth/domain/auth_models.dart';

void main() {
  test('AuthSession serializes and deserializes symmetrically', () {
    final session = AuthSession(
      tokenType: 'Bearer',
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      expiresAt: DateTime.utc(2026, 6, 1, 0, 0, 0),
      refreshExpiresAt: DateTime.utc(2026, 7, 1, 0, 0, 0),
      user: AuthUser(
        id: 'user-1',
        email: 'demo@clonefanos.local',
        displayName: 'Demo User',
        avatarAssetKey: null,
        role: AuthRole.user,
        isActive: true,
      ),
    );

    final decoded = AuthSession.fromJson(session.toJson());

    expect(decoded.tokenType, session.tokenType);
    expect(decoded.accessToken, session.accessToken);
    expect(decoded.refreshToken, session.refreshToken);
    expect(decoded.expiresAt, session.expiresAt);
    expect(decoded.refreshExpiresAt, session.refreshExpiresAt);
    expect(decoded.user.displayName, session.user.displayName);
  });
}
