import Phaser from "phaser";
import { getTeam, imageKeys, playSound, soundKeys } from "../game";
import type { TeamId, TeamOption } from "../game";

interface GameSceneData {
  teamId?: TeamId;
}

export class GameScene extends Phaser.Scene {
  private team!: TeamOption;

  constructor() {
    super("GameScene");
  }

  init(data: GameSceneData) {
    this.team = getTeam(data.teamId ?? "psg");
  }

  create() {
    const { width, height } = this.scale;

    this.add.image(width / 2, height / 2, imageKeys.stadium).setDisplaySize(width, height);
    this.add.rectangle(width / 2, 42, width, 84, 0x030814, 0.78);
    this.add.text(42, 28, this.team.name.toUpperCase(), {
      color: "#55d6ff",
      fontFamily: "monospace",
      fontSize: "28px",
      fontStyle: "bold",
    }).setOrigin(0, 0.5);
    this.add.text(width - 42, 28, "SHOT 1", {
      color: "#ffc83d",
      fontFamily: "monospace",
      fontSize: "28px",
      fontStyle: "bold",
    }).setOrigin(1, 0.5);

    const strikerKey = this.team.id === "psg" ? imageKeys.psgIdle : imageKeys.bayernIdle;
    this.add.image(width * 0.34, height * 0.74, strikerKey).setScale(0.75).setOrigin(0.5, 1);
    this.add.image(width * 0.5, height * 0.72, imageKeys.ball).setScale(0.55);
    this.add.image(width * 0.5, height * 0.47, imageKeys.keeperIdle).setScale(0.55).setOrigin(0.5, 1);

    this.add.text(width / 2, height - 42, "PHASER AIM SCREEN NEXT", {
      color: "#f8f4d8",
      fontFamily: "monospace",
      fontSize: "24px",
      fontStyle: "bold",
    }).setOrigin(0.5);

    playSound(this, soundKeys.whistle);
  }
}
