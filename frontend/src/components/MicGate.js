import React from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, AlertTriangle } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";

// Inline mic gate: shows a start button or graceful permission-denied guidance.
export default function MicGate({ children }) {
  const { micRunning, micPermission, micError, startMic } = useApp();

  if (micRunning) return children;

  if (micPermission === "denied" || micError === "NotAllowedError") {
    return (
      <div
        data-testid="mic-denied-message"
        className="glass rounded-3xl p-8 text-center max-w-lg mx-auto"
      >
        <div className="w-14 h-14 rounded-2xl bg-rose-500/15 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-tune-sharp" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Microphone access blocked</h3>
        <p className="text-slate-400 text-sm mb-5 leading-relaxed">
          Vocal Trainer needs your microphone to detect pitch. Nothing is ever recorded or
          uploaded — all analysis happens live in your browser.
        </p>
        <ol className="text-left text-sm text-slate-300 space-y-2 mb-6 bg-black/20 rounded-xl p-4">
          <li>1. Tap the lock / info icon in your browser's address bar.</li>
          <li>2. Set <span className="text-teal-glow">Microphone</span> to <span className="text-teal-glow">Allow</span>.</li>
          <li>3. Reload the page and try again.</li>
        </ol>
        <Button
          data-testid="mic-retry-button"
          onClick={startMic}
          className="rounded-full bg-teal-glow text-slate-900 hover:bg-teal-300 font-semibold"
        >
          <Mic className="w-4 h-4 mr-2" /> Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="glass rounded-3xl p-10 text-center max-w-md mx-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-20 h-20 mx-auto mb-6"
      >
        <div className="absolute inset-0 rounded-full bg-teal-glow/30 animate-pulse-ring" />
        <div className="relative w-20 h-20 rounded-full bg-teal-glow/15 border border-teal-glow/40 flex items-center justify-center">
          <MicOff className="w-8 h-8 text-teal-glow" />
        </div>
      </motion.div>
      <h3 className="text-xl font-semibold mb-2">Enable your microphone</h3>
      <p className="text-slate-400 text-sm mb-6 leading-relaxed">
        Tap below to start listening. Audio is analysed live on-device and never leaves your
        browser.
      </p>
      <Button
        data-testid="mic-enable-button"
        onClick={startMic}
        className="rounded-full bg-teal-glow text-slate-900 hover:bg-teal-300 font-semibold px-6"
      >
        <Mic className="w-4 h-4 mr-2" /> Start Microphone
      </Button>
    </div>
  );
}
