export const imageKeys = {
  stadium: "stadium",
  ball: "ball",
  keeperIdle: "keeper-idle",
  psgIdle: "psg-idle",
  bayernIdle: "bayern-idle",
} as const;

export const imagePaths: Record<(typeof imageKeys)[keyof typeof imageKeys], string> = {
  [imageKeys.stadium]: "assets/penalty-background-v1.png",
  [imageKeys.ball]: "assets/sprites/ball.png",
  [imageKeys.keeperIdle]: "assets/sprites/keeper_idle.png",
  [imageKeys.psgIdle]: "assets/sprites/psg_idle.png",
  [imageKeys.bayernIdle]: "assets/sprites/bayern_idle.png",
};

export const soundKeys = {
  select: "select",
  whistle: "whistle",
  kick: "kick",
  ballImpact: "ball-impact",
  net: "net",
  save: "save",
  miss: "miss",
  crowdCheer: "crowd-cheer",
  crowdGroan: "crowd-groan",
  celebrationStinger: "celebration-stinger",
  stadiumAmbience: "stadium-ambience",
} as const;

export type SoundKey = (typeof soundKeys)[keyof typeof soundKeys];

export const soundPaths: Record<SoundKey, string> = {
  [soundKeys.select]: "assets/audio/select.wav",
  [soundKeys.whistle]: "assets/audio/whistle.wav",
  [soundKeys.kick]: "assets/audio/kick.wav",
  [soundKeys.ballImpact]: "assets/audio/ball-impact.wav",
  [soundKeys.net]: "assets/audio/net.wav",
  [soundKeys.save]: "assets/audio/save.wav",
  [soundKeys.miss]: "assets/audio/miss.wav",
  [soundKeys.crowdCheer]: "assets/audio/crowd-cheer.wav",
  [soundKeys.crowdGroan]: "assets/audio/crowd-groan.wav",
  [soundKeys.celebrationStinger]: "assets/audio/celebration-stinger.wav",
  [soundKeys.stadiumAmbience]: "assets/audio/stadium-ambience.wav",
};
