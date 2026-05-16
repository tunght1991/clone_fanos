import '../../../app/app_config.dart';
import 'package:flutter/foundation.dart';
import 'auth_models.dart';
import '../data/http_auth_repository.dart';
import '../data/mock_auth_repository.dart';

abstract class AuthRepository {
  Future<AuthSession> login({
    required String email,
    required String password,
  });

  Future<AuthSession> register({
    required String displayName,
    required String email,
    required String password,
  });

  Future<AuthSession> refresh({
    required String refreshToken,
  });

  Future<void> logout({
    required String refreshToken,
  });

  Future<AuthUser?> me({
    required String accessToken,
  });
}

AuthRepository createAuthRepository(AppConfig config, {bool? isWeb}) {
  if (shouldUseMockRepositories(config, isWeb: isWeb)) {
    return MockAuthRepository();
  }

  return HttpAuthRepository(baseUri: config.apiBaseUri);
}
