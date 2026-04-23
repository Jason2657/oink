"use client";

import { useEffect, useState } from "react";
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

const STORAGE_KEY_TARGET = "oink.targetWord";
const STORAGE_KEY_DURATION = "oink.durationSeconds";

const VALID_TARGETS: readonly TargetWord[] = [
  "I",
  "like",
  "actually",
  "basically",
  "literally",
];

function isValidTarget(v: string | null): v is TargetWord {
  return !!v && (VALID_TARGETS as readonly string[]).includes(v);
}

function isValidDuration(v: string | null): v is "60" | "120" {
  return v === "60" || v === "120";
}

export default function Home() {
  const [state, setState] = useState<AppState>("setup");
  const [topic, setTopic] = useState<string>("");
  const [targetWord, setTargetWord] = useState<TargetWord>("I");
  const [durationSeconds, setDurationSeconds] =
    useState<DurationSeconds>(120);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [result, setResult] = useState<TranscribeResponse | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Load persisted preferences on mount.
  useEffect(() => {
    try {
      const storedTarget = localStorage.getItem(STORAGE_KEY_TARGET);
      if (isValidTarget(storedTarget)) {
        // One-shot hydration of persisted preference is the intended pattern here.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTargetWord(storedTarget);
      }
      const storedDuration = localStorage.getItem(STORAGE_KEY_DURATION);
      if (isValidDuration(storedDuration)) {
        setDurationSeconds(Number(storedDuration) as DurationSeconds);
      }
    } catch {
      // localStorage can throw in private modes — ignore.
    }
    setHydrated(true);
  }, []);

  // Write preferences on change, but not before the initial read completes.
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY_TARGET, targetWord);
      localStorage.setItem(STORAGE_KEY_DURATION, String(durationSeconds));
    } catch {
      // ignore
    }
  }, [hydrated, targetWord, durationSeconds]);

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
        targetWord={targetWord}
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
