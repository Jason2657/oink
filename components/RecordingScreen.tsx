"use client";

import { useEffect, useRef, useState } from "react";

interface RecordingScreenProps {
  topic: string;
  durationSec: number;
  onComplete: (audio: Blob) => void;
  onCancel: () => void;
}

type Phase = "requesting" | "countdown" | "recording" | "error";

export default function RecordingScreen({
  topic,
  durationSec,
  onComplete,
  onCancel,
}: RecordingScreenProps) {
  const [phase, setPhase] = useState<Phase>("requesting");
  const [countdown, setCountdown] = useState(3);
  const [remaining, setRemaining] = useState(durationSec);
  const [level, setLevel] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stoppedRef = useRef(false);

  // Cleanup helper
  const cleanup = () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    if (countdownIntervalRef.current)
      clearInterval(countdownIntervalRef.current);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    rafRef.current = null;
    countdownIntervalRef.current = null;
    timerIntervalRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close().catch(() => {});
    }
    audioCtxRef.current = null;
    analyserRef.current = null;
  };

  // Request mic + wire analyser
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        source.connect(analyser);
        analyserRef.current = analyser;

        const buf = new Uint8Array(analyser.fftSize);
        const tick = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteTimeDomainData(buf);
          let sumSq = 0;
          for (let i = 0; i < buf.length; i++) {
            const v = (buf[i] - 128) / 128;
            sumSq += v * v;
          }
          const rms = Math.sqrt(sumSq / buf.length);
          setLevel(Math.min(1, rms * 2.5));
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);

        setPhase("countdown");
      } catch (err) {
        const message =
          err instanceof DOMException && err.name === "NotAllowedError"
            ? "Microphone access was denied. Enable it in your browser and try again."
            : "Couldn't access the microphone.";
        setErrorMsg(message);
        setPhase("error");
      }
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  // Countdown 3-2-1
  useEffect(() => {
    if (phase !== "countdown") return;
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          setPhase("recording");
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => {
      if (countdownIntervalRef.current)
        clearInterval(countdownIntervalRef.current);
    };
  }, [phase]);

  // Start recording when phase flips to "recording"
  useEffect(() => {
    if (phase !== "recording" || !streamRef.current) return;

    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";

    const recorder = new MediaRecorder(
      streamRef.current,
      mimeType ? { mimeType } : undefined
    );
    recorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      if (stoppedRef.current) return;
      stoppedRef.current = true;
      const blob = new Blob(chunksRef.current, {
        type: mimeType || "audio/webm",
      });
      onComplete(blob);
    };

    recorder.start();
    setRemaining(durationSec);

    timerIntervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          if (recorderRef.current && recorderRef.current.state !== "inactive") {
            recorderRef.current.stop();
          }
          return 0;
        }
        return r - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const handleStop = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
  };

  const mm = Math.floor(remaining / 60)
    .toString()
    .padStart(1, "0");
  const ss = (remaining % 60).toString().padStart(2, "0");

  if (phase === "error") {
    return (
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-md flex flex-col gap-6 text-center">
          <h2 className="text-2xl font-semibold">Mic unavailable</h2>
          <p className="text-neutral-600">{errorMsg}</p>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 transition-colors"
          >
            Back to setup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-xl flex flex-col items-center gap-10">
        <div className="text-sm text-neutral-500 text-center max-w-md">
          {topic}
        </div>

        {phase === "requesting" && (
          <div className="text-neutral-500 text-lg">Requesting microphone…</div>
        )}

        {phase === "countdown" && (
          <div className="text-8xl font-semibold tabular-nums tracking-tight text-neutral-900">
            {countdown}
          </div>
        )}

        {phase === "recording" && (
          <>
            <div className="text-8xl font-mono font-semibold tabular-nums tracking-tight text-neutral-900">
              {mm}:{ss}
            </div>

            <div className="w-full max-w-sm h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-[width] duration-75"
                style={{ width: `${Math.round(level * 100)}%` }}
              />
            </div>

            <button
              type="button"
              onClick={handleStop}
              className="rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-medium px-8 py-3 transition-colors"
            >
              Stop
            </button>
          </>
        )}
      </div>
    </div>
  );
}
