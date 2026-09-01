import React, { useState } from "react";
import { Mic, Volume2, MicOff } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useLivePitch } from "@/hooks/useLivePitch";
import { NOTE_NAMES, midiToName } from "@/lib/audio/notes";
import ModuleShell from "@/components/ModuleShell";
import MicGate from "@/components/MicGate";
import Waveform from "@/components/Waveform";
import VolumeMeter from "@/components/VolumeMeter";
import TuningMeter, { tuneColor } from "@/components/TuningMeter";
import { Button } from "@/components/ui/button";

export default function PitchLab() {
  const { engine, micRunning, stopMic } = useApp();
  const { pitch } = useLivePitch(micRunning);
  const [refOctave, setRefOctave] = useState(4);

  const color = pitch.freq > 0 ? tuneColor(pitch.cents, 20) : "#475569";

  return (
    <ModuleShell
      icon={Mic}
      title="Pitch Lab"
      subtitle="A free-form sandbox to explore your voice. No scoring — just watch your pitch in real time."
      testId="pitch-lab-container"
      right={
        micRunning && (
          <Button
            data-testid="mic-toggle-button"
            onClick={stopMic}
            variant="outline"
            size="sm"
            className="rounded-full border-white/20 bg-transparent hover:bg-white/5"
          >
            <MicOff className="w-4 h-4 mr-1.5" /> Stop
          </Button>
        )
      }
    >
      <MicGate>
        <div className="grid lg:grid-cols-3 gap-4">
          {/* big note readout */}
          <div className="glass rounded-3xl p-6 flex flex-col items-center justify-center text-center lg:col-span-1">
            <div
              data-testid="live-note-display"
              className="text-7xl font-bold font-mono transition-colors duration-150"
              style={{ color, textShadow: pitch.freq > 0 ? `0 0 30px ${color}88` : "none" }}
            >
              {pitch.freq > 0 ? pitch.note : "—"}
            </div>
            <div data-testid="live-hz-display" className="font-mono text-slate-400 mt-2">
              {pitch.freq > 0 ? `${pitch.freq.toFixed(1)} Hz` : "sing to detect"}
            </div>
          </div>

          {/* waveform + meters */}
          <div className="glass rounded-3xl p-5 lg:col-span-2 space-y-4">
            <Waveform active={micRunning} />
            <VolumeMeter volume={pitch.volume} active={micRunning} />
            <TuningMeter cents={pitch.cents} active={pitch.freq > 0} tolerance={15} testId="pitch-cents-meter" />
          </div>
        </div>

        {/* reference tone generator */}
        <div data-testid="ref-tone-generator" className="glass rounded-3xl p-5 mt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-teal-glow" />
              <span className="font-semibold">Reference Tones</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRefOctave((o) => Math.max(2, o - 1))}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 font-mono"
              >
                −
              </button>
              <span className="font-mono text-sm w-12 text-center">Oct {refOctave}</span>
              <button
                onClick={() => setRefOctave((o) => Math.min(6, o + 1))}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 font-mono"
              >
                +
              </button>
            </div>
          </div>
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
            {NOTE_NAMES.map((n, i) => {
              const midi = i + (refOctave + 1) * 12;
              const sharp = n.includes("#");
              return (
                <button
                  key={n}
                  data-testid={`ref-tone-${n}`}
                  onClick={() => engine.playMidi(midi, 0.8)}
                  className={`h-14 rounded-xl font-mono text-sm transition-all hover:scale-105 ${
                    sharp
                      ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      : "bg-white/10 text-white hover:bg-teal-glow/25"
                  }`}
                >
                  {n}
                  <span className="block text-[9px] text-slate-500">{midiToName(midi)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </MicGate>
    </ModuleShell>
  );
}
