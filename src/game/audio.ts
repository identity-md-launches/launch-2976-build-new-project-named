import type { GameEvent } from './engine';

/** Tiny synthesized effects; no audio download and no autoplay. */
export class GameAudio {
  private context: AudioContext | null = null;
  enabled = false;

  unlock() {
    if (!this.enabled) return;
    try {
      this.context ??= new AudioContext();
      if (this.context.state === 'suspended')
        void this.context.resume().catch(() => {});
    } catch {
      /* Audio is optional; gameplay remains available. */
    }
  }

  play(event: GameEvent) {
    if (!this.enabled || !this.context || this.context.state !== 'running')
      return;
    const ctx = this.context;
    const now = ctx.currentTime;
    const notes =
      event === 'cheese'
        ? [880, 1320]
        : event === 'level'
          ? [523, 659, 784]
          : event === 'hit'
            ? [180, 110]
            : [340];
    notes.forEach((frequency, i) => {
      const osc = ctx.createOscillator(),
        gain = ctx.createGain();
      osc.type = event === 'hit' ? 'triangle' : 'sine';
      const start = now + i * 0.065;
      osc.frequency.setValueAtTime(frequency, start);
      if (event === 'jump')
        osc.frequency.exponentialRampToValueAtTime(680, start + 0.12);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.07, start + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.2);
    });
  }

  dispose() {
    void this.context?.close().catch(() => {});
    this.context = null;
  }
}
