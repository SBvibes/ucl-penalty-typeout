import Phaser from "phaser";

const AUDIO_MUTED_KEY = "final-shot-audio-muted";

export function applySavedAudioPreference(scene: Phaser.Scene) {
  scene.sound.mute = readMutedPreference();
}

export function createAudioToggle(scene: Phaser.Scene, x: number, y: number) {
  applySavedAudioPreference(scene);

  const label = scene.add
    .text(x, y, getAudioLabel(scene), {
      color: "#f8f4d8",
      fontFamily: "monospace",
      fontSize: "18px",
      fontStyle: "bold",
      backgroundColor: "#061022",
      padding: { x: 10, y: 6 },
    })
    .setOrigin(1, 0.5)
    .setDepth(50)
    .setInteractive({ useHandCursor: true });

  label.on("pointerdown", () => {
    scene.sound.mute = !scene.sound.mute;
    writeMutedPreference(scene.sound.mute);
    label.setText(getAudioLabel(scene));
  });

  return label;
}

function getAudioLabel(scene: Phaser.Scene) {
  return scene.sound.mute ? "SOUND OFF" : "SOUND ON";
}

function readMutedPreference() {
  if (typeof localStorage === "undefined") return false;

  return localStorage.getItem(AUDIO_MUTED_KEY) === "true";
}

function writeMutedPreference(muted: boolean) {
  if (typeof localStorage === "undefined") return;

  localStorage.setItem(AUDIO_MUTED_KEY, String(muted));
}
