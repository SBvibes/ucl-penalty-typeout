import Phaser from "phaser";
import { playSound, shotZoneList, soundKeys } from "../game";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x061022);
    this.add.text(width / 2, 190, "FINAL SHOT", {
      color: "#ffc83d",
      fontFamily: "monospace",
      fontSize: "64px",
      fontStyle: "bold",
    }).setOrigin(0.5);
    this.add.text(width / 2, 282, "PHASER MIGRATION SHELL", {
      color: "#55d6ff",
      fontFamily: "monospace",
      fontSize: "28px",
    }).setOrigin(0.5);
    this.add.text(width / 2, 380, "Current static game remains the fallback.", {
      color: "#f8f4d8",
      fontFamily: "monospace",
      fontSize: "22px",
    }).setOrigin(0.5);
    this.add.text(width / 2, 432, `${shotZoneList.length} shot zones loaded`, {
      color: "#76ff7a",
      fontFamily: "monospace",
      fontSize: "20px",
    }).setOrigin(0.5);
    this.add.text(width / 2, 482, "click canvas to test ui sfx", {
      color: "#f8f4d8",
      fontFamily: "monospace",
      fontSize: "18px",
    }).setOrigin(0.5);

    this.input.once("pointerdown", () => {
      playSound(this, soundKeys.select);
    });
  }
}
