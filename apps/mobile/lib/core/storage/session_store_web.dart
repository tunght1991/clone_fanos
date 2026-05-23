import 'dart:convert';
import 'dart:html' as html;

import '../../features/auth/domain/auth_models.dart';
import 'session_store.dart';

class BrowserSessionStore implements SessionStore {
  static const _storageKey = 'clone_fanos.session';

  @override
  Future<AuthSession?> read() async {
    final raw = html.window.localStorage[_storageKey];
    if (raw == null || raw.isEmpty) {
      return null;
    }

    try {
      return AuthSession.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      await clear();
      return null;
    }
  }

  @override
  Future<void> write(AuthSession session) async {
    html.window.localStorage[_storageKey] = jsonEncode(session.toJson());
  }

  @override
  Future<void> clear() async {
    html.window.localStorage.remove(_storageKey);
  }
}

SessionStore createPlatformSessionStore() => BrowserSessionStore();
