/// Typed API client for the SkoraCare Next.js backend.
///
/// Mirrors the routes the web app calls. Errors are surfaced as [ApiException]
/// carrying the HTTP status so callers can distinguish 401 (re-login) from a
/// genuine failure.
library;

import 'dart:convert';

import 'package:http/http.dart' as http;

import 'config.dart';
import 'session.dart';

class ApiException implements Exception {
  ApiException(this.status, this.message);
  final int status;
  final String message;

  bool get isUnauthorized => status == 401;
  bool get isForbidden => status == 403;

  @override
  String toString() => 'ApiException($status): $message';
}

class Api {
  Api._();
  static final Api instance = Api._();

  final _client = http.Client();

  Future<Map<String, String>> _headers() async {
    final token = await Session.token();
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      // Must match SESSION_COOKIE in lib/auth/session.ts.
      if (token != null) 'Cookie': 'skora_session=$token',
    };
  }

  Uri _uri(String path, [Map<String, String>? query]) =>
      Uri.parse('$apiBaseUrl$path').replace(queryParameters: query);

  Future<dynamic> get(String path, {Map<String, String>? query}) async {
    final res = await _client.get(_uri(path, query), headers: await _headers());
    return _decode(res);
  }

  Future<dynamic> post(String path, {Object? body}) async {
    final res = await _client.post(
      _uri(path),
      headers: await _headers(),
      body: jsonEncode(body ?? const {}),
    );
    return _decode(res);
  }

  dynamic _decode(http.Response res) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      if (res.body.isEmpty) return null;
      return jsonDecode(res.body);
    }
    String message = res.reasonPhrase ?? 'Request failed';
    try {
      final decoded = jsonDecode(res.body);
      if (decoded is Map && decoded['error'] is String) {
        message = decoded['error'] as String;
      }
    } on FormatException {
      // Non-JSON error body (HTML error page) — keep the reason phrase.
    }
    throw ApiException(res.statusCode, message);
  }

  void dispose() => _client.close();
}
