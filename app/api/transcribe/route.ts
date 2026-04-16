import { DeepgramClient } from "@deepgram/sdk";
import type { DeepgramWord, TranscribeResponse } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "Server is missing DEEPGRAM_API_KEY." },
        { status: 500 }
      );
    }

    const form = await req.formData();
    const audio = form.get("audio");
    if (!(audio instanceof Blob)) {
      return Response.json(
        { error: "Expected 'audio' field of type Blob." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await audio.arrayBuffer());

    const client = new DeepgramClient({ apiKey });
    const response = await client.listen.v1.media.transcribeFile(buffer, {
      model: "nova-3",
      smart_format: true,
      punctuate: true,
      filler_words: true,
    });

    if (!("results" in response) || !response.results) {
      return Response.json(
        { error: "Deepgram returned no results." },
        { status: 502 }
      );
    }

    const alt = response.results.channels?.[0]?.alternatives?.[0];
    const transcript = alt?.transcript ?? "";
    const rawWords = alt?.words ?? [];
    const words: DeepgramWord[] = rawWords.map((w) => ({
      word: w.word ?? "",
      start: w.start ?? 0,
      end: w.end ?? 0,
      confidence: w.confidence,
      punctuated_word: (w as { punctuated_word?: string }).punctuated_word,
    }));

    const body: TranscribeResponse = {
      transcript,
      words,
      analysis: { oinkCount: 0, missCount: 0, highlights: [] },
    };

    return Response.json(body);
  } catch (err) {
    console.error("transcribe error", err);
    const message =
      err instanceof Error ? err.message : "Transcription failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
