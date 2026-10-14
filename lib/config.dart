/// SkoraCare app configuration.
///
/// [apiBaseUrl] points at the deployed PWA's Next.js origin — the mobile app
/// consumes the same `/api/*` routes the web app uses (the server actions stay
/// web-only). Override per build:
///
///   flutter run --dart-define=SOS_API_URL=https://skoracare.app
library;

const String apiBaseUrl = String.fromEnvironment(
  'SOS_API_URL',
  defaultValue: 'http://10.0.2.2:3100', // Android emulator -> host dev server
);

/// Minimum app version the server accepts (bump when the API contract changes).
const int apiVersion = 1;
