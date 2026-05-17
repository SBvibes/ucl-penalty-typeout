import Phaser from "phaser";
import { createShootoutSession, playSound, soundKeys, startStadiumAmbience, teams } from "../game";
import type { TeamOption } from "../game";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x061022);
    this.add.text(width / 2, 118, "UCL SEMI FINAL", {
      color: "#55d6ff",
      fontFamily: "monospace",
      fontSize: "26px",
      fontStyle: "bold",
    }).setOrigin(0.5);
    this.add.text(width / 2, 178, "FINAL SHOT", {
      color: "#ffc83d",
      fontFamily: "monospace",
      fontSize: "64px",
      fontStyle: "bold",
    }).setOrigin(0.5);
    this.add.text(width / 2, 254, "SELECT CLUB", {
      color: "#55d6ff",
      fontFamily: "monospace",
      fontSize: "30px",
      fontStyle: "bold",
    }).setOrigin(0.5);

    this.createTeamCard(width / 2 - 230, 420, teams[0]);
    this.createTeamCard(width / 2 + 230, 420, teams[1]);

    this.add.text(width / 2, 630, "PRESS A SIDE TO STEP UP", {
      color: "#f8f4d8",
      fontFamily: "monospace",
      fontSize: "22px",
    }).setOrigin(0.5);
  }

  private createTeamCard(x: number, y: number, team: TeamOption) {
    const card = this.add.container(x, y);
    const shadow = this.add.rectangle(10, 12, 360, 260, 0x02050b);
    const panel = this.add.rectangle(0, 0, 360, 260, team.darkColor);
    const inset = this.add.rectangle(0, 0, 328, 228, team.primaryColor, 0.72);
    const badge = this.add.circle(0, -48, 52, 0x061022);
    const badgeRing = this.add.circle(0, -48, 62).setStrokeStyle(8, 0xf8f4d8);
    const initials = team.name === "PSG" ? "P" : "M";
    const badgeText = this.add.text(0, -50, initials, {
      color: "#ffc83d",
      fontFamily: "monospace",
      fontSize: "54px",
      fontStyle: "bold",
    }).setOrigin(0.5);
    const name = this.add.text(0, 42, team.name.toUpperCase(), {
      color: "#ffffff",
      fontFamily: "monospace",
      fontSize: team.name === "PSG" ? "44px" : "32px",
      fontStyle: "bold",
      align: "center",
    }).setOrigin(0.5);
    const country = this.add.text(0, 96, team.country.toUpperCase(), {
      color: "#55d6ff",
      fontFamily: "monospace",
      fontSize: "22px",
      fontStyle: "bold",
    }).setOrigin(0.5);

    panel.setStrokeStyle(6, 0x02050b);
    inset.setStrokeStyle(4, 0xf8f4d8, 0.22);
    card.add([shadow, panel, inset, badge, badgeRing, badgeText, name, country]);
    card.setSize(360, 260);
    card.setInteractive({ useHandCursor: true });

    card.on("pointerover", () => {
      this.tweens.add({ targets: card, y: y - 8, duration: 90, ease: "Quad.easeOut" });
    });
    card.on("pointerout", () => {
      this.tweens.add({ targets: card, y, duration: 90, ease: "Quad.easeOut" });
    });
    card.on("pointerdown", () => {
      playSound(this, soundKeys.select);
      startStadiumAmbience(this);
      this.scene.start("GameScene", {
        teamId: team.id,
        session: createShootoutSession(team.id),
      });
    });
  }
}
