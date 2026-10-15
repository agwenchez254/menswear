/** Short notification sounds made with the Web Audio API, so no audio files are needed. */

export type ChimeKind = "success" | "info" | "alert";

const NOTES: Record<ChimeKind, number[]> = {
  success: [523.25, 659.25, 783.99], // C5 E5 G5
  info: [659.25, 783.99], // E5 G5
  alert: [392, 293.66], // G4 D4
};

let ctx: AudioContext | null = null;

function context(): AudioContext | null {
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx ??= new Ctor();
    return ctx;
  } catch {
    return null;
  }
}

/** Browsers keep audio silent until the page has had a click or key press. Call this from such a gesture. */
export function unlockAudio(): void {
  void context()?.resume().catch(() => undefined);
}

const MUTE_KEY = "jabali-sound-muted";

export function isMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setMuted(muted: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    /* storage unavailable: the choice lasts until reload */
  }
}

/** Plays the sound unless the person has muted it or the browser has not allowed audio yet. */
export function playChime(kind: ChimeKind): void {
  if (isMuted()) return;
  const c = context();
  if (!c || c.state !== "running") return;
  const start = c.currentTime + 0.02;
  NOTES[kind].forEach((freq, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    const t = start + i * 0.14;
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    osc.connect(gain).connect(c.destination);
    osc.start(t);
    osc.stop(t + 0.35);
  });
}
