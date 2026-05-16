import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { PreloadScene } from "./scenes/PreloadScene";
import { MenuScene } from "./scenes/MenuScene";
import { GameScene } from "./scenes/GameScene";
import { ResultScene } from "./scenes/ResultScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "phaser-root",
  width: 1280,
  height: 720,
  backgroundColor: "#061022",
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, PreloadScene, MenuScene, GameScene, ResultScene],
};

new Phaser.Game(config);
