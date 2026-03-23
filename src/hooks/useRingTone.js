import { useRef, useCallback } from 'react';

export function useRingTone() {
  const ctxRef = useRef(null);
  const intervalRef = useRef(null);
  const isPlayingRef = useRef(false);

  const stop = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (ctxRef.current) {
      try { ctxRef.current.close(); } catch (_) {}
      ctxRef.current = null;
    }
    isPlayingRef.current = false;
  }, []);

  const play = useCallback(() => {
    if (isPlayingRef.current) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      ctxRef.current = ctx;
      isPlayingRef.current = true;

      const ring = () => {
        if (!ctxRef.current || ctxRef.current.state === 'closed') return;
        try {
          const t = ctx.currentTime;
          // Double-tone ring (480Hz + 620Hz) — classic phone ring
          [480, 620].forEach(freq => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.18, t + 0.05);
            gain.gain.setValueAtTime(0.18, t + 0.35);
            gain.gain.linearRampToValueAtTime(0, t + 0.45);
            osc.start(t);
            osc.stop(t + 0.5);
          });
        } catch (_) {}
      };

      ring();
      intervalRef.current = setInterval(ring, 2200);
    } catch (e) {
      console.warn('RingTone error:', e);
    }
  }, []);

  return { play, stop };
}
