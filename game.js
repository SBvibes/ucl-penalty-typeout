const screens = {
  team: document.querySelector("#teamScreen"),
  kick: document.querySelector("#kickScreen"),
  result: document.querySelector("#resultScreen"),
};

const state = {
  team: "",
  shot: 1,
  zone: null,
  timer: null,
  startedAt: 0,
  timeLimit: 0,
  typingActive: false,
  evaluated: false,
  typedText: "",
  selectedTarget: { x: 50, y: 50 },
};

const zoneConfig = {
  "Top Left": {
    x: 13,
    y: 14,
    wpm: 100,
    accuracy: 96,
    chance: 1,
    sentence: "The fearless striker thundered the ball beyond the keeper into the impossible upper corner.",
    note: "Perfect corner: guaranteed goal if you type fast enough.",
  },
  "Top Right": {
    x: 87,
    y: 14,
    wpm: 100,
    accuracy: 96,
    chance: 1,
    sentence: "A ruthless finish curled above every glove and crashed into the brightest corner of the net.",
    note: "Perfect corner: guaranteed goal if you type fast enough.",
  },
  "Top Center": {
    x: 50,
    y: 14,
    wpm: 85,
    accuracy: 94,
    chance: 0.74,
    sentence: "The shot climbed high and dared the keeper to jump through the roar.",
    note: "High and central: quick typing, decent risk.",
  },
  "Mid Left": {
    x: 14,
    y: 49,
    wpm: 70,
    accuracy: 92,
    chance: 0.68,
    sentence: "The ball snapped low across the keeper and raced toward the side net.",
    note: "Wide enough to be dangerous, but the keeper can reach it.",
  },
  "Mid Right": {
    x: 86,
    y: 49,
    wpm: 70,
    accuracy: 92,
    chance: 0.68,
    sentence: "The striker opened his foot and pushed the shot hard toward the far post.",
    note: "Wide enough to be dangerous, but the keeper can reach it.",
  },
  "Mid Center": {
    x: 50,
    y: 50,
    wpm: 50,
    accuracy: 88,
    chance: 0.42,
    sentence: "The shot went straight down the middle.",
    note: "Easy typing, risky placement.",
  },
  "Low Left": {
    x: 14,
    y: 82,
    wpm: 55,
    accuracy: 90,
    chance: 0.62,
    sentence: "A skidding finish hugged the turf and chased the bottom corner.",
    note: "Manageable pace with a respectable chance.",
  },
  "Low Right": {
    x: 86,
    y: 82,
    wpm: 55,
    accuracy: 90,
    chance: 0.62,
    sentence: "The ball skipped along the grass and bent toward the bottom corner.",
    note: "Manageable pace with a respectable chance.",
  },
  "Low Center": {
    x: 50,
    y: 82,
    wpm: 40,
    accuracy: 85,
    chance: 0.34,
    sentence: "The keeper waited as the ball rolled forward.",
    note: "Very easy typing, but the keeper loves this shot.",
  },
};

const selectedTeam = document.querySelector("#selectedTeam");
const roundLabel = document.querySelector("#roundLabel");
const requiredWpm = document.querySelector("#requiredWpm");
const requiredAccuracy = document.querySelector("#requiredAccuracy");
const scoreChance = document.querySelector("#scoreChance");
const timeLeft = document.querySelector("#timeLeft");
const liveWpm = document.querySelector("#liveWpm");
const liveAccuracy = document.querySelector("#liveAccuracy");
const promptText = document.querySelector("#promptText");
const typingTarget = document.querySelector("#typingTarget");
const typingOverlay = document.querySelector("#typingOverlay");
const timeMeter = document.querySelector("#timeMeter span");
const zonePreview = document.querySelector("#zonePreview");
const resultScene = document.querySelector("#resultScene");
const resultTitle = document.querySelector("#resultTitle");
const resultDetail = document.querySelector("#resultDetail");
const resultKicker = document.querySelector("#resultKicker");
const nextShotButton = document.querySelector("#nextShotButton");
const cabinet = document.querySelector(".arcade-cabinet");
const kickScreen = document.querySelector("#kickScreen");
const pitchScene = document.querySelector(".pitch-scene");
const ball = document.querySelector(".ball");
const keeper = document.querySelector(".keeper");
const player = document.querySelector(".player");
const shotMarker = document.querySelector("#shotMarker");

const soundPaths = {
  kick: "assets/audio/kick.wav",
  net: "assets/audio/net.wav",
  crowd: "assets/audio/crowd-cheer.wav",
  miss: "assets/audio/miss.wav",
  save: "assets/audio/save.wav",
  select: "assets/audio/select.wav",
};

const sounds = Object.fromEntries(
  Object.entries(soundPaths).map(([name, src]) => {
    const audio = new Audio(src);
    audio.preload = "auto";
    return [name, audio];
  }),
);

function playSound(name) {
  const source = sounds[name];
  if (!source) return;

  const audio = source.cloneNode();
  audio.volume = name === "crowd" ? 0.55 : 0.75;
  audio.play().catch(() => {});
}

