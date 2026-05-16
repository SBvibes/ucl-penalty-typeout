import Phaser from "phaser";
import { imagePaths, soundPaths } from "../game";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  preload() {
    Object.entries(imagePaths).forEach(([key, path]) => {
      this.load.image(key, path);
    });

    Object.entries(soundPaths).forEach(([key, path]) => {
      this.load.audio(key, path);
    });
  }

  create() {
    this.scene.start("MenuScene");
  }
}
