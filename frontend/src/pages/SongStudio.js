import React, { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { Disc, Play, Pause, Volume2, VolumeX, Music4, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { nameToMidi, midiToName, midiToFreq, freqToMidiFloat } from "@/lib/audio/notes";
import { SONGS } from "@/data/songs";
import { levelConfig } from "@/lib/progression";
import ModuleShell from "@/components/ModuleShell";
import MicGate from "@/components/MicGate";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const PX_PER_SEC = 90;
const PLAYHEAD_X = 96;

export default function SongStudio() {
  const { engine, micRunning, recordAttempt, endSession, getLevel } = useApp();
  const level = getLevel("songs");
  const cfg = levelConfig(level);
  const tolerance = Math.max(20, cfg.tolerance + 10); // songs are more forgiving

  const [songId, setSongId] = useState(SONGS[0].id);
  const [transpose, setTranspose] = useState(0);
  const [tempoMult, setTempoMult] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [guide, setGuide] = useState(false);
  const [score, setScore] = useState({ hits: 0, total: 0 });
  const [rating, setRating] = useState("—");
  const [finished, setFinished] = useState(false);

  const song = SONGS.find((s) => s.id === songId);

  const timeline = useMemo(() => {
    const secPerBeat = 60 / song.tempo / tempoMult;
    let t = 0;
    const notes = [];
    for (const [name, beats] of song.notes) {
      const dur = beats * secPerBeat;
      if (name !== "R") {
        notes.push({ midi: nameToMidi(name) + transpose, start: t, dur: dur * 0.92 });
      }
      t += dur;
    }
    return { notes, total: t };
  }, [song, transpose, tempoMult]);

  const midiRange = useMemo(() => {
    const ms = timeline.notes.map((n) => n.midi);
    return { lo: Math.min(...ms) - 2, hi: Math.max(...ms) + 2 };
  }, [timeline]);

  const canvasRef = useRef(null);
  const raf = useRef(null);
  const startTime = useRef(0);
  const lastTs = useRef(0);
  const hitTime = useRef([]);
  const guideIdx = useRef(-1);
  const trace = useRef([]);
  const scoreRef = useRef({ hits: 0, total: 0 });

  const yFor = useCallback(
    (midi, h) => {
      const span = midiRange.hi - midiRange.lo || 1;
      return h - ((midi - midiRange.lo) / span) * h;
    },
    [midiRange]
  );

  const stop = useCallback((didFinish) => {
    cancelAnimationFrame(raf.current);
    setPlaying(false);
    if (didFinish) {
      setFinished(true);
      const s = endSession();
    }
  }, [endSession]);

  const loop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const now = performance.now();
    const dt = lastTs.current ? (now - lastTs.current) / 1000 : 0;
    lastTs.current = now;
    const t = (now - startTime.current) / 1000;

    // clear
    ctx.clearRect(0, 0, w, h);

    // horizontal pitch grid lines per semitone octave (C notes)
    ctx.font = "10px 'JetBrains Mono'";
    for (let m = Math.ceil(midiRange.lo); m <= midiRange.hi; m++) {
      const y = yFor(m, h);
      const isC = ((m % 12) + 12) % 12 === 0;
      ctx.strokeStyle = isC ? "rgba(148,163,184,0.14)" : "rgba(148,163,184,0.05)";
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
      if (isC) {
        ctx.fillStyle = "rgba(148,163,184,0.4)";
        ctx.fillText(midiToName(m), 4, y - 3);
      }
    }

    // active note detection
    let activeIdx = -1;
    for (let i = 0; i < timeline.notes.length; i++) {
      const n = timeline.notes[i];
      if (t >= n.start && t < n.start + n.dur) { activeIdx = i; break; }
    }

    const live = engine.latest;
    const liveMidi = live.freq > 0 ? freqToMidiFloat(live.freq) : null;

    // scoring: accumulate hold time on active note
    if (activeIdx >= 0 && liveMidi != null) {
      const n = timeline.notes[activeIdx];
      // nearest octave target
      let best = n.midi, bd = Infinity;
      for (let o = -2; o <= 2; o++) {
        const d = Math.abs(midiToFreq(n.midi + o * 12) - live.freq);
        if (d < bd) { bd = d; best = n.midi + o * 12; }
      }
      const cents = 1200 * (Math.log(live.freq / midiToFreq(best)) / Math.log(2));
      if (Math.abs(cents) <= tolerance) {
        hitTime.current[activeIdx] = (hitTime.current[activeIdx] || 0) + dt;
        setRating(Math.abs(cents) <= tolerance * 0.5 ? "Perfect" : "Great");
      } else {
        setRating(cents < 0 ? "Flat" : "Sharp");
      }
    } else if (liveMidi == null) {
      setRating("—");
    }

    // guide tone trigger
    if (guide && activeIdx >= 0 && activeIdx !== guideIdx.current) {
      guideIdx.current = activeIdx;
      engine.playMidi(timeline.notes[activeIdx].midi, timeline.notes[activeIdx].dur * 0.9, "sine");
    }

    // trace of user's pitch
    if (liveMidi != null) trace.current.push({ x: PLAYHEAD_X, midi: liveMidi, born: t });
    trace.current = trace.current.filter((p) => t - p.born < 2.2);

    // draw notes
    for (let i = 0; i < timeline.notes.length; i++) {
      const n = timeline.notes[i];
      const x = PLAYHEAD_X + (n.start - t) * PX_PER_SEC;
      const width = n.dur * PX_PER_SEC;
      if (x + width < -20 || x > w + 20) continue;
      const y = yFor(n.midi, h);
      const passed = t > n.start + n.dur;
      const isActive = i === activeIdx;
      const wasHit = (hitTime.current[i] || 0) >= n.dur * 0.42;
      let fill = "rgba(99,102,241,0.55)";
      if (passed) fill = wasHit ? "rgba(16,185,129,0.7)" : "rgba(244,63,94,0.5)";
      else if (isActive) fill = "rgba(45,212,191,0.85)";
      ctx.fillStyle = fill;
      const bh = 12;
      roundRect(ctx, x, y - bh / 2, Math.max(6, width), bh, 6);
      ctx.fill();
      if (isActive) {
        ctx.strokeStyle = "#2dd4bf";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // user pitch trace
    if (trace.current.length > 1) {
      ctx.strokeStyle = "rgba(244,63,94,0.85)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      trace.current.forEach((p, i) => {
        const px = PLAYHEAD_X - (t - p.born) * PX_PER_SEC;
        const py = yFor(p.midi, h);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
    }

    // playhead
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(PLAYHEAD_X, 0);
    ctx.lineTo(PLAYHEAD_X, h);
    ctx.stroke();

    // live pitch dot
    if (liveMidi != null) {
      const py = yFor(liveMidi, h);
      ctx.fillStyle = "#f43f5e";
      ctx.shadowColor = "#f43f5e";
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(PLAYHEAD_X, py, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // live running score
    let hits = 0, total = 0;
    for (let i = 0; i < timeline.notes.length; i++) {
      if (t > timeline.notes[i].start + timeline.notes[i].dur) {
        total++;
        if ((hitTime.current[i] || 0) >= timeline.notes[i].dur * 0.42) hits++;
      }
    }
    if (hits !== scoreRef.current.hits || total !== scoreRef.current.total) {
      scoreRef.current = { hits, total };
      setScore({ hits, total });
    }

    if (t > timeline.total + 0.3) {
      // finalize: record each note
      timeline.notes.forEach((n, i) => {
        recordAttempt({
          module: "songs",
          targetMidi: n.midi,
          cents: null,
          correct: (hitTime.current[i] || 0) >= n.dur * 0.42,
        });
      });
      stop(true);
      return;
    }
    raf.current = requestAnimationFrame(loop);
  }, [timeline, engine, guide, tolerance, yFor, recordAttempt, stop, midiRange]);

  const start = () => {
    hitTime.current = [];
    trace.current = [];
    guideIdx.current = -1;
    scoreRef.current = { hits: 0, total: 0 };
    setScore({ hits: 0, total: 0 });
    setFinished(false);
    setRating("—");
    lastTs.current = 0;
    startTime.current = performance.now();
    setPlaying(true);
    raf.current = requestAnimationFrame(loop);
  };

  const preview = () => {
    engine.playSequence(timeline.notes.map((n) => n.midi), 0.4, 0.05);
  };

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  // resize canvas for DPR
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
    return () => window.removeEventListener("resize", resize);
  }, [micRunning]);

  const accuracy = score.total ? Math.round((score.hits / score.total) * 100) : 0;
  const ratingColor = { Perfect: "#10b981", Great: "#2dd4bf", Flat: "#f59e0b", Sharp: "#f43f5e", "—": "#64748b" }[rating];

  return (
    <ModuleShell
      icon={Disc}
      title="Song Studio"
      subtitle="Sing along to the scrolling piano-roll. Your pitch trace is scored against each note in real time."
      level={level}
      testId="song-practice-container"
    >
      <MicGate>
        {/* controls */}
        <div className="glass rounded-2xl p-4 flex flex-wrap items-end gap-3 mb-4">
          <div className="flex-1 min-w-[180px]">
            <label className="text-[10px] font-mono uppercase text-slate-500">Song</label>
            <Select value={songId} onValueChange={(v) => { setSongId(v); stop(false); }}>
              <SelectTrigger data-testid="song-selector-dropdown" className="mt-1 bg-black/30 border-white/10 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SONGS.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase text-slate-500 block mb-1">Key</label>
            <div data-testid="song-key-transpose-buttons" className="flex items-center gap-1">
              <button onClick={() => setTranspose((t) => t - 1)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 font-mono">−</button>
              <span className="font-mono text-sm w-10 text-center">{transpose > 0 ? `+${transpose}` : transpose}</span>
              <button onClick={() => setTranspose((t) => t + 1)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 font-mono">+</button>
            </div>
          </div>
          <div className="min-w-[120px]">
            <label className="text-[10px] font-mono uppercase text-slate-500 block mb-1">Tempo {tempoMult.toFixed(1)}×</label>
            <input
              data-testid="song-tempo-slider"
              type="range" min="0.6" max="1.4" step="0.1"
              value={tempoMult}
              onChange={(e) => setTempoMult(Number(e.target.value))}
              className="w-full accent-teal-400"
            />
          </div>
          <button
            onClick={() => setGuide((g) => !g)}
            data-testid="song-guide-toggle"
            className={`flex items-center gap-1.5 rounded-xl px-3 h-9 text-sm border transition-colors ${
              guide ? "border-teal-glow/40 bg-teal-glow/10 text-teal-glow" : "border-white/10 text-slate-400"
            }`}
          >
            {guide ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />} Guide
          </button>
        </div>

        {/* score bar */}
        <div className="flex items-center justify-between gap-4 mb-3">
          <div data-testid="song-score-meter" className="glass rounded-2xl px-5 py-3 flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold font-mono text-teal-glow">{accuracy}%</div>
              <div className="text-[10px] uppercase font-mono text-slate-500">Accuracy</div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <div className="text-2xl font-bold font-mono">{score.hits}/{timeline.notes.length}</div>
              <div className="text-[10px] uppercase font-mono text-slate-500">Notes hit</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold font-mono transition-colors" style={{ color: ratingColor }}>{rating}</div>
            <div className="text-[10px] uppercase font-mono text-slate-500">Live rating</div>
          </div>
        </div>

        {/* piano roll */}
        <canvas
          ref={canvasRef}
          data-testid="song-piano-roll-canvas"
          className="w-full rounded-2xl bg-[#0a1120] border border-white/5"
          style={{ height: 280 }}
        />

        {/* transport */}
        <div className="flex justify-center gap-3 mt-4">
          {!playing ? (
            <Button
              data-testid="song-play-pause-button"
              onClick={start}
              className="rounded-full bg-teal-glow text-slate-900 hover:bg-teal-300 font-semibold px-6"
            >
              <Play className="w-4 h-4 mr-2" /> {finished ? "Sing Again" : "Start Singing"}
            </Button>
          ) : (
            <Button
              data-testid="song-play-pause-button"
              onClick={() => stop(false)}
              variant="outline"
              className="rounded-full border-white/20 bg-transparent hover:bg-white/5 px-6"
            >
              <Pause className="w-4 h-4 mr-2" /> Stop
            </Button>
          )}
          <Button onClick={preview} variant="outline" className="rounded-full border-white/20 bg-transparent hover:bg-white/5">
            <Music4 className="w-4 h-4 mr-2" /> Preview Melody
          </Button>
        </div>

        {finished && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-5 mt-4 text-center"
            data-testid="song-result"
          >
            <div className="text-4xl mb-1">{accuracy >= 80 ? "🌟" : accuracy >= 50 ? "👏" : "💪"}</div>
            <p className="font-semibold">
              You hit {score.hits} of {timeline.notes.length} notes — {accuracy}% accuracy
            </p>
            <p className="text-slate-400 text-sm mt-1">
              {accuracy >= 80 ? "Outstanding pitch control!" : accuracy >= 50 ? "Nice — keep refining those trickier notes." : "Keep at it, slow the tempo and try again."}
            </p>
          </motion.div>
        )}
      </MicGate>
    </ModuleShell>
  );
}

function roundRect(ctx, x, y, w, h, r) {
  const rad = Math.min(r, h / 2, w / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}
