import Phaser from "phaser";
import type { SoundKey } from "./assets";
import { soundKeys } from "./assets";

const volumeBySound: Partial<Record<SoundKey, number>> = {
  [soundKeys.stadiumAmbience]: 0.22,
  [soundKeys.crowdCheer]: 0.55,
  [soundKeys.crowdGroan]: 0.48,
  [soundKeys.celebrationStinger]: 0.42,
};

export function playSound(scene: Phaser.Scene, key: SoundKey, config: Phaser.Types.Sound.SoundConfig = {}) {
  if (!scene.cache.audio.exists(key)) return;

  scene.sound.play(key, {
    volume: volumeBySound[key] ?? 0.72,
    ...config,
  });
}

export function startStadiumAmbience(scene: Phaser.Scene) {
  if (!scene.cache.audio.exists(soundKeys.stadiumAmbience)) return;

  const existing = scene.sound.get(soundKeys.stadiumAmbience);
  if (existing?.isPlaying) return;

  scene.sound.play(soundKeys.stadiumAmbience, {
    loop: true,
    volume: volumeBySound[soundKeys.stadiumAmbience],
  });
}

export function playGoalReaction(scene: Phaser.Scene) {
  playSound(scene, soundKeys.net);
  playSound(scene, soundKeys.crowdCheer);
  playSound(scene, soundKeys.celebrationStinger);
}

export function playMissReaction(scene: Phaser.Scene) {
  playSound(scene, soundKeys.miss);
  playSound(scene, soundKeys.crowdGroan);
}

export function playSaveReaction(scene: Phaser.Scene) {
  playSound(scene, soundKeys.save);
  playSound(scene, soundKeys.crowdGroan);
}
