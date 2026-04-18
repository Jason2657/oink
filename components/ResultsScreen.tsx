"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Highlight, TranscribeResponse } from "@/lib/types";

interface ResultsScreenProps {
  audio: Blob;
  result: TranscribeResponse;
  onRestart: () => void;
}

function formatTime(sec: number): string {
  const total = Math.max(0, Math.floor(sec));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function verdict(oinks: number, misses: number): string {
  if (misses === 0 && oinks > 0) return "Clean run.";
  if (misses > oinks) return "Oinks got away from you.";
  return "Watch the misses below.";
}

export default function ResultsScreen({
  audio,
  result,
  onRestart,
}: ResultsScreenProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");

  useEffect(() => {
    const url = URL.createObjectURL(audio);
    setAudioUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [audio]);

  const { transcript, words, analysis } = result;
  const { oinkCount, missCount, highlights } = analysis;

  // Map wordIndex -> Highlight for O(1) lookup while rendering.
  const highlightByIndex = useMemo(() => {
    const m = new Map<number, Highlight>();
    for (const h of highlights) m.set(h.wordIndex, h);
    return m;
  }, [highlights]);

  const seekTo = (start: number) => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = Math.max(0, start);
    el.play().catch(() => {
      // Ignore autoplay rejection — user can press play.
    });
  };

  const hasWords = words.length > 0;

  return (
    <div className="flex flex-1 justify-center px-6 py-10">
      <div className="w-full max-w-2xl flex flex-col gap-10 pb-4">
        {/* Score summary */}
        <section className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-green-200 bg-green-50 px-6 py-5 flex flex-col gap-1">
              <div className="text-5xl font-semibold tabular-nums text-green-900">
                {oinkCount}
              </div>
              <div className="text-sm text-green-800">
                oink{oinkCount === 1 ? "" : "s"}
              </div>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 flex flex-col gap-1">
              <div className="text-5xl font-semibold tabular-nums text-red-900">
                {missCount}
              </div>
              <div className="text-sm text-red-800">
                miss{missCount === 1 ? "" : "es"}
              </div>
            </div>
          </div>
          <p className="text-neutral-600">{verdict(oinkCount, missCount)}</p>
        </section>

        {/* Transcript */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xs uppercase tracking-wider text-neutral-500">
            Transcript
          </h2>
          <div className="rounded-xl border border-neutral-200 bg-white px-5 py-5 text-lg leading-relaxed text-neutral-900">
            {hasWords ? (
              <p className="whitespace-pre-wrap">
                {words.map((w, i) => {
                  const display = w.punctuated_word ?? w.word;
                  const h = highlightByIndex.get(i);
                  if (!h) {
                    return (
                      <span key={i}>
                        {display}
                        {i < words.length - 1 ? " " : ""}
                      </span>
                    );
                  }
                  const classes =
                    h.type === "oink"
                      ? "bg-green-100 text-green-900"
                      : "bg-red-100 text-red-900";
                  return (
                    <span key={i}>
                      <button
                        type="button"
                        onClick={() => seekTo(h.start)}
                        className={`${classes} rounded-md px-1 cursor-pointer hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-blue-400`}
                        title={`Jump to ${formatTime(h.start)}`}
                      >
                        {display}
                      </button>
                      {h.type === "miss" ? (
                        <sup className="ml-0.5 text-[10px] font-mono text-red-700">
                          {formatTime(h.start)}
                        </sup>
                      ) : null}
                      {i < words.length - 1 ? " " : ""}
                    </span>
                  );
                })}
              </p>
            ) : (
              <p className="text-neutral-500 italic">
                {transcript || "No speech detected."}
              </p>
            )}
          </div>
        </section>

        {/* Sticky audio player */}
        <div className="sticky bottom-4 bg-white/90 backdrop-blur rounded-xl border border-neutral-200 px-4 py-3">
          <audio
            ref={audioRef}
            controls
            src={audioUrl}
            className="w-full"
            preload="metadata"
          />
        </div>

        <button
          type="button"
          onClick={onRestart}
          className="self-center rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
