/**
 * Alarm-style SOS alert for the doctor device.
 *
 * A new emergency must not be missable: on `sos:new` the panel plays a
 * looping two-tone siren via Web Audio and (where supported — Android)
 * pulses vibration. The AudioContext is created/resumed inside the
 * on-duty toggle's user gesture, which satisfies iOS's requirement that
 * audio playback start from a user interaction.
 */

let ctx: AudioContext | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let vibrateTimer: ReturnType<typeof setInterval> | null = null;

/** Call from a user gesture (on-duty toggle) to unlock iOS audio playback. */
export function primeAlarmAudio() {
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
    }
    void ctx.resume();
  } catch {
    /* audio unavailable — alarm silently degrades to banner + push */
  }
}

/** Start the looping siren + vibration. Safe to call when already ringing. */
export function startSosAlarm() {
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
    }
    void ctx.resume();
  } catch {
    return;
  }
  if (!ctx || timer) return;

  const beep = (freq: number, at: number, duration: number) => {
    const osc = ctx!.createOscillator();
    const gain = ctx!.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.4, at + 0.05);
    const end = at + duration;
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(gain).connect(ctx!.destination);
    osc.start(at);
    osc.stop(end + 0.05);
  };

  const ring = () => {
    if (!ctx) return;
    const t = ctx.currentTime;
    // Two-tone emergency siren pattern (880/660 alternating).
    beep(880, t, 0.28);
    beep(660, t + 0.3, 0.28);
  };

  ring();
  timer = setInterval(ring, 900);

  if ("vibrate" in navigator) {
    const pattern = [400, 200, 400, 200, 400, 1200];
    navigator.vibrate(pattern);
    vibrateTimer = setInterval(() => navigator.vibrate(pattern), 2600);
  }
}

/** Stop the alarm and release oscillators/timers. */
export function stopSosAlarm() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  if (vibrateTimer) {
    clearInterval(vibrateTimer);
    vibrateTimer = null;
  }
  if ("vibrate" in navigator) navigator.vibrate(0);
  if (ctx) {
    try {
      void ctx.suspend();
    } catch {
      /* already closed */
    }
  }
}
