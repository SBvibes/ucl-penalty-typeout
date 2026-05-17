import Phaser from "phaser";
import {
  addShootoutShot,
  createShootoutSession,
  getAverageAccuracy,
  getAverageWpm,
  getTeam,
  getShotZone,
  imageKeys,
  isShootoutComplete,
  playGoalReaction,
  playMissReaction,
  playSaveReaction,
  playSound,
  soundKeys,
} from "../game";
import type { ShootoutSession, ShotEvaluation, ShotZoneName, TeamId, TeamName } from "../game";

interface ResultSceneData {
  teamId?: TeamId;
  teamName?: TeamName;
  zoneName?: ShotZoneName;
  finalWpm?: number;
  finalAccuracy?: number;
  session?: ShootoutSession;
  evaluation?: ShotEvaluation;
}

export class ResultScene extends Phaser.Scene {
  private teamId: TeamId = "psg";
  private teamName: TeamName = "PSG";
  private zoneName: ShotZoneName = "Mid Center";
  private finalWpm = 0;
  private finalAccuracy = 100;
  private session!: ShootoutSession;
  private updatedSession!: ShootoutSession;
  private evaluation: ShotEvaluation = {
    result: "miss",
    title: "Miss!",
    detail: "The shot got away. Line it up and try again.",
    passedTyping: false,
  };

  constructor() {
    super("ResultScene");
  }

  init(data: ResultSceneData) {
    const team = getTeam(data.teamId ?? "psg");
    this.teamId = team.id;
    this.teamName = data.teamName ?? team.name;
    this.zoneName = data.zoneName ?? "Mid Center";
    this.finalWpm = data.finalWpm ?? 0;
    this.finalAccuracy = data.finalAccuracy ?? 100;
    this.session = data.session ?? createShootoutSession(team.id);
    this.evaluation = data.evaluation ?? this.evaluation;
    this.updatedSession = addShootoutShot(this.session, {
      result: this.evaluation.result,
      zoneName: this.zoneName,
      wpm: this.finalWpm,
      accuracy: this.finalAccuracy,
    });
  }

