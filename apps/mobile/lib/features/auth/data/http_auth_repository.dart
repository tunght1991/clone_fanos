import 'dart:convert';

import '../../../core/network/api_transport.dart';
import '../domain/auth_models.dart';
import '../domain/auth_repository.dart';

class HttpAuthRepository implements AuthRepository {
  final Uri baseUri;
  final ApiTransport _transport;

  HttpAuthRepository({
    required this.baseUri,
    ApiTransport? transport,
  }) : _transport = transport ?? createApiTransport();

  @override
  Future<AuthSession> login({
    required String email,
    required String password,
  }) {
    return _postAuthSession('/auth/login', {
      'email': email,
      'password': password,
    });
  }

  @override
  Future<AuthSession> register({
    required String displayName,
    required String email,
    required String password,
  }) {
    return _postAuthSession('/auth/register', {
      'displayName': displayName,
      'email': email,
      'password': password,
    });
  }

  @override
  Future<AuthSession> refresh({
    required String refreshToken,
  }) {
    return _postAuthSession('/auth/refresh', {
      'refreshToken': refreshToken,
    });
  }

  @override
  Future<void> logout({
    required String refreshToken,
  }) async {
    await _postJson('/auth/logout', {
      'refreshToken': refreshToken,
    });
  }

  @override
  Future<AuthUser?> me({
    required String accessToken,
  }) async {
    final response = await _getJson('/auth/me', accessToken: accessToken);
    if (response == null) {
      return null;
    }

    return _parseUser(response['user'] as Map<String, dynamic>? ?? response);
  }

  Future<AuthSession> _postAuthSession(
      String path, Map<String, dynamic> body) async {
    final json = await _postJson(path, body);
    return _parseSession(json);
  }

  Future<Map<String, dynamic>> _postJson(
      String path, Map<String, dynamic> body) async {
    final uri = baseUri.resolve(path);
    final response = await _transport.postJson(uri, body);

    if (response.statusCode >= 400) {
      throw ApiException(
        method: 'POST',
        uri: uri,
        statusCode: response.statusCode,
        body: response.body,
      );
    }

    if (response.body.trim().isEmpty) {
      return <String, dynamic>{};
    }

    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>?> _getJson(String path,
      {required String accessToken}) async {
    final uri = baseUri.resolve(path);
    final response = await _transport.get(
      uri,
      headers: <String, String>{
        'Authorization': 'Bearer $accessToken',
      },
    );

    if (response.statusCode == 404) {
      return null;
    }

    if (response.statusCode >= 400) {
      throw ApiException(
        method: 'GET',
        uri: uri,
        statusCode: response.statusCode,
        body: response.body,
      );
    }

    if (response.body.trim().isEmpty) {
      return null;
    }

    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  AuthSession _parseSession(Map<String, dynamic> json) {
    return AuthSession(
      tokenType: json['tokenType'] as String? ?? 'Bearer',
      accessToken: json['accessToken'] as String? ?? '',
      refreshToken: json['refreshToken'] as String? ?? '',
      expiresAt: DateTime.parse(
          json['expiresAt'] as String? ?? DateTime.now().toIso8601String()),
      refreshExpiresAt: DateTime.parse(
        json['refreshExpiresAt'] as String? ?? DateTime.now().toIso8601String(),
      ),
      user: _parseUser(
          (json['user'] as Map<String, dynamic>?) ?? const <String, dynamic>{}),
    );
  }

  AuthUser _parseUser(Map<String, dynamic> json) => AuthUser.fromJson(json);
}
