/// Session storage — the JWT cookie issued by `/login`.
///
/// Web auth uses an HttpOnly cookie; a native client cannot read that, so the
/// API returns the token in the login response body and the client replays it
/// as a `Cookie: session=…` header. The token is held in the platform keystore
/// (Android Keystore / iOS Keychain) via flutter_secure_storage.
library;

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class Session {
  Session._();

  static const _tokenKey = 'skoracare_session_token';

  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  /// The current session token, or null when signed out.
  static Future<String?> token() => _storage.read(key: _tokenKey);

  static Future<void> save(String token) => _storage.write(key: _tokenKey, value: token);

  static Future<void> clear() => _storage.delete(key: _tokenKey);
}
