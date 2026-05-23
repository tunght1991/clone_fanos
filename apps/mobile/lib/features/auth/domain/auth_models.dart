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

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: json['id'] as String? ?? '',
      email: json['email'] as String? ?? '',
      displayName: json['displayName'] as String? ?? '',
      avatarAssetKey: json['avatarAssetKey'] as String?,
      role: (json['role'] as String? ?? 'user') == 'admin'
          ? AuthRole.admin
          : AuthRole.user,
      isActive: json['isActive'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'email': email,
      'displayName': displayName,
      'avatarAssetKey': avatarAssetKey,
      'role': role.name,
      'isActive': isActive,
    };
  }
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

  factory AuthSession.fromJson(Map<String, dynamic> json) {
    return AuthSession(
      tokenType: json['tokenType'] as String? ?? 'Bearer',
      accessToken: json['accessToken'] as String? ?? '',
      refreshToken: json['refreshToken'] as String? ?? '',
      expiresAt: DateTime.parse(
          json['expiresAt'] as String? ?? DateTime.now().toIso8601String()),
      refreshExpiresAt: DateTime.parse(
        json['refreshExpiresAt'] as String? ?? DateTime.now().toIso8601String(),
      ),
      user: AuthUser.fromJson(
          (json['user'] as Map<String, dynamic>?) ?? const <String, dynamic>{}),
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'tokenType': tokenType,
      'accessToken': accessToken,
      'refreshToken': refreshToken,
      'expiresAt': expiresAt.toIso8601String(),
      'refreshExpiresAt': refreshExpiresAt.toIso8601String(),
      'user': user.toJson(),
    };
  }
}
