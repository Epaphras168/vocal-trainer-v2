import { useEffect, useRef, useState } from "react";
import engine from "@/lib/audio/engine";

// Subscribe to the engine's pitch stream. Canvas-heavy consumers should read
// `ref.current` each frame; this hook also exposes throttled React state for text UI.
export function useLivePitch(active, throttleMs = 70) {
  const ref = useRef(engine.latest);
  const [pitch, setPitch] = useState(engine.latest);
  const lastUpdate = useRef(0);

  useEffect(() => {
    if (!active) return;
    const unsub = engine.subscribe((latest) => {
      ref.current = latest;
      const now = performance.now();
      if (now - lastUpdate.current >= throttleMs) {
        lastUpdate.current = now;
        setPitch(latest);
      }
    });
    return unsub;
  }, [active, throttleMs]);

  return { pitch, ref };
}
