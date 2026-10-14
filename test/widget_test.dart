// SkoraCare app smoke tests.
//
// The SOS screen needs a live backend, GPS and permissions, and the session
// gate reads the platform keystore (no plugin mock in the unit-test
// environment), so this only asserts the app boots into the gate.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:skoracare/main.dart';

void main() {
  testWidgets('app boots into the session gate', (tester) async {
    await tester.pumpWidget(const SkoraCareApp());
    await tester.pump();
    expect(find.byType(MaterialApp), findsOneWidget);
    // The gate shows a spinner while it checks for a stored session token.
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });
}
