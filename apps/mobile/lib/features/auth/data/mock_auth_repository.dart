import 'dart:math';

import '../domain/auth_models.dart';
import '../domain/auth_repository.dart';

class MockAuthRepository implements AuthRepository {
  final Map<String, String> _passwordByEmail = <String, String>{
    'demo@clonefanos.local': 'password123',
  };
  final Map<String, AuthUser> _userByEmail = <String, AuthUser>{
    'demo@clonefanos.local': const AuthUser(
      id: 'user-demo',
      email: 'demo@clonefanos.local',
      displayName: 'Demo User',
      avatarAssetKey: null,
      role: AuthRole.user,
      isActive: true,
    ),
  };
  final Map<String, AuthSession> _sessionByRefreshToken = <String, AuthSession>{};

  @override
  Future<AuthSession> login({
    required String email,
    required String password,
  }) async {
    final normalizedEmail = email.trim().toLowerCase();
    final existingPassword = _passwordByEmail[normalizedEmail];
    if (existingPassword == null || existingPassword != password) {
      throw StateError('Invalid credentials');
    }

    final user = _userByEmail[normalizedEmail]!;
    return _issueSession(user);
  }

  @override
  Future<AuthSession> register({
    required String displayName,
    required String email,
    required String password,
  }) async {
    final normalizedEmail = email.trim().toLowerCase();
    final user = AuthUser(
      id: 'user-${_passwordByEmail.length + 1}',
      email: normalizedEmail,
      displayName: displayName.trim(),
      avatarAssetKey: null,
      role: AuthRole.user,
      isActive: true,
    );

    _passwordByEmail[normalizedEmail] = password;
    _userByEmail[normalizedEmail] = user;
    return _issueSession(user);
  }

  @override
  Future<AuthSession> refresh({
    required String refreshToken,
  }) async {
    final existing = _sessionByRefreshToken[refreshToken];
    if (existing == null) {
      throw StateError('Invalid refresh token');
    }

    _sessionByRefreshToken.remove(refreshToken);
    return _issueSession(existing.user);
  }

  @override
  Future<void> logout({
    required String refreshToken,
  }) async {
    _sessionByRefreshToken.remove(refreshToken);
  }

  @override
  Future<AuthUser?> me({
    required String accessToken,
  }) async {
    for (final session in _sessionByRefreshToken.values) {
      if (session.accessToken == accessToken) {
        return session.user;
      }
    }

    return null;
  }

  AuthSession _issueSession(AuthUser user) {
    final now = DateTime.now().toUtc();
    final session = AuthSession(
      tokenType: 'Bearer',
      accessToken: 'access-${Random().nextInt(999999)}',
      refreshToken: 'refresh-${Random().nextInt(999999)}',
      expiresAt: now.add(const Duration(hours: 1)),
      refreshExpiresAt: now.add(const Duration(days: 30)),
      user: user,
    );
    _sessionByRefreshToken[session.refreshToken] = session;
    return session;
  }
}
