import Phaser from "phaser";
import {
  addShootoutShot,
  createShootoutSession,
  getAverageAccuracy,
  getAverageWpm,
  getTeam,
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
    const keeperKey = this.evaluation.result === "save" ? imageKeys.goalkeeperCatchCenterClean : imageKeys.goalkeeperDiveRightClean;

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

  private getResultStrikerKey() {
    if (this.evaluation.result === "goal") {
      return this.teamId === "bayern" ? imageKeys.bayernStrikerCelebrateClean : imageKeys.strikerCelebrateClean;
    }

    return this.teamId === "bayern" ? imageKeys.bayernStrikerDespairClean : imageKeys.strikerDespairClean;
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
