import type { TeamId, TeamName } from "./types";

export interface TeamOption {
  id: TeamId;
  name: TeamName;
  country: string;
  primaryColor: number;
  darkColor: number;
}

export const teams: TeamOption[] = [
  {
    id: "bayern",
    name: "Bayern Munich",
    country: "Germany",
    primaryColor: 0xc5163f,
    darkColor: 0x520717,
  },
  {
    id: "psg",
    name: "PSG",
    country: "France",
    primaryColor: 0x0b56a5,
    darkColor: 0x061a3b,
  },
];

export function getTeam(id: TeamId): TeamOption {
  return teams.find((team) => team.id === id) ?? teams[0];
}
