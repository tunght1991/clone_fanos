import 'dart:convert';
import 'dart:io';

import '../domain/auth_models.dart';
import '../domain/auth_repository.dart';

class HttpAuthRepository implements AuthRepository {
  final Uri baseUri;
  final HttpClient _client;

  HttpAuthRepository({
    required this.baseUri,
    HttpClient? client,
  }) : _client = client ?? HttpClient();

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

  Future<AuthSession> _postAuthSession(String path, Map<String, dynamic> body) async {
    final json = await _postJson(path, body);
    return _parseSession(json);
  }

  Future<Map<String, dynamic>> _postJson(String path, Map<String, dynamic> body) async {
    final request = await _client.postUrl(baseUri.resolve(path));
    request.headers.contentType = ContentType.json;
    request.write(jsonEncode(body));
    final response = await request.close();
    final payload = await utf8.decoder.bind(response).join();

    if (response.statusCode >= 400) {
      throw HttpException('Request failed: ${response.statusCode} $payload');
    }

    if (payload.trim().isEmpty) {
      return <String, dynamic>{};
    }

    return jsonDecode(payload) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>?> _getJson(String path, {required String accessToken}) async {
    final request = await _client.getUrl(baseUri.resolve(path));
    request.headers.set(HttpHeaders.authorizationHeader, 'Bearer $accessToken');
    final response = await request.close();
    final payload = await utf8.decoder.bind(response).join();

    if (response.statusCode == HttpStatus.notFound) {
      return null;
    }

    if (response.statusCode >= 400) {
      throw HttpException('Request failed: ${response.statusCode} $payload');
    }

    if (payload.trim().isEmpty) {
      return null;
    }

    return jsonDecode(payload) as Map<String, dynamic>;
  }

  AuthSession _parseSession(Map<String, dynamic> json) {
    return AuthSession(
      tokenType: json['tokenType'] as String? ?? 'Bearer',
      accessToken: json['accessToken'] as String? ?? '',
      refreshToken: json['refreshToken'] as String? ?? '',
      expiresAt: DateTime.parse(json['expiresAt'] as String? ?? DateTime.now().toIso8601String()),
      refreshExpiresAt: DateTime.parse(
        json['refreshExpiresAt'] as String? ?? DateTime.now().toIso8601String(),
      ),
      user: _parseUser((json['user'] as Map<String, dynamic>?) ?? const <String, dynamic>{}),
    );
  }

  AuthUser _parseUser(Map<String, dynamic> json) {
    return AuthUser(
      id: json['id'] as String? ?? '',
      email: json['email'] as String? ?? '',
      displayName: json['displayName'] as String? ?? '',
      avatarAssetKey: json['avatarAssetKey'] as String?,
      role: (json['role'] as String? ?? 'user') == 'admin' ? AuthRole.admin : AuthRole.user,
      isActive: json['isActive'] as bool? ?? true,
    );
  }
}

