import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'api.dart';
import 'session.dart';
import 'sos_screen.dart';

void main() => runApp(const SkoraCareApp());

class SkoraCareApp extends StatelessWidget {
  const SkoraCareApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SkoraCare',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0E7490),
          brightness: Brightness.light,
        ),
        useMaterial3: true,
      ),
      home: const _Gate(),
    );
  }
}

/// Decides between the login screen and the SOS screen from the stored token.
class _Gate extends StatefulWidget {
  const _Gate();

  @override
  State<_Gate> createState() => _GateState();
}

class _GateState extends State<_Gate> {
  late Future<bool> _signedIn;

  @override
  void initState() {
    super.initState();
    _signedIn = _hasSession();
  }

  Future<bool> _hasSession() async {
    const storage = FlutterSecureStorage();
    return storage.containsKey(key: 'skoracare_session_token');
  }

  void _refresh() => setState(() => _signedIn = _hasSession());

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<bool>(
      future: _signedIn,
      builder: (context, snap) {
        if (!snap.hasData) {
          return const Scaffold(body: Center(child: CircularProgressIndicator()));
        }
        return snap.data!
            ? const SosScreen(key: ValueKey('sos'))
            : LoginScreen(key: const ValueKey('login'), onAuthenticated: _refresh);
      },
    );
  }
}

/// Email + password sign-in. The server issues the session cookie in the
/// response body (`sessionToken`) for native clients.
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, required this.onAuthenticated});

  final VoidCallback onAuthenticated;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final res = await Api.instance.post('/api/mobile/login', body: {
        'email': _email.text.trim(),
        'password': _password.text,
      }) as Map<String, dynamic>;

      final token = res['sessionToken'];
      if (token is! String || token.isEmpty) {
        setState(() => _error = 'The server did not return a session token.');
        return;
      }
      await Session.save(token);
      widget.onAuthenticated();
    } on ApiException catch (e) {
      setState(() => _error = e.isUnauthorized || e.isForbidden ? 'Invalid credentials.' : e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 400),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text('SkoraCare',
                    style: Theme.of(context).textTheme.headlineMedium,
                    textAlign: TextAlign.center),
                const SizedBox(height: 32),
                TextField(
                  controller: _email,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(
                    labelText: 'Email',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _password,
                  obscureText: true,
                  decoration: const InputDecoration(
                    labelText: 'Password',
                    border: OutlineInputBorder(),
                  ),
                  onSubmitted: (_) => _submit(),
                ),
                if (_error != null) ...[
                  const SizedBox(height: 16),
                  Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
                ],
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: _busy ? null : _submit,
                  child: _busy
                      ? const SizedBox(
                          height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                      : const Text('Sign in'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
