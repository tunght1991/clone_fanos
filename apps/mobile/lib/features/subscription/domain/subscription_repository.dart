import '../../../app/app_config.dart';
import 'subscription_models.dart';
import '../data/http_subscription_repository.dart';
import '../data/mock_subscription_repository.dart';

abstract class SubscriptionRepository {
  Future<List<SubscriptionPlan>> getPlans({
    required String? userId,
    required String? accessToken,
  });

  Future<SubscriptionState?> getMySubscription({
    required String? userId,
    required String? accessToken,
  });

  Future<SubscriptionState?> verifySubscription({
    required String? userId,
    required String? accessToken,
    SubscriptionVerifyRequest? request,
  });

  Future<SubscriptionCheckoutResult> checkout({
    required SubscriptionCheckoutRequest request,
    required String? userId,
    required String? accessToken,
  });
}

SubscriptionRepository createSubscriptionRepository(AppConfig config) {
  if (shouldUseMockRepositories(config)) {
    return MockSubscriptionRepository();
  }

  return HttpSubscriptionRepository(baseUri: config.apiBaseUri);
}
