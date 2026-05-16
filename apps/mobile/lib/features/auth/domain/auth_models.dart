enum AuthRole { user, admin }

class AuthUser {
  final String id;
  final String email;
  final String displayName;
  final String? avatarAssetKey;
  final AuthRole role;
  final bool isActive;

  const AuthUser({
    required this.id,
    required this.email,
    required this.displayName,
    required this.avatarAssetKey,
    required this.role,
    required this.isActive,
  });
}

class AuthSession {
  final String tokenType;
  final String accessToken;
  final String refreshToken;
  final DateTime expiresAt;
  final DateTime refreshExpiresAt;
  final AuthUser user;

  const AuthSession({
    required this.tokenType,
    required this.accessToken,
    required this.refreshToken,
    required this.expiresAt,
    required this.refreshExpiresAt,
    required this.user,
  });
}

