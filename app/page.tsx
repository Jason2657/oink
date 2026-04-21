"use client";

import { useState } from "react";
import SetupScreen from "@/components/SetupScreen";
import RecordingScreen from "@/components/RecordingScreen";
import ProcessingScreen from "@/components/ProcessingScreen";
import ResultsScreen from "@/components/ResultsScreen";
import type {
  AppState,
  DurationSeconds,
  TargetWord,
  TranscribeResponse,
} from "@/lib/types";

export default function Home() {
  const [state, setState] = useState<AppState>("setup");
  const [topic, setTopic] = useState<string>("");
  const [targetWord, setTargetWord] = useState<TargetWord>("I");
  const [durationSeconds, setDurationSeconds] =
    useState<DurationSeconds>(120);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [result, setResult] = useState<TranscribeResponse | null>(null);

  const reset = () => {
    setState("setup");
    setTopic("");
    setAudioBlob(null);
    setResult(null);
  };

  if (state === "setup") {
    return (
      <SetupScreen
        targetWord={targetWord}
        onTargetWordChange={setTargetWord}
        durationSeconds={durationSeconds}
        onDurationChange={setDurationSeconds}
        onStart={(t) => {
          setTopic(t);
          setState("recording");
        }}
      />
    );
  }

  if (state === "recording") {
    return (
      <RecordingScreen
        topic={topic}
        durationSec={durationSeconds}
        onComplete={(blob) => {
          setAudioBlob(blob);
          setState("processing");
        }}
        onCancel={reset}
      />
    );
  }

  if (state === "processing" && audioBlob) {
    return (
      <ProcessingScreen
        audio={audioBlob}
        onComplete={(r) => {
          setResult(r);
          setState("results");
        }}
        onRetry={reset}
      />
    );
  }

  if (state === "results" && audioBlob && result) {
    return (
      <ResultsScreen audio={audioBlob} result={result} onRestart={reset} />
    );
  }

  // Fallback: should not normally render, but guards against missing state.
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <button
        type="button"
        onClick={reset}
        className="text-sm underline text-neutral-500"
      >
        Back to setup
      </button>
    </div>
  );
}
