import 'dart:convert';
import 'dart:io';

import 'api_transport.dart';

class IoApiTransport implements ApiTransport {
  final HttpClient _client;

  IoApiTransport({
    HttpClient? client,
  }) : _client = client ?? HttpClient();

  @override
  Future<ApiResponse> get(
    Uri uri, {
    Map<String, String>? headers,
  }) {
    return _send('GET', uri, headers: headers);
  }

  @override
  Future<ApiResponse> postJson(
    Uri uri,
    Object body, {
    Map<String, String>? headers,
  }) {
    return _send('POST', uri, headers: headers, jsonBody: body);
  }

  @override
  Future<ApiResponse> delete(
    Uri uri, {
    Map<String, String>? headers,
  }) {
    return _send('DELETE', uri, headers: headers);
  }

  Future<ApiResponse> _send(
    String method,
    Uri uri, {
    Map<String, String>? headers,
    Object? jsonBody,
  }) async {
    final request = await _client.openUrl(method, uri);
    headers?.forEach((key, value) {
      request.headers.set(key, value);
    });
    if (jsonBody != null) {
      request.headers.contentType = ContentType.json;
      request.write(jsonEncode(jsonBody));
    }
    final response = await request.close();
    final body = await utf8.decoder.bind(response).join();
    return ApiResponse(statusCode: response.statusCode, body: body);
  }
}

ApiTransport createPlatformApiTransport() => IoApiTransport();
