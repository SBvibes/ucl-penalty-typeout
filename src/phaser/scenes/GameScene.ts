import Phaser from "phaser";
import { getTeam, imageKeys, playSound, shotZoneList, soundKeys } from "../game";
import type { ShotZone, TeamId, TeamOption } from "../game";

interface GameSceneData {
  teamId?: TeamId;
}

export class GameScene extends Phaser.Scene {
  private team!: TeamOption;
  private selectedMarker?: Phaser.GameObjects.Rectangle;
  private previewText?: Phaser.GameObjects.Text;

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

    const strikerKey = this.team.id === "bayern" ? imageKeys.bayernStrikerIdleClean : imageKeys.strikerIdleClean;
    this.add.image(width * 0.34, height * 0.74, strikerKey).setScale(0.17).setOrigin(0.5, 1);
    this.add.image(width * 0.5, height * 0.705, imageKeys.ball).setScale(0.55);
    this.add.image(width * 0.5, height * 0.515, imageKeys.goalkeeperIdleClean).setScale(0.145).setOrigin(0.5, 1);

    this.createAimZones();

    this.previewText = this.add.text(width / 2, height - 42, "AIM YOUR SHOT", {
      color: "#f8f4d8",
      fontFamily: "monospace",
      fontSize: "24px",
      fontStyle: "bold",
      align: "center",
    }).setOrigin(0.5);

    playSound(this, soundKeys.whistle);
  }

  private createAimZones() {
    const { width, height } = this.scale;
    const goalBox = {
      x: width * 0.327,
      y: height * 0.306,
      width: width * 0.346,
      height: height * 0.206,
    };
    const cellWidth = goalBox.width / 3;
    const cellHeight = goalBox.height / 3;

    this.selectedMarker = this.add
      .rectangle(goalBox.x, goalBox.y, cellWidth, cellHeight)
      .setOrigin(0)
      .setStrokeStyle(4, 0xffc83d, 1)
      .setFillStyle(0xffc83d, 0.16)
      .setVisible(false);

    shotZoneList.forEach((zone) => {
      const col = zone.x < 34 ? 0 : zone.x > 66 ? 2 : 1;
      const row = zone.y < 34 ? 0 : zone.y > 66 ? 2 : 1;
      const x = goalBox.x + col * cellWidth;
      const y = goalBox.y + row * cellHeight;
      const zoneRect = this.add
        .rectangle(x, y, cellWidth, cellHeight, 0x55d6ff, 0.01)
        .setOrigin(0)
        .setInteractive({ useHandCursor: true });

      zoneRect.on("pointerover", () => {
        zoneRect.setFillStyle(0x55d6ff, 0.14);
        this.updatePreview(zone);
      });
      zoneRect.on("pointerout", () => {
        zoneRect.setFillStyle(0x55d6ff, 0.01);
      });
      zoneRect.on("pointerdown", () => {
        playSound(this, soundKeys.select);
        this.selectedMarker?.setPosition(x, y).setVisible(true);
        this.updatePreview(zone);
      });
    });
  }

  private updatePreview(zone: ShotZone) {
    this.previewText?.setText(
      `${zone.name.toUpperCase()}  ${zone.wpm} WPM  ${zone.accuracy}% ACC  ${Math.round(zone.chance * 100)}% SCORE`,
    );
  }
}
