import type { ShootoutSession, ShootoutShot, TeamId } from "./types";

export const DEFAULT_SHOOTOUT_SHOTS = 5;

export function createShootoutSession(teamId: TeamId, maxShots = DEFAULT_SHOOTOUT_SHOTS): ShootoutSession {
  return {
    teamId,
    shotNumber: 1,
    maxShots,
    goals: 0,
    shots: [],
  };
}

export function addShootoutShot(session: ShootoutSession, shot: ShootoutShot): ShootoutSession {
  const shots = [...session.shots, shot];
  const goals = shots.filter((item) => item.result === "goal").length;

  return {
    ...session,
    shotNumber: Math.min(shots.length + 1, session.maxShots),
    goals,
    shots,
  };
}

export function isShootoutComplete(session: ShootoutSession): boolean {
  return session.shots.length >= session.maxShots;
}

export function getAverageWpm(session: ShootoutSession): number {
  if (session.shots.length === 0) return 0;

  return Math.round(session.shots.reduce((sum, shot) => sum + shot.wpm, 0) / session.shots.length);
}

export function getAverageAccuracy(session: ShootoutSession): number {
  if (session.shots.length === 0) return 100;

  return Math.round(session.shots.reduce((sum, shot) => sum + shot.accuracy, 0) / session.shots.length);
}
