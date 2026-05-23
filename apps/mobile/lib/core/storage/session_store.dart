import '../../features/auth/domain/auth_models.dart';
import 'session_store_io.dart' if (dart.library.html) 'session_store_web.dart';

abstract class SessionStore {
  Future<AuthSession?> read();
  Future<void> write(AuthSession session);
  Future<void> clear();
}

class InMemorySessionStore implements SessionStore {
  AuthSession? _session;

  @override
  Future<AuthSession?> read() async => _session;

  @override
  Future<void> write(AuthSession session) async {
    _session = session;
  }

  @override
  Future<void> clear() async {
    _session = null;
  }
}

SessionStore createSessionStore() => createPlatformSessionStore();
