import 'dart:convert';
import 'dart:html' as html;

import 'api_transport.dart';

class WebApiTransport implements ApiTransport {
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
    final requestHeaders = <String, String>{
      ...?headers,
      if (jsonBody != null) 'Content-Type': 'application/json',
    };

    final request = await html.HttpRequest.request(
      uri.toString(),
      method: method,
      requestHeaders: requestHeaders,
      sendData: jsonBody == null ? null : jsonEncode(jsonBody),
      responseType: 'text',
    );

    return ApiResponse(
      statusCode: request.status ?? 0,
      body: request.responseText ?? '',
    );
  }
}

ApiTransport createPlatformApiTransport() => WebApiTransport();
