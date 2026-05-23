class AppConfig {
  final String appName;
  final Uri apiBaseUri;
  final bool useMockRepositories;

  const AppConfig({
    required this.appName,
    required this.apiBaseUri,
    this.useMockRepositories = false,
  });

  factory AppConfig.fromEnvironment() {
    const apiBaseUrl = String.fromEnvironment('API_BASE_URL',
        defaultValue: 'http://localhost:3000');
    const useMockRepositories =
        bool.fromEnvironment('USE_MOCK_REPOSITORIES', defaultValue: false);
    final apiBaseUri = Uri.parse(apiBaseUrl);
    return AppConfig(
      appName:
          const String.fromEnvironment('APP_NAME', defaultValue: 'Clone Fanos'),
      apiBaseUri: apiBaseUri,
      useMockRepositories: useMockRepositories || apiBaseUri.scheme == 'mock',
    );
  }

  bool get isMockMode => useMockRepositories || apiBaseUri.scheme == 'mock';
}

bool shouldUseMockRepositories(AppConfig config) {
  return config.isMockMode;
}
