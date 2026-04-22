"use client";

import { useEffect, useState } from "react";
import type { TargetWord, TranscribeResponse } from "@/lib/types";

interface ProcessingScreenProps {
  audio: Blob;
  targetWord: TargetWord;
  onComplete: (result: TranscribeResponse) => void;
  onRetry: () => void;
}

export default function ProcessingScreen({
  audio,
  targetWord,
  onComplete,
  onRetry,
}: ProcessingScreenProps) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const form = new FormData();
        form.append("audio", audio, "recording.webm");
        form.append("targetWord", targetWord);
        const res = await fetch("/api/transcribe", {
          method: "POST",
          body: form,
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(body.error ?? `Request failed (${res.status}).`);
        }
        const data = (await res.json()) as TranscribeResponse;
        if (!cancelled) onComplete(data);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Something went wrong."
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [audio, targetWord, onComplete]);

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-md flex flex-col gap-6 text-center">
          <h2 className="text-2xl font-semibold">Something went wrong</h2>
          <p className="text-neutral-600">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <div className="flex flex-col items-center gap-6">
        <div
          className="h-10 w-10 rounded-full border-2 border-neutral-200 border-t-blue-600 animate-spin"
          aria-label="Loading"
          role="status"
        />
        <p className="text-neutral-600">Analyzing your speech…</p>
      </div>
    </div>
  );
}
