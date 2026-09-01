import React, { useEffect, useRef } from "react";
import engine from "@/lib/audio/engine";

// Live waveform canvas. Subscribes directly to the engine to draw at full frame rate
// without triggering React re-renders.
export default function Waveform({ active, testId = "pitch-waveform-canvas", height = 140 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    let raf;
    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      // baseline grid
      ctx.strokeStyle = "rgba(148,163,184,0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      if (active && engine.buffer && engine.running) {
        const buf = engine.buffer;
        const vol = engine.latest.volume || 0;
        const hue = engine.latest.freq > 0 ? "#2dd4bf" : "#475569";
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = hue;
        ctx.shadowColor = "rgba(45,212,191,0.6)";
        ctx.shadowBlur = engine.latest.freq > 0 ? 12 : 0;
        ctx.beginPath();
        const step = Math.max(1, Math.floor(buf.length / w));
        for (let i = 0, x = 0; i < buf.length; i += step, x++) {
          const y = h / 2 + buf[i] * (h / 2) * (0.6 + vol * 2.5);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      data-testid={testId}
      className="w-full rounded-2xl bg-[#0a1120] border border-white/5"
      style={{ height }}
    />
  );
}
