import { useEffect, useRef, useState, useCallback } from "react";
import engine from "@/lib/audio/engine";
import { midiToFreq, midiToName } from "@/lib/audio/notes";

// Tracks how long the user holds their voice within `tolerance` cents of `targetMidi`.
// Fires onHit(cents) once when held for `holdTime` seconds. Returns live feedback.
export function usePitchTarget({
  active,
  targetMidi,
  tolerance = 25,
  holdTime = 1.2,
  allowOctave = true,
  onHit,
}) {
  const [state, setState] = useState({
    progress: 0,
    cents: null,
    inTune: false,
    sungNote: "—",
    detecting: false,
  });
  const held = useRef(0);
  const lastTs = useRef(0);
  const fired = useRef(false);
  const onHitRef = useRef(onHit);
  const lastSet = useRef(0);
  onHitRef.current = onHit;

  // reset when target changes
  useEffect(() => {
    held.current = 0;
    fired.current = false;
    lastTs.current = 0;
    setState((s) => ({ ...s, progress: 0, inTune: false }));
  }, [targetMidi]);

  const effectiveTarget = useCallback(
    (freq) => {
      if (targetMidi == null) return null;
      if (!allowOctave) return targetMidi;
      // pick octave of the same pitch class nearest to the sung frequency
      let best = targetMidi;
      let bestDist = Infinity;
      for (let o = -3; o <= 3; o++) {
        const m = targetMidi + o * 12;
        const d = Math.abs(midiToFreq(m) - freq);
        if (d < bestDist) {
          bestDist = d;
          best = m;
        }
      }
      return best;
    },
    [targetMidi, allowOctave]
  );

  useEffect(() => {
    if (!active || targetMidi == null) return;
    const unsub = engine.subscribe((latest) => {
      const now = performance.now();
      const dt = lastTs.current ? (now - lastTs.current) / 1000 : 0;
      lastTs.current = now;

      let inTune = false;
      let cents = null;
      let sungNote = "—";

      if (latest.freq > 0) {
        sungNote = latest.note;
        const tgt = effectiveTarget(latest.freq);
        cents = 1200 * (Math.log(latest.freq / midiToFreq(tgt)) / Math.log(2));
        inTune = Math.abs(cents) <= tolerance;
      }

      if (inTune) {
        held.current += dt;
      } else {
        held.current = Math.max(0, held.current - dt * 1.5);
      }

      const progress = Math.min(1, held.current / holdTime);
      if (progress >= 1 && !fired.current) {
        fired.current = true;
        if (onHitRef.current) onHitRef.current(cents ?? 0);
      }

      if (now - lastSet.current >= 40) {
        lastSet.current = now;
        setState({ progress, cents, inTune, sungNote, detecting: latest.freq > 0 });
      }
    });
    return unsub;
  }, [active, targetMidi, tolerance, holdTime, effectiveTarget]);

  const reset = useCallback(() => {
    held.current = 0;
    fired.current = false;
    lastTs.current = 0;
    setState({ progress: 0, cents: null, inTune: false, sungNote: "—", detecting: false });
  }, []);

  return { ...state, reset };
}

export { midiToName };
