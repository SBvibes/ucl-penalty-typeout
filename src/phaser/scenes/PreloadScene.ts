import Phaser from "phaser";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  preload() {
    this.load.image("stadium", "assets/penalty-background-v1.png");
    this.load.image("ball", "assets/sprites/ball.png");
    this.load.image("keeper-idle", "assets/sprites/keeper_idle.png");
    this.load.image("psg-idle", "assets/sprites/psg_idle.png");
    this.load.image("bayern-idle", "assets/sprites/bayern_idle.png");
  }

  create() {
    this.scene.start("MenuScene");
  }
}
