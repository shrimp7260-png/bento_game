"use strict";

const iconMap = {
  "ごはん": "🍚",
  "からあげ": "🍗",
  "卵焼き": "🍳",
  "ブロッコリー": "🥦",
  "鮭": "🐟",
  "ハンバーグ": "🍔",
  "ポテト": "🍟",
  "トマト": "🍅"
};

const orders = [
  { name: "からあげ弁当", items: ["ごはん", "からあげ", "卵焼き", "ブロッコリー"] },
  { name: "鮭弁当", items: ["ごはん", "鮭", "卵焼き", "トマト"] },
  { name: "ハンバーグ弁当", items: ["ごはん", "ハンバーグ", "ポテト", "ブロッコリー"] },
  { name: "キッズ弁当", items: ["ごはん", "からあげ", "ポテト", "トマト"] },
  { name: "野菜多め弁当", items: ["ごはん", "鮭", "ブロッコリー", "トマト"] }
];

const startScreen = document.querySelector("#startScreen");
const gameScreen = document.querySelector("#gameScreen");
const resultScreen = document.querySelector("#resultScreen");
const scoreText = document.querySelector("#scoreText");
const comboText = document.querySelector("#comboText");
const missText = document.querySelector("#missText");
const timerLabel = document.querySelector("#timerLabel");
const timeText = document.querySelector("#timeText");
const modeText = document.querySelector("#modeText");
const orderName = document.querySelector("#orderName");
const orderList = document.querySelector("#orderList");
const bentoSlots = document.querySelector("#bentoSlots");
const feedbackText = document.querySelector("#feedbackText");
const resultModeText = document.querySelector("#resultModeText");
const resultTitle = document.querySelector("#resultTitle");
const resultScoreLabel = document.querySelector("#resultScoreLabel");
const resultScore = document.querySelector("#resultScore");
const resultMaxCombo = document.querySelector("#resultMaxCombo");
const resultMiss = document.querySelector("#resultMiss");
const retryButton = document.querySelector("#retryButton");
const backToStartButton = document.querySelector("#backToStartButton");

const game = {
  mode: "time",
  score: 0,
  combo: 0,
  maxCombo: 0,
  misses: 0,
  timeLeft: 60,
  currentOrder: null,
  selectedItems: [],
  lastOrderName: "",
  timerId: 0,
  feedbackTimerId: 0,
  isPlaying: false
};

function setAppHeight() {
  const height = window.visualViewport ? window.visualViewport.height : window.innerHeight;
  document.documentElement.style.setProperty("--app-height", `${height}px`);
}

function showScreen(screen) {
  startScreen.classList.toggle("is-hidden", screen !== "start");
  gameScreen.classList.toggle("is-hidden", screen !== "game");
  resultScreen.classList.toggle("is-hidden", screen !== "result");
}

function startGame(mode) {
  clearInterval(game.timerId);
  clearTimeout(game.feedbackTimerId);
  game.mode = mode;
  game.score = 0;
  game.combo = 0;
  game.maxCombo = 0;
  game.misses = 0;
  game.timeLeft = 60;
  game.lastOrderName = "";
  game.isPlaying = true;
  modeText.textContent = mode === "time" ? "タイムアタック 60秒" : "エンドレス ミスするまで";
  timerLabel.textContent = mode === "time" ? "時間" : "成功";
  showScreen("game");
  showFeedback("");
  pickNextOrder();
  updateHud();
  if (mode === "time") {
    game.timerId = setInterval(tickTimer, 1000);
  }
}

function tickTimer() {
  game.timeLeft -= 1;
  updateHud();
  if (game.timeLeft <= 0) {
    finishGame();
  }
}

function pickNextOrder() {
  const candidates = orders.filter((order) => order.name !== game.lastOrderName);
  const nextOrder = candidates[Math.floor(Math.random() * candidates.length)];
  game.currentOrder = nextOrder;
  game.lastOrderName = nextOrder.name;
  game.selectedItems = [];
  orderName.textContent = nextOrder.name;
  renderOrder();
  renderBento();
}

function renderOrder() {
  orderList.innerHTML = "";
  game.currentOrder.items.forEach((item) => {
    const chip = document.createElement("div");
    chip.className = "order-chip";
    chip.textContent = iconMap[item];
    chip.title = item;
    orderList.appendChild(chip);
  });
}

function renderBento() {
  bentoSlots.innerHTML = "";
  for (let index = 0; index < 4; index += 1) {
    const slot = document.createElement("div");
    slot.className = "slot";
    slot.textContent = game.selectedItems[index] ? iconMap[game.selectedItems[index]] : "";
    bentoSlots.appendChild(slot);
  }
}

function chooseFood(food) {
  if (!game.isPlaying || game.selectedItems.length >= 4) {
    return;
  }
  game.selectedItems.push(food);
  renderBento();
  if (game.selectedItems.length === 4) {
    judgeBento();
  }
}

function judgeBento() {
  const correct = [...game.currentOrder.items].sort().join(",");
  const selected = [...game.selectedItems].sort().join(",");
  if (correct === selected) {
    game.score += 1;
    game.combo += 1;
    game.maxCombo = Math.max(game.maxCombo, game.combo);
    showFeedback("完成 +1");
    pickNextOrder();
  } else {
    game.misses += 1;
    game.combo = 0;
    showFeedback("中身が違います", true);
    if (game.mode === "endless") {
      finishGame();
      return;
    }
    window.setTimeout(pickNextOrder, 280);
  }
  updateHud();
}

function showFeedback(message, isWrong = false) {
  clearTimeout(game.feedbackTimerId);
  feedbackText.textContent = message;
  feedbackText.classList.toggle("is-wrong", isWrong);
  feedbackText.classList.toggle("is-visible", message.length > 0);
  if (message.length > 0) {
    game.feedbackTimerId = window.setTimeout(() => feedbackText.classList.remove("is-visible"), 850);
  }
}

function updateHud() {
  scoreText.textContent = game.score;
  comboText.textContent = game.combo;
  missText.textContent = game.misses;
  timeText.textContent = game.mode === "time" ? Math.max(0, game.timeLeft) : game.score;
}

function finishGame() {
  clearInterval(game.timerId);
  game.isPlaying = false;
  resultModeText.textContent = game.mode === "time" ? "タイムアタック結果" : "エンドレス結果";
  resultTitle.textContent = game.mode === "time" ? "時間切れ" : "つめ終わり";
  resultScoreLabel.textContent = game.mode === "time" ? "スコア" : "完成数";
  resultScore.textContent = game.score;
  resultMaxCombo.textContent = game.maxCombo;
  resultMiss.textContent = game.misses;
  showScreen("result");
}

document.querySelectorAll("[data-start-mode]").forEach((button) => {
  button.addEventListener("click", () => startGame(button.dataset.startMode));
});

document.querySelectorAll("[data-food]").forEach((button) => {
  button.addEventListener("click", () => chooseFood(button.dataset.food));
});

retryButton.addEventListener("click", () => startGame(game.mode));
backToStartButton.addEventListener("click", () => {
  clearInterval(game.timerId);
  game.isPlaying = false;
  showScreen("start");
});

window.addEventListener("resize", setAppHeight);
window.addEventListener("orientationchange", setAppHeight);
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", setAppHeight);
}
setAppHeight();
