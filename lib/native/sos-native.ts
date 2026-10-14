/**
 * Native SOS location bridge — web no-op.
 *
 * The mobile client is a native Flutter app (see lib/ and android/); it does
 * not embed this web app, so there is no native GPS bridge to subscribe to.
 * These stubs keep the emergency panel's call sites uniform while the web
 * path uses navigator.geolocation exclusively.
 */

export type SosLocationFix = { lat: number; lng: number; timestamp: number };

/** Always false — the native bridge lives in the Flutter app, not the web app. */
export function isNativeSosAvailable(): boolean {
  return false;
}

/** Never subscribes on the web; callers keep their browser geolocation loop. */
export async function onNativeLocation(
  _handler: (location: SosLocationFix) => void
): Promise<(() => void) | null> {
  return null;
}
