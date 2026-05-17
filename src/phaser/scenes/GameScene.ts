import Phaser from "phaser";
import {
  clampTypedText,
  createAudioToggle,
  evaluateShot,
  getTimeLimitSeconds,
  getTeam,
  getTypingStats,
  imageKeys,
  playGoalReaction,
  playMissReaction,
  playSaveReaction,
  playSound,
  createShootoutSession,
  shotZoneList,
  soundKeys,
} from "../game";
import type { ShootoutSession, ShotEvaluation, ShotZone, TeamId, TeamOption, TypingStats } from "../game";

interface GameSceneData {
  teamId?: TeamId;
  session?: ShootoutSession;
}

export class GameScene extends Phaser.Scene {
  private team!: TeamOption;
  private session!: ShootoutSession;
  private strikerSprite?: Phaser.GameObjects.Image;
  private keeperSprite?: Phaser.GameObjects.Image;
  private ballSprite?: Phaser.GameObjects.Image;
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
  private resultScheduled = false;
  private mobileInput?: HTMLTextAreaElement;

  constructor() {
    super("GameScene");
  }

  init(data: GameSceneData) {
    this.team = getTeam(data.teamId ?? "psg");
    this.session = data.session ?? createShootoutSession(this.team.id);
    this.activeZone = undefined;
    this.typedText = "";
    this.startedAtMs = 0;
    this.timeLimitSeconds = 0;
    this.typingActive = false;
    this.typingComplete = false;
    this.resultScheduled = false;
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
    this.add.text(width - 42, 28, `SHOT ${this.session.shotNumber}/${this.session.maxShots}`, {
      color: "#ffc83d",
      fontFamily: "monospace",
      fontSize: "28px",
      fontStyle: "bold",
    }).setOrigin(1, 0.5);
    this.createShotPips(width / 2, 58);
    createAudioToggle(this, width - 42, 76);

    const strikerKey = this.team.id === "bayern" ? imageKeys.bayernStrikerIdleClean : imageKeys.strikerIdleClean;
    this.strikerSprite = this.add.image(width * 0.34, height * 0.74, strikerKey).setScale(0.17).setOrigin(0.5, 1);
    this.ballSprite = this.add.image(width * 0.5, height * 0.705, imageKeys.ball).setScale(0.55);
    this.keeperSprite = this.add.image(width * 0.5, height * 0.515, imageKeys.goalkeeperIdleClean).setScale(0.145).setOrigin(0.5, 1);

    this.createAimZones();

    this.previewText = this.add.text(width / 2, height - 42, `AIM YOUR SHOT  SCORE ${this.session.goals}/${this.session.shots.length}`, {
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
      this.finishTyping(false, stats);
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
        this.focusMobileInput();
      });
    });
  }

  private createShotPips(x: number, y: number) {
    const gap = 34;
    const startX = x - ((this.session.maxShots - 1) * gap) / 2;

    for (let index = 0; index < this.session.maxShots; index += 1) {
      const shot = this.session.shots[index];
      const active = index + 1 === this.session.shotNumber;
      const color = shot ? this.getShotPipColor(shot.result) : active ? 0xffc83d : 0x173156;
      const alpha = shot || active ? 1 : 0.65;
      const pip = this.add.circle(startX + index * gap, y, active ? 10 : 8, color, alpha);
      pip.setStrokeStyle(3, active ? 0xf8f4d8 : 0x07111f, 0.9);

      if (shot) {
        this.add.text(startX + index * gap, y + 1, shot.result === "goal" ? "G" : shot.result === "save" ? "S" : "M", {
          color: "#061022",
          fontFamily: "monospace",
          fontSize: "12px",
          fontStyle: "bold",
        }).setOrigin(0.5);
      }
    }
  }

  private getShotPipColor(result: ShotEvaluation["result"]) {
    if (result === "goal") return 0xfff176;
    if (result === "save") return 0x55d6ff;
    return 0xff5266;
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
    this.ensureMobileInput();
    if (this.mobileInput) {
      this.mobileInput.value = "";
      this.mobileInput.maxLength = zone.sentence.length;
    }
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

    const hintText = this.isTouchDevice() ? "TAP TEXT TO TYPE - BACKSPACE WORKS" : "TYPE THE SENTENCE - BACKSPACE WORKS";
    const hint = this.add
      .text(width / 2, height * 0.665, hintText, {
        color: "#f8f4d8",
        fontFamily: "monospace",
        fontSize: "17px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    overlay.add([shade, panel, border, title, this.statsText, hint]);
    overlay.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, width, height),
      Phaser.Geom.Rectangle.Contains,
    );
    overlay.on("pointerdown", () => this.focusMobileInput());
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
      this.finishTyping(true, stats);
    }
  }

  private handleMobileInput = () => {
    if (!this.activeZone || this.typingComplete || !this.mobileInput) return;

    if (!this.typingActive && this.mobileInput.value.length > 0) {
      this.typingActive = true;
      this.startedAtMs = Date.now();
    }

    this.typedText = clampTypedText(this.mobileInput.value, this.activeZone.sentence);
    if (this.mobileInput.value !== this.typedText) {
      this.mobileInput.value = this.typedText;
    }

    this.renderPrompt();
    const stats = this.getCurrentTypingStats();
    this.updateStatsText(stats);

    if (this.typedText === this.activeZone.sentence) {
      this.finishTyping(true, stats);
    }
  };

  private finishTyping(completedText: boolean, stats: TypingStats) {
    if (!this.activeZone || this.resultScheduled) return;

    this.typingComplete = true;
    this.resultScheduled = true;
    this.input.keyboard?.off("keydown", this.handleTypingKey, this);
    this.removeMobileInput();

    const evaluation = evaluateShot({
      team: this.team.name,
      zone: this.activeZone,
      finalWpm: stats.currentWpm,
      finalAccuracy: stats.accuracy,
      completedText,
    });

    this.previewText?.setText(
      `${evaluation.title.toUpperCase()}  ${stats.currentWpm} WPM  ${stats.accuracy}% ACC`,
    );
    this.typingOverlay?.destroy(true);
    this.typingOverlay = undefined;
    this.promptChars = [];

    this.playKickSequence(this.activeZone, evaluation, stats);
  }

  private playKickSequence(zone: ShotZone, evaluation: ShotEvaluation, stats: TypingStats) {
    const { width, height } = this.scale;
    const strikerKickKey =
      this.team.id === "bayern" ? imageKeys.bayernStrikerKickFollowthroughClean : imageKeys.strikerKickFollowthroughClean;
    const goalPoint = this.getGoalPoint(zone);
    const target = this.getBallEndPoint(goalPoint, evaluation.result);

    playSound(this, soundKeys.kick);
    this.strikerSprite?.setTexture(strikerKickKey).setScale(0.17).setOrigin(0.5, 1);
    this.tweens.add({
      targets: this.strikerSprite,
      x: width * 0.355,
      y: height * 0.735,
      duration: 180,
      yoyo: true,
      ease: "Quad.easeOut",
    });

    this.moveKeeper(zone, evaluation.result);
    this.tweens.add({
      targets: this.ballSprite,
      x: target.x,
      y: target.y,
      scale: evaluation.result === "miss" ? 0.35 : 0.28,
      duration: 640,
      ease: "Cubic.easeOut",
      onComplete: () => this.playShotReaction(evaluation.result),
    });

    this.time.delayedCall(1050, () => {
      this.scene.start("ResultScene", {
        teamId: this.team.id,
        teamName: this.team.name,
        zoneName: zone.name,
        finalWpm: stats.currentWpm,
        finalAccuracy: stats.accuracy,
        session: this.session,
        evaluation,
      });
    });
  }

  private getGoalPoint(zone: ShotZone) {
    const { width, height } = this.scale;
    const goalBox = {
      x: width * 0.327,
      y: height * 0.306,
      width: width * 0.346,
      height: height * 0.206,
    };

    return {
      x: goalBox.x + goalBox.width * (zone.x / 100),
      y: goalBox.y + goalBox.height * (zone.y / 100),
    };
  }

  private getBallEndPoint(goalPoint: { x: number; y: number }, result: ShotEvaluation["result"]) {
    if (result !== "miss") return goalPoint;

    const { width } = this.scale;
    const missDirection = goalPoint.x < width / 2 ? -1 : 1;
    return {
      x: goalPoint.x + missDirection * 90,
      y: goalPoint.y - 42,
    };
  }

  private moveKeeper(zone: ShotZone, result: ShotEvaluation["result"]) {
    if (!this.keeperSprite) return;

    const diveLeft = zone.x < 50;
    const texture =
      result === "save"
        ? imageKeys.goalkeeperCatchCenterClean
        : diveLeft
          ? imageKeys.goalkeeperDiveLeftClean
          : imageKeys.goalkeeperDiveRightClean;
    const xOffset = result === "save" ? 0 : diveLeft ? -74 : 74;
    const yOffset = result === "save" ? 12 : 20;

    this.keeperSprite.setTexture(texture).setScale(0.145).setOrigin(0.5, 1);
    this.tweens.add({
      targets: this.keeperSprite,
      x: this.keeperSprite.x + xOffset,
      y: this.keeperSprite.y + yOffset,
      duration: 520,
      ease: "Quad.easeOut",
    });
  }

  private playShotReaction(result: ShotEvaluation["result"]) {
    if (result === "goal") {
      playGoalReaction(this);
      return;
    }

    if (result === "save") {
      playSaveReaction(this);
      return;
    }

    playMissReaction(this);
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

  private ensureMobileInput() {
    if (this.mobileInput || typeof document === "undefined") return;

    const input = document.createElement("textarea");
    input.setAttribute("inputmode", "text");
    input.setAttribute("autocomplete", "off");
    input.setAttribute("autocorrect", "off");
    input.setAttribute("autocapitalize", "off");
    input.setAttribute("spellcheck", "false");
    input.setAttribute("aria-label", "Typing challenge input");
    input.style.position = "fixed";
    input.style.left = "0";
    input.style.top = "0";
    input.style.width = "1px";
    input.style.height = "1px";
    input.style.opacity = "0.01";
    input.style.border = "0";
    input.style.padding = "0";
    input.style.resize = "none";
    input.style.zIndex = "1";
    input.style.caretColor = "transparent";
    input.addEventListener("input", this.handleMobileInput);
    document.body.appendChild(input);
    this.mobileInput = input;

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.removeMobileInput());
  }

  private focusMobileInput() {
    if (!this.mobileInput || !this.isTouchDevice()) return;

    this.mobileInput.focus({ preventScroll: true });
  }

  private removeMobileInput() {
    if (!this.mobileInput) return;

    this.mobileInput.removeEventListener("input", this.handleMobileInput);
    this.mobileInput.remove();
    this.mobileInput = undefined;
  }

  private isTouchDevice() {
    return this.sys.game.device.input.touch;
  }
}
