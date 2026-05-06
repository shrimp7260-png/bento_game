"use strict";

const assetMap = {
  "ごはん": "assets/rice.svg",
  "大盛ごはん": "assets/rice-large.svg",
  "からあげ": "assets/karaage.svg",
  "卵焼き": "assets/tamagoyaki.svg",
  "ブロッコリー": "assets/broccoli.svg",
  "鮭": "assets/salmon.svg",
  "ハンバーグ": "assets/hamburg.svg",
  "ポテト": "assets/potato.svg",
  "トマト": "assets/tomato.svg",
  "エビフライ": "assets/ebifry.svg",
  "ウインナー": "assets/sausage.svg",
  "梅干し": "assets/umeboshi.svg"
};

const difficultySettings = {
  easy: {
    label: "かんたん",
    timeLimit: 75,
    scoreMultiplier: 1,
    orders: [
      { name: "からあげ弁当", items: ["ごはん", "からあげ", "卵焼き", "ブロッコリー"] },
      { name: "鮭弁当", items: ["ごはん", "鮭", "卵焼き", "トマト"] },
      { name: "キッズ弁当", items: ["ごはん", "からあげ", "ポテト", "トマト"] }
    ],
    foods: ["ごはん", "からあげ", "卵焼き", "ブロッコリー", "鮭", "ポテト", "トマト"]
  },
  normal: {
    label: "ふつう",
    timeLimit: 60,
    scoreMultiplier: 2,
    orders: [
      { name: "ハンバーグ弁当", items: ["ごはん", "ハンバーグ", "卵焼き", "ポテト", "ブロッコリー"] },
      { name: "鮭から弁当", items: ["ごはん", "鮭", "からあげ", "卵焼き", "トマト"] },
      { name: "エビフライ弁当", items: ["ごはん", "エビフライ", "ポテト", "ブロッコリー", "トマト"] },
      { name: "野菜多め弁当", items: ["ごはん", "鮭", "卵焼き", "ブロッコリー", "トマト"] }
    ],
    foods: ["ごはん", "からあげ", "卵焼き", "ブロッコリー", "鮭", "ハンバーグ", "ポテト", "トマト", "エビフライ"]
  },
  hard: {
    label: "むずかしい",
    timeLimit: 45,
    scoreMultiplier: 3,
    orders: [
      { name: "大盛からあげ弁当", items: ["大盛ごはん", "からあげ", "からあげ", "卵焼き", "ブロッコリー", "梅干し"] },
      { name: "幕の内弁当", items: ["ごはん", "鮭", "からあげ", "卵焼き", "ブロッコリー", "ウインナー"] },
      { name: "特製ミックス弁当", items: ["ごはん", "ハンバーグ", "エビフライ", "ポテト", "トマト", "卵焼き"] },
      { name: "よくばり弁当", items: ["大盛ごはん", "鮭", "からあげ", "エビフライ", "ウインナー", "ブロッコリー"] }
    ],
    foods: ["ごはん", "大盛ごはん", "からあげ", "卵焼き", "ブロッコリー", "鮭", "ハンバーグ", "ポテト", "トマト", "エビフライ", "ウインナー", "梅干し"]
  }
};

const startScreen = document.querySelector("#startScreen");
const gameScreen = document.querySelector("#gameScreen");
const resultScreen = document.querySelector("#resultScreen");
const scoreText = document.querySelector("#scoreText");
const comboText = document.querySelector("#comboText");
const missText = document.querySelector("#missText");
const timerLabel = document.querySelector("#timerLabel");
const timeText = document.querySelector("#timeText");
const modeText = document.querySelector("#modeText");
const difficultyText = document.querySelector("#difficultyText");
const orderName = document.querySelector("#orderName");
const orderList = document.querySelector("#orderList");
const bentoSlots = document.querySelector("#bentoSlots");
const bentoCard = document.querySelector(".bento-card");
const foodGrid = document.querySelector("#foodGrid");
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
  difficulty: "normal",
  score: 0,
  successCount: 0,
  combo: 0,
  maxCombo: 0,
  misses: 0,
  timeLeft: 60,
  currentOrder: null,
  selectedItems: [],
  placements: [],
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

function getSettings() {
  return difficultySettings[game.difficulty];
}

function selectDifficulty(difficulty) {
  game.difficulty = difficulty;
  document.querySelectorAll("[data-difficulty]").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.difficulty === difficulty);
  });
}

function startGame(mode) {
  clearInterval(game.timerId);
  clearTimeout(game.feedbackTimerId);

  const settings = getSettings();
  game.mode = mode;
  game.score = 0;
  game.successCount = 0;
  game.combo = 0;
  game.maxCombo = 0;
  game.misses = 0;
  game.timeLeft = settings.timeLimit;
  game.lastOrderName = "";
  game.isPlaying = true;

  modeText.textContent = mode === "time" ? `タイムアタック ${settings.timeLimit}秒` : "エンドレス ミスするまで";
  difficultyText.textContent = `難易度: ${settings.label} / x${settings.scoreMultiplier}`;
  timerLabel.textContent = mode === "time" ? "時間" : "完成";
  showScreen("game");
  renderFoodButtons();
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
  const settings = getSettings();
  const candidates = settings.orders.filter((order) => order.name !== game.lastOrderName);
  const nextOrder = candidates[Math.floor(Math.random() * candidates.length)];
  game.currentOrder = nextOrder;
  game.lastOrderName = nextOrder.name;
  game.selectedItems = [];
  game.placements = [];
  orderName.textContent = nextOrder.name;
  document.documentElement.style.setProperty("--item-count", nextOrder.items.length);
  renderOrder();
  renderBento();
}

