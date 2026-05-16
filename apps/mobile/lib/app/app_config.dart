import 'package:flutter/foundation.dart';

class AppConfig {
  final String appName;
  final Uri apiBaseUri;

  const AppConfig({
    required this.appName,
    required this.apiBaseUri,
  });

  factory AppConfig.fromEnvironment() {
    const apiBaseUrl = String.fromEnvironment('API_BASE_URL', defaultValue: 'http://localhost:3000');
    return AppConfig(
      appName: const String.fromEnvironment('APP_NAME', defaultValue: 'Clone Fanos'),
      apiBaseUri: Uri.parse(apiBaseUrl),
    );
  }

  bool get useMockAuth => apiBaseUri.scheme == 'mock';
}

bool shouldUseMockRepositories(AppConfig config, {bool? isWeb}) {
  return config.useMockAuth || (isWeb ?? kIsWeb);
}
