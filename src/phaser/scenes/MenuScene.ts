import Phaser from "phaser";

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
  }
}
