import type {
  AnalysisResult,
  DeepgramWord,
  Highlight,
  TargetWord,
} from "@/lib/types";

const I_WORDS = new Set([
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

const LIKE_WORDS = new Set(["like", "likes"]);
const ACTUALLY_WORDS = new Set(["actually"]);
const BASICALLY_WORDS = new Set(["basically"]);
const LITERALLY_WORDS = new Set(["literally"]);

const MISS_SETS: Record<TargetWord, Set<string>> = {
  I: I_WORDS,
  like: LIKE_WORDS,
  actually: ACTUALLY_WORDS,
  basically: BASICALLY_WORDS,
  literally: LITERALLY_WORDS,
};

const OINK_WORDS = new Set(["oink", "oinks"]);

function normalize(raw: string): string {
  // Lowercase, strip surrounding punctuation but keep internal apostrophes.
  return raw.toLowerCase().replace(/^[^a-z']+|[^a-z']+$/g, "");
}

export function analyzeWords(
  words: DeepgramWord[],
  targetWord: TargetWord = "I"
): AnalysisResult {
  const missSet = MISS_SETS[targetWord];
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
    } else if (missSet.has(token)) {
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
