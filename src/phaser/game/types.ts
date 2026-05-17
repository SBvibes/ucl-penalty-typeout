export type TeamId = "psg" | "bayern";

export type TeamName = "PSG" | "Bayern Munich";

export type ShotResult = "goal" | "miss" | "save";

export type ShotZoneName =
  | "Top Left"
  | "Top Center"
  | "Top Right"
  | "Mid Left"
  | "Mid Center"
  | "Mid Right"
  | "Low Left"
  | "Low Center"
  | "Low Right";

export interface ShotZone {
  name: ShotZoneName;
  x: number;
  y: number;
  wpm: number;
  accuracy: number;
  chance: number;
  sentence: string;
  note: string;
}

export interface TypingStats {
  typed: string;
  currentWpm: number;
  accuracy: number;
  remaining: number;
}

export interface ShotEvaluation {
  result: ShotResult;
  title: string;
  detail: string;
  passedTyping: boolean;
}

export interface ShootoutShot {
  result: ShotResult;
  zoneName: ShotZoneName;
  wpm: number;
  accuracy: number;
}

export interface ShootoutSession {
  teamId: TeamId;
  shotNumber: number;
  maxShots: number;
  goals: number;
  shots: ShootoutShot[];
}
