abstract class OnboardingStore {
  Future<bool> isCompleted();
  Future<void> markCompleted();
}

class InMemoryOnboardingStore implements OnboardingStore {
  bool _completed = false;

  @override
  Future<bool> isCompleted() async => _completed;

  @override
  Future<void> markCompleted() async {
    _completed = true;
  }
}