function renderOrder() {
  orderList.innerHTML = "";
  game.currentOrder.items.forEach((item) => {
    const chip = document.createElement("div");
    chip.className = "order-chip";
    chip.innerHTML = `${makeFoodImage(item)}<small>${item}</small>`;
    chip.title = item;
    orderList.appendChild(chip);
  });
}

function renderBento(popIndex = -1) {
  const slotCount = game.currentOrder.items.length;
  bentoSlots.innerHTML = "";
  bentoSlots.className = `bento-slots count-${slotCount}`;

  for (let index = 0; index < slotCount; index += 1) {
    const slot = document.createElement("div");
    slot.className = "slot";
    if (game.selectedItems[index]) {
      const placement = game.placements[index];
      slot.classList.add("is-filled");
      slot.style.setProperty("--food-rotate", `${placement.rotate}deg`);
      slot.style.setProperty("--food-x", `${placement.x}px`);
      slot.style.setProperty("--food-y", `${placement.y}px`);
      slot.innerHTML = makeFoodImage(game.selectedItems[index]);
    }
    if (index === popIndex) {
      slot.classList.add("pop-in");
    }
    bentoSlots.appendChild(slot);
  }
}

function renderFoodButtons() {
  foodGrid.innerHTML = "";
  getSettings().foods.forEach((food) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.food = food;
    button.innerHTML = `${makeFoodImage(food)}<span>${food}</span>`;
    button.addEventListener("click", () => chooseFood(food));
    foodGrid.appendChild(button);
  });
}

function makeFoodImage(food) {
  const riceClass = food === "ごはん" || food === "大盛ごはん" ? " rice-art" : "";
  return `<img class="food-art${riceClass}" src="${assetMap[food]}" alt="" draggable="false">`;
}

function makePlacement(food) {
  const isRice = food === "ごはん" || food === "大盛ごはん";
  return {
    rotate: isRice ? randomBetween(-2, 2) : randomBetween(-9, 9),
    x: randomBetween(-4, 4),
    y: isRice ? randomBetween(0, 3) : randomBetween(-3, 5)
  };
}

function randomBetween(min, max) {
  return Math.round((min + Math.random() * (max - min)) * 10) / 10;
}

function showCompleteEffect() {
  bentoCard.classList.remove("is-complete");
  void bentoCard.offsetWidth;
  bentoCard.classList.add("is-complete");
  window.setTimeout(() => bentoCard.classList.remove("is-complete"), 560);
}

function chooseFood(food) {
  if (!game.isPlaying || game.selectedItems.length >= game.currentOrder.items.length) {
    return;
  }

  game.selectedItems.push(food);
  game.placements.push(makePlacement(food));
  renderBento(game.selectedItems.length - 1);

  if (game.selectedItems.length === game.currentOrder.items.length) {
    judgeBento();
  }
}

function judgeBento() {
  const correct = [...game.currentOrder.items].sort().join(",");
  const selected = [...game.selectedItems].sort().join(",");

  if (correct === selected) {
    game.combo += 1;
    game.successCount += 1;
    game.maxCombo = Math.max(game.maxCombo, game.combo);
    const earned = getSettings().scoreMultiplier + Math.floor(game.combo / 4);
    game.score += earned;
    showFeedback(`おいしそう！ +${earned}`);
    showCompleteEffect();
    window.setTimeout(pickNextOrder, 430);
  } else {
    game.misses += 1;
    game.combo = 0;
    showFeedback("中身が違います", true);
    if (game.mode === "endless") {
      finishGame();
      return;
    }
    window.setTimeout(pickNextOrder, 300);
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
  timeText.textContent = game.mode === "time" ? Math.max(0, game.timeLeft) : game.successCount;
}

function finishGame() {
  clearInterval(game.timerId);
  game.isPlaying = false;
  resultModeText.textContent = game.mode === "time" ? "タイムアタック結果" : "エンドレス結果";
  resultTitle.textContent = game.mode === "time" ? "時間切れ" : "つめ終わり";
  resultScoreLabel.textContent = "スコア";
  resultScore.textContent = game.score;
  resultMaxCombo.textContent = game.maxCombo;
  resultMiss.textContent = game.misses;
  showScreen("result");
}

document.querySelectorAll("[data-difficulty]").forEach((button) => {
  button.addEventListener("click", () => selectDifficulty(button.dataset.difficulty));
});

document.querySelectorAll("[data-start-mode]").forEach((button) => {
  button.addEventListener("click", () => startGame(button.dataset.startMode));
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
