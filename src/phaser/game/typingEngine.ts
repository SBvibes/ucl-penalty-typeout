import type { ShotZone, TypingStats } from "./types";

export function getTimeLimitSeconds(zone: ShotZone): number {
  return Math.max(5.5, (zone.sentence.split(" ").length / zone.wpm) * 60);
}

export function clampTypedText(value: string, sentence: string): string {
  return value.slice(0, sentence.length);
}

export function getTypingStats(params: {
  typed: string;
  sentence: string;
  startedAtMs: number;
  nowMs: number;
  timeLimitSeconds: number;
  typingActive: boolean;
}): TypingStats {
  const { typed, sentence, startedAtMs, nowMs, timeLimitSeconds, typingActive } = params;
  const elapsed = startedAtMs ? (nowMs - startedAtMs) / 1000 : 0;
  const elapsedForWpm = Math.max(elapsed, 0.1);
  const wordsTyped = typed.trim() ? typed.trim().split(/\s+/).length : 0;
  const currentWpm = typingActive ? Math.round((wordsTyped / elapsedForWpm) * 60) : 0;
  let matchingChars = 0;

  for (let index = 0; index < typed.length; index += 1) {
    if (typed[index] === sentence[index]) matchingChars += 1;
  }

  return {
    typed,
    currentWpm,
    accuracy: typed.length ? Math.round((matchingChars / typed.length) * 100) : 100,
    remaining: typingActive ? Math.max(0, timeLimitSeconds - elapsed) : timeLimitSeconds,
  };
}

export function getCharacterState(sentence: string, typed: string, index: number): "correct" | "wrong" | "untyped" {
  if (index >= typed.length) return "untyped";
  return typed[index] === sentence[index] ? "correct" : "wrong";
}