function showScreen(name) {
  Object.values(screens).forEach((screen) => screen.classList.remove("active"));
  screens[name].classList.add("active");
}

function resetAimVisuals() {
  kickScreen.classList.remove("is-typing", "is-kicking", "shot-goal", "shot-miss", "shot-save");
  ball.style.removeProperty("--ball-x");
  ball.style.removeProperty("--ball-y");
  ball.style.removeProperty("--miss-x");
  ball.style.removeProperty("--miss-y");
  ball.classList.remove("hide");
  keeper.style.removeProperty("--keeper-dive-x");
  player.style.removeProperty("--kick-frame");
  shotMarker.classList.remove("active");
  typingOverlay.classList.remove("active");
  typingOverlay.setAttribute("aria-hidden", "true");
  promptText.innerHTML = "";
  state.typedText = "";
}

function startKickScreen() {
  selectedTeam.textContent = state.team;
  roundLabel.textContent = `Shot ${state.shot}`;
  zonePreview.textContent = "Corners are automatic goals if you beat the typing challenge.";
  resetAimVisuals();
  showScreen("kick");
}

function showTypingOverlay(zoneName) {
  const config = zoneConfig[zoneName];
  state.zone = { name: zoneName, ...config };
  state.typingActive = false;
  state.evaluated = false;
  state.typedText = "";
  state.startedAt = 0;
  state.timeLimit = Math.max(5.5, (config.sentence.split(" ").length / config.wpm) * 60);
  state.selectedTarget = { x: config.x, y: config.y };

  shotMarker.style.left = `${config.x}%`;
  shotMarker.style.top = `${config.y}%`;
  shotMarker.dataset.zone = zoneName.toLowerCase().replaceAll(" ", "-");
  shotMarker.classList.add("active");
  typingTarget.textContent = zoneName;
  requiredWpm.textContent = `${config.wpm}`;
  requiredAccuracy.textContent = `${config.accuracy}%`;
  scoreChance.textContent = `${Math.round(config.chance * 100)}%`;
  timeLeft.textContent = `${state.timeLimit.toFixed(1)}s`;
  timeMeter.style.width = "100%";
  liveWpm.textContent = "0";
  liveAccuracy.textContent = "100%";
  renderPrompt();

  kickScreen.classList.add("is-typing");
  typingOverlay.classList.add("active");
  typingOverlay.setAttribute("aria-hidden", "false");
}

function startTypingTimer() {
  state.typingActive = true;
  state.startedAt = Date.now();
  window.clearInterval(state.timer);
  state.timer = window.setInterval(updateTypingClock, 100);
}

function getTypingStats() {
  const typed = state.typedText;
  const elapsed = state.startedAt ? (Date.now() - state.startedAt) / 1000 : 0;
  const elapsedForWpm = Math.max(elapsed, 0.1);
  const wordsTyped = typed.trim() ? typed.trim().split(/\s+/).length : 0;
  const currentWpm = state.typingActive ? Math.round((wordsTyped / elapsedForWpm) * 60) : 0;
  let matchingChars = 0;

  for (let index = 0; index < typed.length; index += 1) {
    if (typed[index] === state.zone.sentence[index]) matchingChars += 1;
  }

  const accuracy = typed.length ? Math.round((matchingChars / typed.length) * 100) : 100;
  const remaining = state.typingActive ? Math.max(0, state.timeLimit - elapsed) : state.timeLimit;

  return { typed, currentWpm, accuracy, remaining };
}

function updateTypingClock() {
  if (!state.zone || state.evaluated) return;

  const { typed, currentWpm, accuracy, remaining } = getTypingStats();
  timeLeft.textContent = `${remaining.toFixed(1)}s`;
  timeMeter.style.width = `${Math.max(0, (remaining / state.timeLimit) * 100)}%`;
  liveWpm.textContent = `${currentWpm}`;
  liveAccuracy.textContent = `${accuracy}%`;

  if (typed === state.zone.sentence) {
    evaluateShot(currentWpm, accuracy, true);
  } else if (state.typingActive && remaining <= 0) {
    evaluateShot(currentWpm, accuracy, false);
  }
}

function evaluateShot(finalWpm, finalAccuracy, completedText) {
  state.evaluated = true;
  window.clearInterval(state.timer);

  const passedTyping =
    completedText && finalWpm >= state.zone.wpm && finalAccuracy >= state.zone.accuracy;
  let result = "miss";
  let title = "Miss!";
  let detail = `You needed ${state.zone.wpm} WPM and ${state.zone.accuracy}% accuracy for ${state.zone.name}. You finished at ${finalWpm} WPM and ${finalAccuracy}% accuracy.`;

  if (passedTyping) {
    const scored = Math.random() <= state.zone.chance;
    result = scored ? "goal" : "save";
    title = scored ? "Goal!" : "Saved!";
    detail = scored
      ? `${state.team} buries it ${state.zone.name}. ${state.zone.note}`
      : `Clean typing, but the keeper guessed it. This placement had a ${Math.round(state.zone.chance * 100)}% scoring chance.`;
  }

  window.setTimeout(() => playKickAnimation(result, title, detail), 260);
}

