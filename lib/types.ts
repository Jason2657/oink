export type AppState = "setup" | "recording" | "processing" | "results";

export interface DeepgramWord {
  word: string;
  start: number;
  end: number;
  punctuated_word?: string;
  confidence?: number;
}

export type HighlightType = "oink" | "miss";

export interface Highlight {
  word: string;
  start: number;
  end: number;
  type: HighlightType;
  wordIndex: number;
}

export interface AnalysisResult {
  oinkCount: number;
  missCount: number;
  highlights: Highlight[];
}

export interface TranscribeResponse {
  transcript: string;
  words: DeepgramWord[];
  analysis: AnalysisResult;
}
