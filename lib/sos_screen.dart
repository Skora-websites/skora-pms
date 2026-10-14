/// Emergency SOS screen.
///
/// A doctor on duty triggers an emergency case, and this screen is the native
/// counterpart of the web `/doctor/emergency` panel:
///   - trigger an SOS request with the current GPS fix
///   - stream live location to the request while it is being dispatched
///   - poll the status endpoint for arrival / completion transitions
///
/// Live streaming uses [Geolocator.getPositionStream] directly: a native
/// process keeps receiving fixes in the background, which is exactly what the
/// foreground service provided in the earlier hybrid design — without any
/// platform channel.
library;

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:permission_handler/permission_handler.dart';

import 'api.dart';

enum SosState { idle, locating, dispatching, enRoute, arrived, completed, failed }

class SosScreen extends StatefulWidget {
  const SosScreen({super.key});

  @override
  State<SosScreen> createState() => _SosScreenState();
}

class _SosScreenState extends State<SosScreen> {
  SosState _state = SosState.idle;
  String? _error;
  int? _requestId;
  StreamSubscription<Position>? _positionSub;
  Timer? _pollTimer;

  @override
  void dispose() {
    _positionSub?.cancel();
    _pollTimer?.cancel();
    super.dispose();
  }

  Future<bool> _ensurePermission() async {
    var status = await Permission.location.status;
    if (status.isGranted) return true;
    status = await Permission.location.request();
    return status.isGranted || status.isLimited;
  }

  Future<void> _triggerSos() async {
    setState(() {
      _error = null;
      _state = SosState.locating;
    });

    if (!await _ensurePermission()) {
      setState(() {
        _state = SosState.failed;
        _error = 'Location permission denied — SOS needs it to dispatch a doctor.';
      });
      return;
    }

    try {
      final fix = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.best,
          timeLimit: Duration(seconds: 20),
        ),
      );
      setState(() => _state = SosState.dispatching);

      final res = await Api.instance.post('/api/mobile/sos/trigger', body: {
        'latitude': fix.latitude,
        'longitude': fix.longitude,
        'radiusKm': 10,
      }) as Map<String, dynamic>;

      final id = res['requestId'];
      if (id is! int) {
        setState(() {
          _state = SosState.failed;
          _error = 'The server did not return a request id.';
        });
        return;
      }

      setState(() {
        _requestId = id;
        _state = SosState.enRoute;
      });
      _startStreaming(id);
      _startPolling(id);
    } on ApiException catch (e) {
      setState(() {
        _state = SosState.failed;
        _error = e.message;
      });
    } on TimeoutException {
      setState(() {
        _state = SosState.failed;
        _error = 'Could not get a GPS fix in time. Move somewhere with a clear sky view.';
      });
    }
  }

  /// Pushes the doctor's own position into the case so the patient tracker can
  /// follow it. Native processes keep receiving these fixes in the background.
  void _startStreaming(int requestId) {
    _positionSub?.cancel();
    _positionSub = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.best,
        distanceFilter: 5,
      ),
    ).listen((fix) async {

      if (_state != SosState.enRoute && _state != SosState.arrived) return;
      try {
        await Api.instance.post('/api/mobile/sos/$requestId/location', body: {
          'latitude': fix.latitude,
          'longitude': fix.longitude,
        });
      } on ApiException {
        // A dropped fix is retried by the next stream event — never fatal.
      }
    });
  }

  void _startPolling(int requestId) {
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(const Duration(seconds: 5), (_) => _refreshStatus(requestId));
  }

  Future<void> _refreshStatus(int requestId) async {
    try {
      final res = await Api.instance.get('/api/patient/sos/status/$requestId')
          as Map<String, dynamic>;
      final arrived = res['arrivedAt'];
      final completed = res['otpVerifiedAt'];
      if (!mounted) return;
      setState(() {
        _state = completed != null
            ? SosState.completed
            : arrived != null
                ? SosState.arrived
                : SosState.enRoute;
      });
    } on ApiException {
      // Transient — the next tick retries.
    }
  }

  Future<void> _cancel() async {
    final id = _requestId;
    if (id == null) return;
    try {
      await Api.instance.post('/api/mobile/sos/$id/cancel');
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    }
    await _reset();
  }

  Future<void> _reset() async {
    _positionSub?.cancel();
    _pollTimer?.cancel();
    if (!mounted) return;
    setState(() {
      _state = SosState.idle;
      _requestId = null;
      _error = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Emergency SOS')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _StatusCard(state: _state, error: _error, requestId: _requestId),
            const Spacer(),
            if (_state == SosState.idle || _state == SosState.failed)
              _SosButton(
                enabled: _state == SosState.idle,
                onPressed: _triggerSos,
              ),
            if (_state.index >= SosState.dispatching.index &&
                _state.index <= SosState.arrived.index)
              OutlinedButton.icon(
                onPressed: _cancel,
                icon: const Icon(Icons.close),
                label: const Text('Cancel request'),
              ),
            if (_state == SosState.completed)
              FilledButton.icon(
                onPressed: _reset,
                icon: const Icon(Icons.check),
                label: const Text('Done'),
              ),
            const SizedBox(height: 24),
            Text(
              'If this is a medical emergency, call your local emergency number now.',
              style: theme.textTheme.bodySmall,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class _StatusCard extends StatelessWidget {
  const _StatusCard({required this.state, this.error, this.requestId});

  final SosState state;
  final String? error;
  final int? requestId;

  @override
  Widget build(BuildContext context) {
    final (title, body, color) = switch (state) {
      SosState.idle => ('Ready', 'Press the button to dispatch a doctor to your location.',
          Theme.of(context).colorScheme.primary),
      SosState.locating => ('Getting your location…', 'High-accuracy GPS fix in progress.', Colors.orange),
      SosState.dispatching => ('Dispatching…', 'Alerting doctors on duty near you.', Colors.orange),
      SosState.enRoute => ('Doctor on the way', 'Your position is being shared live.', Colors.green),
      SosState.arrived => ('Doctor has arrived', 'Confirm your identity with the arrival code.', Colors.green),
      SosState.completed => ('Visit complete', 'Stay safe. Tap Done to finish.', Colors.green),
      SosState.failed => ('SOS failed', error ?? 'Please try again.', Colors.red),
    };

    return Card(
      color: color.withValues(alpha: 0.08),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 4),
            Text(body),
            if (requestId != null) ...[
              const SizedBox(height: 8),
              Text('Request #$requestId', style: Theme.of(context).textTheme.labelSmall),
            ],
          ],
        ),
      ),
    );
  }
}

class _SosButton extends StatelessWidget {
  const _SosButton({required this.enabled, required this.onPressed});

  final bool enabled;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 220,
      child: FilledButton(
        style: FilledButton.styleFrom(
          backgroundColor: Colors.red.shade600,
          shape: const CircleBorder(),
        ),
        onPressed: enabled ? onPressed : null,
        child: const Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.emergency, size: 72),
            SizedBox(height: 8),
            Text('SOS', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }
}
