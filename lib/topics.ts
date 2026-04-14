export const TOPICS = [
  "A time you changed your mind about something important",
  "The best meal you've had in the last year",
  "Something you believed as a kid that turned out to be wrong",
  "A skill you wish you had",
  "The last time you were genuinely surprised",
  "A place you'd visit if money were no object",
  "Something small that makes you unreasonably happy",
  "A decision you're glad you made",
  "A hobby you've been meaning to pick up",
  "The most memorable conversation you've had recently",
] as const;

export function pickRandomTopic(exclude?: string): string {
  const pool = exclude ? TOPICS.filter((t) => t !== exclude) : TOPICS;
  return pool[Math.floor(Math.random() * pool.length)];
}
