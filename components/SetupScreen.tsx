"use client";

import { useEffect, useState } from "react";
import InlinePopover from "@/components/InlinePopover";
import { pickRandomTopic, TOPICS } from "@/lib/topics";
import type { DurationSeconds, TargetWord } from "@/lib/types";

interface SetupScreenProps {
  targetWord: TargetWord;
  onTargetWordChange: (value: TargetWord) => void;
  durationSeconds: DurationSeconds;
  onDurationChange: (value: DurationSeconds) => void;
  onStart: (topic: string) => void;
}

const TARGET_WORD_OPTIONS: { label: string; value: TargetWord }[] = [
  { label: "‘I’", value: "I" },
  { label: "‘like’", value: "like" },
  { label: "‘actually’", value: "actually" },
  { label: "‘basically’", value: "basically" },
  { label: "‘literally’", value: "literally" },
];

const DURATION_OPTIONS: { label: string; value: string }[] = [
  { label: "1 minute", value: "60" },
  { label: "2 minutes", value: "120" },
];

function targetDisplay(word: TargetWord): string {
  return `‘${word}’`;
}

function durationDisplay(seconds: DurationSeconds): string {
  return seconds === 60 ? "1 minute" : "2 minutes";
}

export default function SetupScreen({
  targetWord,
  onTargetWordChange,
  durationSeconds,
  onDurationChange,
  onStart,
}: SetupScreenProps) {
  // Start with a deterministic topic so SSR and client markup match,
  // then randomize after mount.
  const [topic, setTopic] = useState<string>(TOPICS[0]);

  useEffect(() => {
    // Deferring the random pick to post-mount avoids SSR/client hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTopic(pickRandomTopic());
  }, []);

  const helperTime = durationSeconds === 60 ? "1:00" : "2:00";

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-xl flex flex-col gap-10">
        <header className="flex flex-col gap-2">
          <h1 className="text-5xl font-semibold tracking-tight">Oink</h1>
          <p className="text-lg text-neutral-600 leading-relaxed">
            Replace every{" "}
            <InlinePopover
              ariaLabel="Target word"
              value={targetWord}
              displayLabel={targetDisplay(targetWord)}
              options={TARGET_WORD_OPTIONS}
              onChange={(v) => onTargetWordChange(v as TargetWord)}
            />{" "}
            with &ldquo;oink&rdquo; for{" "}
            <InlinePopover
              ariaLabel="Duration"
              value={String(durationSeconds)}
              displayLabel={durationDisplay(durationSeconds)}
              options={DURATION_OPTIONS}
              onChange={(v) =>
                onDurationChange(Number(v) as DurationSeconds)
              }
            />
            .
          </p>
        </header>

        <section className="flex flex-col gap-4">
          <div className="text-xs uppercase tracking-wider text-neutral-500">
            Your topic
          </div>
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-6 py-5 text-xl leading-snug text-neutral-900">
            {topic}
          </div>
          <button
            type="button"
            onClick={() => setTopic(pickRandomTopic(topic))}
            className="self-start text-sm text-neutral-500 hover:text-neutral-900 underline underline-offset-4 transition-colors"
          >
            New topic
          </button>
        </section>

        <button
          type="button"
          onClick={() => onStart(topic)}
          className="rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium py-4 text-lg transition-colors"
        >
          Start
        </button>

        <p className="text-xs text-neutral-400 text-center">
          {helperTime} recording. Stop early any time.
        </p>
      </div>
    </div>
  );
}
