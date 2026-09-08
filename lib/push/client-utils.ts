/** Convert a base64url-encoded VAPID public key into a Uint8Array for pushManager.subscribe(). */
export function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Norm = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64Norm);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}
