"use client";

import { useState } from "react";
import { pickRandomTopic } from "@/lib/topics";

interface SetupScreenProps {
  onStart: (topic: string) => void;
}

export default function SetupScreen({ onStart }: SetupScreenProps) {
  const [topic, setTopic] = useState<string>(() => pickRandomTopic());

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-xl flex flex-col gap-10">
        <header className="flex flex-col gap-2">
          <h1 className="text-5xl font-semibold tracking-tight">Oink</h1>
          <p className="text-lg text-neutral-600">
            Replace every &ldquo;I&rdquo; with &ldquo;oink&rdquo; for 2 minutes.
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
          2:00 recording. Stop early any time.
        </p>
      </div>
    </div>
  );
}
