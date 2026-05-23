import 'api_transport_io.dart' if (dart.library.html) 'api_transport_web.dart';

class ApiResponse {
  final int statusCode;
  final String body;

  const ApiResponse({
    required this.statusCode,
    required this.body,
  });
}

class ApiException implements Exception {
  final String method;
  final Uri uri;
  final int statusCode;
  final String body;

  const ApiException({
    required this.method,
    required this.uri,
    required this.statusCode,
    required this.body,
  });

  @override
  String toString() {
    return 'ApiException($method $uri, statusCode: $statusCode, body: $body)';
  }
}

abstract class ApiTransport {
  Future<ApiResponse> get(
    Uri uri, {
    Map<String, String>? headers,
  });

  Future<ApiResponse> postJson(
    Uri uri,
    Object body, {
    Map<String, String>? headers,
  });

  Future<ApiResponse> delete(
    Uri uri, {
    Map<String, String>? headers,
  });
}

ApiTransport createApiTransport() => createPlatformApiTransport();
