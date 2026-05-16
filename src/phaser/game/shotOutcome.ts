import type { ShotEvaluation, ShotResult, ShotZone, TeamName } from "./types";

export function evaluateShot(params: {
  team: TeamName;
  zone: ShotZone;
  finalWpm: number;
  finalAccuracy: number;
  completedText: boolean;
  random?: () => number;
}): ShotEvaluation {
  const { team, zone, finalWpm, finalAccuracy, completedText, random = Math.random } = params;
  const passedTyping = completedText && finalWpm >= zone.wpm && finalAccuracy >= zone.accuracy;

  if (!passedTyping) {
    return {
      result: "miss",
      title: "Miss!",
      detail: `You needed ${zone.wpm} WPM and ${zone.accuracy}% accuracy for ${zone.name}. You finished at ${finalWpm} WPM and ${finalAccuracy}% accuracy.`,
      passedTyping,
    };
  }

  const result: ShotResult = random() <= zone.chance ? "goal" : "save";

  return {
    result,
    title: result === "goal" ? "Goal!" : "Saved!",
    detail:
      result === "goal"
        ? `${team} buries it ${zone.name}. ${zone.note}`
        : `Clean typing, but the keeper guessed it. This placement had a ${Math.round(zone.chance * 100)}% scoring chance.`,
    passedTyping,
  };
}
