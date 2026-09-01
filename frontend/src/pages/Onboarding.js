import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, ArrowDown, ArrowUp, Sparkles, Check, ShieldCheck, Music2 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useLivePitch } from "@/hooks/useLivePitch";
import { classifyVoice, midiToName } from "@/lib/audio/notes";
import { SKILL_BASE_LEVEL } from "@/lib/storage";
import { Button } from "@/components/ui/button";

const STEPS = ["welcome", "low", "high", "skill"];

export default function Onboarding() {
  const { startMic, micRunning, micPermission, updateProfile } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [low, setLow] = useState(null);
  const [high, setHigh] = useState(null);
  const [skill, setSkill] = useState("beginner");
  const { pitch } = useLivePitch(micRunning);

  const goMic = async () => {
    const res = await startMic();
    if (res.ok) setStep(1);
  };

  const capture = (setter) => {
    if (pitch.midi != null) setter(pitch.midi);
  };

  const finish = () => {
    let lo = low, hi = high;
    if (lo != null && hi != null && lo > hi) [lo, hi] = [hi, lo];
    const voice = classifyVoice(lo, hi);
    const base = SKILL_BASE_LEVEL[skill] || 1;
    updateProfile({
      onboarded: true,
      rangeLow: lo,
      rangeHigh: hi,
      voiceType: voice.type,
      skill,
      levels: { match: base, scales: base, octaves: base, intervals: base, songs: base },
    });
    navigate("/");
  };

  const voice = low != null && high != null ? classifyVoice(Math.min(low, high), Math.max(low, high)) : null;

  return (
    <div className="min-h-screen aurora-bg grain flex items-center justify-center p-4" data-testid="onboarding-modal">
      <div className="w-full max-w-lg">
        {/* progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i <= step ? "w-8 bg-teal-glow" : "w-4 bg-white/15"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.35 }}
            className="glass-strong rounded-3xl p-8"
          >
            {step === 0 && (
              <div className="text-center">
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-2xl bg-teal-glow/30 animate-pulse-ring" />
                  <div className="relative w-20 h-20 rounded-2xl bg-teal-glow/15 border border-teal-glow/40 flex items-center justify-center">
                    <Music2 className="w-9 h-9 text-teal-glow" />
                  </div>
                </div>
                <h1 className="text-3xl font-bold tracking-tight mb-3">Vocal Trainer</h1>
                <p className="text-slate-400 leading-relaxed mb-6">
                  Train pitch accuracy, ear, breath and range with real-time feedback from your
                  microphone. We'll start with a quick voice range test.
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-slate-500 mb-6">
                  <ShieldCheck className="w-4 h-4 text-teal-glow" />
                  100% private — audio never leaves your device.
                </div>
                <Button
                  data-testid="onboarding-mic-btn"
                  onClick={goMic}
                  className="w-full rounded-full bg-teal-glow text-slate-900 hover:bg-teal-300 font-semibold h-12"
                >
                  <Mic className="w-4 h-4 mr-2" /> Enable Mic & Begin
                </Button>
                {micPermission === "denied" && (
                  <p className="text-tune-sharp text-xs mt-3">
                    Microphone blocked. Please allow access in your browser settings and retry.
                  </p>
                )}
              </div>
            )}

            {(step === 1 || step === 2) && (
              <RangeStep
                key={step}
                mode={step === 1 ? "low" : "high"}
                pitch={pitch}
                captured={step === 1 ? low : high}
                onCapture={() => capture(step === 1 ? setLow : setHigh)}
                onNext={() => setStep(step + 1)}
                onRetry={() => (step === 1 ? setLow(null) : setHigh(null))}
              />
            )}

            {step === 3 && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/15 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-indigo-400" />
                  </div>
                  <h2 className="text-2xl font-bold mb-1">Your voice profile</h2>
                  {voice && (
                    <div data-testid="voice-type-badge" className="inline-flex flex-col items-center mt-3">
                      <span className="text-3xl font-bold text-teal-glow text-glow-teal">{voice.type}</span>
                      <span className="font-mono text-sm text-slate-400 mt-1">
                        Range {midiToName(Math.min(low, high))} – {midiToName(Math.max(low, high))}
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-slate-400 text-sm text-center mb-3">How would you rate your experience?</p>
                <div data-testid="skill-level-select" className="grid grid-cols-1 gap-2 mb-6">
                  {[
                    { id: "beginner", label: "Beginner", desc: "New to singing — wider pitch tolerance" },
                    { id: "some", label: "Some experience", desc: "I can carry a tune" },
                    { id: "trained", label: "Trained", desc: "Tighter tolerance, harder content" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      data-testid={`skill-option-${s.id}`}
                      onClick={() => setSkill(s.id)}
                      className={`text-left rounded-2xl p-4 border transition-all ${
                        skill === s.id
                          ? "border-teal-glow bg-teal-glow/10"
                          : "border-white/10 hover:border-white/25"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{s.label}</span>
                        {skill === s.id && <Check className="w-4 h-4 text-teal-glow" />}
                      </div>
                      <span className="text-xs text-slate-400">{s.desc}</span>
                    </button>
                  ))}
                </div>

                <Button
                  data-testid="complete-onboarding-btn"
                  onClick={finish}
                  className="w-full rounded-full bg-teal-glow text-slate-900 hover:bg-teal-300 font-semibold h-12"
                >
                  Start Training
                </Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function RangeStep({ mode, pitch, captured, onCapture, onNext, onRetry }) {
  const isLow = mode === "low";
  return (
    <div className="text-center">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${isLow ? "bg-cyan-500/15" : "bg-rose-500/15"}`}>
        {isLow ? <ArrowDown className="w-8 h-8 text-cyan-400" /> : <ArrowUp className="w-8 h-8 text-rose-400" />}
      </div>
      <h2 className="text-2xl font-bold mb-2">
        {isLow ? "Your lowest note" : "Your highest note"}
      </h2>
      <p className="text-slate-400 text-sm mb-6 leading-relaxed">
        {isLow
          ? "Hum or sing the lowest note you can hold comfortably, then tap capture while holding it."
          : "Glide up to the highest note you can hold comfortably, then tap capture while holding it."}
      </p>

      <div className="bg-black/25 rounded-2xl py-8 mb-6">
        <div className="text-6xl font-bold font-mono text-teal-glow text-glow-teal">
          {pitch.freq > 0 ? pitch.note : "—"}
        </div>
        <div className="text-slate-500 font-mono text-sm mt-2">
          {pitch.freq > 0 ? `${pitch.freq.toFixed(1)} Hz` : "sing to detect…"}
        </div>
        {captured != null && (
          <div className="mt-4 inline-flex items-center gap-2 text-emerald-400 text-sm">
            <Check className="w-4 h-4" /> Captured {midiToName(captured)}
          </div>
        )}
      </div>

      {captured == null ? (
        <Button
          data-testid={isLow ? "onboarding-low-note-btn" : "onboarding-high-note-btn"}
          onClick={onCapture}
          disabled={pitch.freq <= 0}
          className="w-full rounded-full bg-teal-glow text-slate-900 hover:bg-teal-300 font-semibold h-12 disabled:opacity-40"
        >
          Capture {isLow ? "Lowest" : "Highest"} Note
        </Button>
      ) : (
        <div className="flex gap-3">
          <Button
            onClick={onRetry}
            variant="outline"
            className="flex-1 rounded-full border-white/20 bg-transparent hover:bg-white/5 h-12"
          >
            Retry
          </Button>
          <Button
            data-testid="range-step-next"
            onClick={onNext}
            className="flex-1 rounded-full bg-teal-glow text-slate-900 hover:bg-teal-300 font-semibold h-12"
          >
            {isLow ? "Next" : "Continue"}
          </Button>
        </div>
      )}
    </div>
  );
}
