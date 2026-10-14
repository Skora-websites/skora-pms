/**
 * Native SOS location bridge.
 *
 * The browser geolocation API stops delivering fixes as soon as the page is
 * hidden, so the Android shell runs a foreground service instead and streams
 * updates through this module. Everything here is a no-op on the web, where
 * the existing navigator.geolocation loop remains the (only) path.
 */

export type SosNativeStatus = {
  tracking: boolean;
  lastLocation: { lat: number; lng: number; timestamp: number } | null;
};

type SosLocationPlugin = {
  startTracking(): Promise<void>;
  stopTracking(): Promise<void>;
  getStatus(): Promise<SosNativeStatus>;
  addListener(
    event: "location",
    handler: (payload: { lat: number; lng: number; timestamp: number }) => void
  ): Promise<{ remove: () => void }>;
};

type CapacitorGlobal = {
  Capacitor?: { isNativePlatform?: () => boolean };
};

/** True only inside the Capacitor Android shell. */
export function isNativeSosAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    Boolean((window as unknown as CapacitorGlobal).Capacitor?.isNativePlatform?.())
  );
}

/**
 * Resolves the plugin lazily so the web build never imports @capacitor/core's
 * native shims. Returns null off-device.
 */
async function getPlugin(): Promise<SosLocationPlugin | null> {
  if (!isNativeSosAvailable()) return null;
  const { registerPlugin } = await import("@capacitor/core");
  return registerPlugin("SosLocation") as unknown as SosLocationPlugin;
}

export async function startNativeTracking(): Promise<void> {
  const plugin = await getPlugin();
  await plugin?.startTracking();
}

export async function stopNativeTracking(): Promise<void> {
  const plugin = await getPlugin();
  await plugin?.stopTracking();
}

export async function nativeStatus(): Promise<SosNativeStatus | null> {
  const plugin = await getPlugin();
  if (!plugin) return null;
  return plugin.getStatus();
}

/**
 * Subscribes to native location updates. Returns a disposer, or null when the
 * native bridge is unavailable (the caller keeps its browser fallback).
 */
export async function onNativeLocation(
  handler: (location: { lat: number; lng: number; timestamp: number }) => void
): Promise<(() => void) | null> {
  const plugin = await getPlugin();
  if (!plugin) return null;
  const handle = await plugin.addListener("location", handler);
  return () => void handle.remove();
}