function playKickAnimation(result, title, detail) {
  const target = getBallTarget(result);

  playSound("kick");
  typingOverlay.classList.remove("active");
  typingOverlay.setAttribute("aria-hidden", "true");
  kickScreen.classList.remove("is-typing");
  kickScreen.classList.add("is-kicking", `shot-${result}`);
  ball.style.setProperty("--ball-x", `${target.x}px`);
  ball.style.setProperty("--ball-y", `${target.y}px`);
  keeper.style.setProperty("--keeper-dive-x", `${target.keeperX}px`);
  player.style.setProperty("--kick-frame", state.team === "PSG" ? "url('assets/sprites/psg_follow.png')" : "url('assets/sprites/bayern_follow.png')");

  window.setTimeout(() => {
    if (result === "goal") {
      playSound("net");
      playSound("crowd");
    } else {
      playSound(result);
    }
    showResult(result, title, detail);
  }, 1050);
}

function getBallTarget(result) {
  const sceneRect = pitchScene.getBoundingClientRect();
  const ballRect = ball.getBoundingClientRect();
  const markerRect = shotMarker.getBoundingClientRect();
  const startX = ballRect.left + ballRect.width / 2;
  const startY = ballRect.top + ballRect.height / 2;
  let endX = markerRect.left + markerRect.width / 2;
  let endY = markerRect.top + markerRect.height / 2;

  if (result === "miss") {
    endX += state.selectedTarget.x > 50 ? 72 : -72;
    endY -= 58;
  }

  if (result === "save") {
    endX = sceneRect.left + sceneRect.width / 2;
    endY = markerRect.top + markerRect.height / 2;
  }

  return {
    x: Math.round(endX - startX),
    y: Math.round(endY - startY),
    keeperX: state.selectedTarget.x > 60 ? 58 : state.selectedTarget.x < 40 ? -58 : 0,
  };
}

function showResult(result, title, detail) {
  shotMarker.classList.remove("active");
  resultScene.className = `result-scene ${result}`;
  resultScene.dataset.team = state.team === "PSG" ? "psg" : "bayern";
  resultKicker.textContent = `${state.team} - ${state.zone.name}`;
  resultTitle.textContent = title;
  resultDetail.textContent = detail;
  nextShotButton.textContent = state.shot >= 5 ? "Restart Shootout" : "Shoot Again";
  showScreen("result");
}

document.querySelectorAll(".team-card").forEach((button) => {
  button.addEventListener("click", () => {
    playSound("select");
    state.team = button.dataset.team;
    cabinet.dataset.team = state.team === "PSG" ? "psg" : "bayern";
    state.shot = 1;
    startKickScreen();
  });
});

document.querySelectorAll(".shot-zone").forEach((button) => {
  button.addEventListener("mouseenter", () => {
    const config = zoneConfig[button.dataset.zone];
    zonePreview.textContent = `${button.dataset.zone}: ${config.wpm} WPM, ${config.accuracy}% accuracy, ${Math.round(config.chance * 100)}% scoring chance.`;
  });

  button.addEventListener("focus", () => {
    const config = zoneConfig[button.dataset.zone];
    zonePreview.textContent = `${button.dataset.zone}: ${config.wpm} WPM, ${config.accuracy}% accuracy, ${Math.round(config.chance * 100)}% scoring chance.`;
  });

  button.addEventListener("click", () => {
    if (!kickScreen.classList.contains("is-kicking")) {
      playSound("select");
      showTypingOverlay(button.dataset.zone);
    }
  });
});

function renderPrompt() {
  if (!state.zone) return;

  promptText.replaceChildren(
    ...Array.from(state.zone.sentence).map((character, index) => {
      const span = document.createElement("span");
      span.textContent = character;
      if (index < state.typedText.length) {
        span.className = state.typedText[index] === character ? "typed-correct" : "typed-wrong";
      } else {
        span.className = "untyped";
      }
      return span;
    }),
  );
}

window.addEventListener("keydown", (event) => {
  if (!kickScreen.classList.contains("is-typing") || state.evaluated) return;

  if (event.key === "Enter") {
    event.preventDefault();
    if (state.typedText === state.zone.sentence) {
      const { currentWpm, accuracy } = getTypingStats();
      evaluateShot(currentWpm, accuracy, true);
    }
    return;
  }

  if (event.key === "Backspace") {
    event.preventDefault();
    state.typedText = state.typedText.slice(0, -1);
    renderPrompt();
    updateTypingClock();
    return;
  }

  if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return;

  event.preventDefault();
  if (!state.typingActive) startTypingTimer();
  if (state.typedText.length >= state.zone.sentence.length) return;

  state.typedText += event.key;
  renderPrompt();
  updateTypingClock();
});

nextShotButton.addEventListener("click", () => {
  if (state.shot >= 5) {
    showScreen("team");
    state.shot = 1;
    state.team = "";
    cabinet.removeAttribute("data-team");
    return;
  }

  state.shot += 1;
  startKickScreen();
});
