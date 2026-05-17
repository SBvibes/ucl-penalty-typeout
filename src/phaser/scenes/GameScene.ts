import Phaser from "phaser";
import {
  clampTypedText,
  getTimeLimitSeconds,
  getTeam,
  getTypingStats,
  imageKeys,
  playSound,
  shotZoneList,
  soundKeys,
} from "../game";
import type { ShotZone, TeamId, TeamOption, TypingStats } from "../game";

interface GameSceneData {
  teamId?: TeamId;
}

export class GameScene extends Phaser.Scene {
  private team!: TeamOption;
  private selectedMarker?: Phaser.GameObjects.Rectangle;
  private previewText?: Phaser.GameObjects.Text;
  private typingOverlay?: Phaser.GameObjects.Container;
  private statsText?: Phaser.GameObjects.Text;
  private promptChars: Phaser.GameObjects.Text[] = [];
  private activeZone?: ShotZone;
  private typedText = "";
  private startedAtMs = 0;
  private timeLimitSeconds = 0;
  private typingActive = false;
  private typingComplete = false;

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

  update() {
    if (!this.activeZone || this.typingComplete) return;

    const stats = this.getCurrentTypingStats();
    this.updateStatsText(stats);

    if (this.typingActive && stats.remaining <= 0) {
      this.typingComplete = true;
      this.previewText?.setText("TIME! KICK RESULT NEXT");
    }
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
        this.showTypingOverlay(zone);
      });
    });
  }

  private updatePreview(zone: ShotZone) {
    this.previewText?.setText(
      `${zone.name.toUpperCase()}  ${zone.wpm} WPM  ${zone.accuracy}% ACC  ${Math.round(zone.chance * 100)}% SCORE`,
    );
  }

  private showTypingOverlay(zone: ShotZone) {
    this.activeZone = zone;
    this.typedText = "";
    this.startedAtMs = 0;
    this.timeLimitSeconds = getTimeLimitSeconds(zone);
    this.typingActive = false;
    this.typingComplete = false;

    this.typingOverlay?.destroy(true);
    this.promptChars = [];
    this.typingOverlay = this.createTypingOverlay(zone);
    this.updateStatsText(this.getCurrentTypingStats());
    this.renderPrompt();
    this.input.keyboard?.off("keydown", this.handleTypingKey, this);
    this.input.keyboard?.on("keydown", this.handleTypingKey, this);
  }

  private createTypingOverlay(zone: ShotZone) {
    const { width, height } = this.scale;
    const overlay = this.add.container(0, 0).setDepth(30);
    const shade = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.52);
    const panel = this.add.rectangle(width / 2, height * 0.53, width * 0.82, 250, 0x061022, 0.78);
    const border = this.add.rectangle(width / 2, height * 0.53, width * 0.82, 250).setStrokeStyle(4, 0x55d6ff, 0.8);
    const title = this.add
      .text(width / 2, height * 0.36, `${zone.name.toUpperCase()} - TYPE TO SHOOT`, {
        color: "#55d6ff",
        fontFamily: "monospace",
        fontSize: "24px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.statsText = this.add
      .text(width / 2, height * 0.42, "", {
        color: "#ffc83d",
        fontFamily: "monospace",
        fontSize: "18px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const hint = this.add
      .text(width / 2, height * 0.665, "TYPE THE SENTENCE - BACKSPACE WORKS", {
        color: "#f8f4d8",
        fontFamily: "monospace",
        fontSize: "17px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    overlay.add([shade, panel, border, title, this.statsText, hint]);
    return overlay;
  }

  private handleTypingKey(event: KeyboardEvent) {
    if (!this.activeZone || this.typingComplete) return;

    if (event.key === "Backspace") {
      this.typedText = this.typedText.slice(0, -1);
      this.renderPrompt();
      this.updateStatsText(this.getCurrentTypingStats());
      return;
    }

    if (event.key === "Enter") return;
    if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return;

    if (!this.typingActive) {
      this.typingActive = true;
      this.startedAtMs = Date.now();
    }

    this.typedText = clampTypedText(this.typedText + event.key, this.activeZone.sentence);
    this.renderPrompt();
    const stats = this.getCurrentTypingStats();
    this.updateStatsText(stats);

    if (this.typedText === this.activeZone.sentence) {
      this.typingComplete = true;
      this.previewText?.setText(`DONE  ${stats.currentWpm} WPM  ${stats.accuracy}% ACC - KICK RESULT NEXT`);
    }
  }

  private getCurrentTypingStats(): TypingStats {
    if (!this.activeZone) {
      return { typed: "", currentWpm: 0, accuracy: 100, remaining: 0 };
    }

    return getTypingStats({
      typed: this.typedText,
      sentence: this.activeZone.sentence,
      startedAtMs: this.startedAtMs,
      nowMs: Date.now(),
      timeLimitSeconds: this.timeLimitSeconds,
      typingActive: this.typingActive,
    });
  }

  private updateStatsText(stats: TypingStats) {
    if (!this.activeZone) return;

    this.statsText?.setText(
      `TARGET ${this.activeZone.wpm} WPM   REQ ${this.activeZone.accuracy}%   TIME ${stats.remaining.toFixed(
        1,
      )}s   WPM ${stats.currentWpm}   ACC ${stats.accuracy}%`,
    );
  }

  private renderPrompt() {
    if (!this.activeZone || !this.typingOverlay) return;

    this.promptChars.forEach((char) => char.destroy());
    this.promptChars = [];

    const { width, height } = this.scale;
    const sentence = this.activeZone.sentence;
    const charsPerLine = 44;
    const charWidth = 15;
    const lineHeight = 30;
    const startX = width / 2 - (charsPerLine * charWidth) / 2;
    const startY = height * 0.475;

    Array.from(sentence).forEach((character, index) => {
      const line = Math.floor(index / charsPerLine);
      const col = index % charsPerLine;
      const typed = index < this.typedText.length;
      const correct = typed && this.typedText[index] === character;
      const color = !typed ? "#7d8794" : correct ? "#fff176" : "#ff3c4f";
      const text = this.add.text(startX + col * charWidth, startY + line * lineHeight, character, {
        color,
        fontFamily: "monospace",
        fontSize: "24px",
        fontStyle: "bold",
      });

      this.promptChars.push(text);
      this.typingOverlay?.add(text);
    });
  }
}
