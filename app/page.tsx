"use client";

import { useState } from "react";
import SetupScreen from "@/components/SetupScreen";
import RecordingScreen from "@/components/RecordingScreen";
import ProcessingScreen from "@/components/ProcessingScreen";
import type { AppState, TranscribeResponse } from "@/lib/types";

const DURATION_SEC = 120;

export default function Home() {
  const [state, setState] = useState<AppState>("setup");
  const [topic, setTopic] = useState<string>("");
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
        durationSec={DURATION_SEC}
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

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="flex flex-col gap-4 text-center">
        <p className="text-neutral-500">
          State: <code>{state}</code>
        </p>
        <p className="text-neutral-500">Topic: {topic}</p>
        <p className="text-neutral-400 text-xs">
          audioBlob: {audioBlob ? "yes" : "no"} | result:{" "}
          {result ? "yes" : "no"}
        </p>
        <button
          type="button"
          onClick={reset}
          className="text-sm underline text-neutral-500"
        >
          Back to setup
        </button>
      </div>
    </div>
  );
}
