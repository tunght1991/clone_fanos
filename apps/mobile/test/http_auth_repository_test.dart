import 'package:flutter_test/flutter_test.dart';

import 'package:clone_fanos_mobile/core/network/api_transport.dart';
import 'package:clone_fanos_mobile/features/auth/data/http_auth_repository.dart';

void main() {
  test('HttpAuthRepository parses /auth/me response', () async {
    final transport = _FakeTransport(
      getResponse: const ApiResponse(
        statusCode: 200,
        body: '''
        {
          "user": {
            "id": "user-1",
            "email": "demo@clonefanos.local",
            "displayName": "Demo User",
            "avatarAssetKey": null,
            "role": "user",
            "isActive": true
          }
        }
        ''',
      ),
    );
    final repository = HttpAuthRepository(
      baseUri: Uri.parse('http://localhost:3000'),
      transport: transport,
    );

    final user = await repository.me(accessToken: 'access-1');

    expect(user?.email, 'demo@clonefanos.local');
    expect(transport.lastGetHeaders?['Authorization'], 'Bearer access-1');
  });
}

class _FakeTransport implements ApiTransport {
  final ApiResponse? getResponse;
  Map<String, String>? lastGetHeaders;

  _FakeTransport({
    this.getResponse,
  });

  @override
  Future<ApiResponse> delete(
    Uri uri, {
    Map<String, String>? headers,
  }) async {
    return const ApiResponse(statusCode: 200, body: '');
  }

  @override
  Future<ApiResponse> get(
    Uri uri, {
    Map<String, String>? headers,
  }) async {
    lastGetHeaders = headers;
    return getResponse ?? const ApiResponse(statusCode: 404, body: '');
  }

  @override
  Future<ApiResponse> postJson(
    Uri uri,
    Object body, {
    Map<String, String>? headers,
  }) async {
    return const ApiResponse(statusCode: 200, body: '{}');
  }
}