  create() {
    const { width, height } = this.scale;
    const isGoal = this.evaluation.result === "goal";
    const complete = isShootoutComplete(this.updatedSession);
    const titleColor = isGoal ? "#fff176" : this.evaluation.result === "save" ? "#55d6ff" : "#ff5266";
    const strikerKey = this.getResultStrikerKey();
    const keeperKey = this.getResultKeeperKey();

    this.add.image(width / 2, height / 2, imageKeys.stadium).setDisplaySize(width, height);
    this.add.rectangle(width / 2, height / 2, width, height, 0x030814, 0.58);
    this.add.rectangle(width / 2, 42, width, 84, 0x030814, 0.78);

    this.add.text(42, 28, this.teamName.toUpperCase(), {
      color: "#55d6ff",
      fontFamily: "monospace",
      fontSize: "28px",
      fontStyle: "bold",
    }).setOrigin(0, 0.5);
    this.add.text(width - 42, 28, complete ? "FINAL" : `SHOT ${this.session.shotNumber}/${this.session.maxShots}`, {
      color: "#ffc83d",
      fontFamily: "monospace",
      fontSize: "28px",
      fontStyle: "bold",
    }).setOrigin(1, 0.5);
    this.createShotPips(width / 2, 58);

    this.add.image(width * 0.39, height * 0.76, strikerKey).setScale(0.17).setOrigin(0.5, 1);
    this.add.image(width * 0.55, height * 0.52, keeperKey).setScale(0.145).setOrigin(0.5, 1);

    this.add.text(width / 2, height * 0.23, this.evaluation.title.toUpperCase(), {
      color: titleColor,
      fontFamily: "monospace",
      fontSize: "56px",
      fontStyle: "bold",
      stroke: "#020714",
      strokeThickness: 8,
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.33, `${this.zoneName.toUpperCase()}  ${this.finalWpm} WPM  ${this.finalAccuracy}% ACC`, {
      color: "#ffc83d",
      fontFamily: "monospace",
      fontSize: "22px",
      fontStyle: "bold",
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.43, this.getRunSummaryText(complete), {
      color: "#55d6ff",
      fontFamily: "monospace",
      fontSize: "24px",
      fontStyle: "bold",
      align: "center",
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.82, this.evaluation.detail, {
      color: "#f8f4d8",
      fontFamily: "monospace",
      fontSize: "20px",
      fontStyle: "bold",
      align: "center",
      wordWrap: { width: width * 0.76 },
    }).setOrigin(0.5);

    const retry = this.add.text(width / 2, height * 0.92, complete ? "CLICK / TAP FOR NEW RUN" : "CLICK / TAP FOR NEXT SHOT", {
      color: "#55d6ff",
      fontFamily: "monospace",
      fontSize: "22px",
      fontStyle: "bold",
    }).setOrigin(0.5);

    this.tweens.add({
      targets: retry,
      alpha: 0.35,
      duration: 650,
      yoyo: true,
      repeat: -1,
    });

    this.playReaction();
    this.playVisualReaction();
    this.input.once("pointerdown", () => {
      playSound(this, soundKeys.select);
      if (complete) {
        this.scene.start("MenuScene");
        return;
      }

      this.scene.start("GameScene", {
        teamId: this.teamId,
        session: this.updatedSession,
      });
    });
  }

  private getRunSummaryText(complete: boolean) {
    const line = `RUN SCORE ${this.updatedSession.goals}/${this.updatedSession.maxShots}`;
    if (!complete) return line;

    return `${line}\nAVG ${getAverageWpm(this.updatedSession)} WPM  ${getAverageAccuracy(this.updatedSession)}% ACC`;
  }

  private createShotPips(x: number, y: number) {
    const gap = 34;
    const startX = x - ((this.updatedSession.maxShots - 1) * gap) / 2;

    for (let index = 0; index < this.updatedSession.maxShots; index += 1) {
      const shot = this.updatedSession.shots[index];
      const color = shot ? this.getShotPipColor(shot.result) : 0x173156;
      const pip = this.add.circle(startX + index * gap, y, shot ? 9 : 7, color, shot ? 1 : 0.55);
      pip.setStrokeStyle(3, 0x07111f, 0.9);

      if (!shot) continue;

      this.add.text(startX + index * gap, y + 1, shot.result === "goal" ? "G" : shot.result === "save" ? "S" : "M", {
        color: "#061022",
        fontFamily: "monospace",
        fontSize: "12px",
        fontStyle: "bold",
      }).setOrigin(0.5);
    }
  }

  private getShotPipColor(result: ShotEvaluation["result"]) {
    if (result === "goal") return 0xfff176;
    if (result === "save") return 0x55d6ff;
    return 0xff5266;
  }

  private playVisualReaction() {
    if (this.evaluation.result === "goal") {
      this.cameras.main.shake(220, 0.006);
      this.flashResult(0xfff176, 0.22);
      this.createCrowdWave();
      this.createConfetti();
      return;
    }

    if (this.evaluation.result === "save") {
      this.cameras.main.shake(140, 0.003);
      this.flashResult(0x55d6ff, 0.16);
      return;
    }

    this.flashResult(0xff5266, 0.15);
  }

  private flashResult(color: number, alpha: number) {
    const { width, height } = this.scale;
    const flash = this.add.rectangle(width / 2, height / 2, width, height, color, alpha).setDepth(20);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 420,
      ease: "Quad.easeOut",
      onComplete: () => flash.destroy(),
    });
  }

  private createCrowdWave() {
    const { width, height } = this.scale;

    for (let index = 0; index < 16; index += 1) {
      const block = this.add.rectangle(index * (width / 15), height * 0.42, width / 18, 34, 0xffc83d, 0.22).setDepth(8);
      this.tweens.add({
        targets: block,
        y: height * 0.37,
        alpha: 0,
        duration: 520,
        delay: index * 35,
        yoyo: true,
        ease: "Sine.easeOut",
        onComplete: () => block.destroy(),
      });
    }
  }

  private createConfetti() {
    const { width, height } = this.scale;
    const colors = [0xfff176, 0x55d6ff, 0xff5266, 0xf8f4d8];

    for (let index = 0; index < 42; index += 1) {
      const x = width * 0.25 + Math.random() * width * 0.5;
      const bit = this.add.rectangle(x, height * 0.18, 8, 8, colors[index % colors.length], 0.95).setDepth(25);
      this.tweens.add({
        targets: bit,
        x: x + (Math.random() - 0.5) * 340,
        y: height * (0.55 + Math.random() * 0.28),
        angle: Math.random() * 360,
        alpha: 0,
        duration: 900 + Math.random() * 450,
        ease: "Quad.easeOut",
        onComplete: () => bit.destroy(),
      });
    }
  }

  private getResultStrikerKey() {
    if (this.evaluation.result === "goal") {
      return this.teamId === "bayern" ? imageKeys.bayernStrikerCelebrateClean : imageKeys.strikerCelebrateClean;
    }

    return this.teamId === "bayern" ? imageKeys.bayernStrikerDespairClean : imageKeys.strikerDespairClean;
  }

  private getResultKeeperKey() {
    if (this.evaluation.result === "save") return imageKeys.goalkeeperCatchCenterClean;

    const zone = getShotZone(this.zoneName);
    if (zone.x < 45) return imageKeys.goalkeeperDiveLeftClean;
    if (zone.x > 55) return imageKeys.goalkeeperDiveRightClean;

    return imageKeys.goalkeeperCatchCenterClean;
  }

  private playReaction() {
    if (this.evaluation.result === "goal") {
      playGoalReaction(this);
      return;
    }

    if (this.evaluation.result === "save") {
      playSaveReaction(this);
      return;
    }

    playMissReaction(this);
  }
}
