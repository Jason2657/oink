import type { AnalysisResult, DeepgramWord, Highlight } from "@/lib/types";

const MISS_WORDS = new Set([
  "i",
  "i'm",
  "i'll",
  "i've",
  "i'd",
  "im",
  "ill",
  "ive",
  "id",
]);

const OINK_WORDS = new Set(["oink", "oinks"]);

function normalize(raw: string): string {
  // Lowercase, strip surrounding punctuation but keep internal apostrophes.
  return raw.toLowerCase().replace(/^[^a-z']+|[^a-z']+$/g, "");
}

export function analyzeWords(words: DeepgramWord[]): AnalysisResult {
  const highlights: Highlight[] = [];
  let oinkCount = 0;
  let missCount = 0;

  words.forEach((w, i) => {
    const source = w.punctuated_word ?? w.word;
    const token = normalize(source);
    if (!token) return;

    if (OINK_WORDS.has(token)) {
      oinkCount += 1;
      highlights.push({
        word: source,
        start: w.start,
        end: w.end,
        type: "oink",
        wordIndex: i,
      });
    } else if (MISS_WORDS.has(token)) {
      missCount += 1;
      highlights.push({
        word: source,
        start: w.start,
        end: w.end,
        type: "miss",
        wordIndex: i,
      });
    }
  });

  return { oinkCount, missCount, highlights };
}
