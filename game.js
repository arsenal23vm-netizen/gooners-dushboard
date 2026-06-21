const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const gameWidth = 480;
const gameHeight = 320;
let devicePixelRatioValue = window.devicePixelRatio || 1;
let viewScale = 1;
let viewOffsetX = 0;
let viewOffsetY = 0;

// ボール
let ballX = gameWidth / 2;
let ballY = 220;
let ballSpeedX = 3;
let ballSpeedY = -3;
const ballRadius = 8;
const initialBallSpeedX = 2;
const initialBallSpeedY = -2;

// バー
const paddleWidth = 80;
const bonusPaddleWidth = 120;
const paddleHeight = 10;
const paddleY = 290;
let paddleX = (gameWidth - paddleWidth) / 2;
let paddleSpeed = 0;
const paddleMaxSpeed = 7;
const paddleAcceleration = 0.7;
const paddleFriction = 0.85;
const bonusDuration = 10000;
const bonusBlockInterval = 5;
let destroyedBlockCount = 0;
let bonusEndTime = 0;
let lives = 3;
let combo = 0;
let messageText = "";
let messageEndTime = 0;
let particles = [];

// キー入力
const keys = {
  left: false,
  right: false
};

// スコア
let score = 0;
let highScore = 0;
let rankings = [];
let isGameStarted = false;
let isPaused = false;
let gameScreen = "title";
let finalScore = 0;
let finalTime = 0;
let gameStartTime = performance.now();
let pausedStartTime = 0;
let totalPausedTime = 0;
const rankingStorageKey = "blockBreakRankings";
const resultButtons = {
  retry: { x: 92, y: 205, width: 130, height: 30, label: "PLAY AGAIN" },
  title: { x: 258, y: 205, width: 130, height: 30, label: "TITLE" },
  x: { x: 95, y: 252, width: 82, height: 26, label: "X" },
  facebook: { x: 199, y: 252, width: 82, height: 26, label: "Facebook" },
  line: { x: 303, y: 252, width: 82, height: 26, label: "LINE" }
};

// ブロック設定
const blockRows = 4;
const blockCols = 5;
const blockWidth = 70;
const blockHeight = 20;
const blockGap = 10;
const blockStartX = 40;
const blockStartY = 50;
const colors = ["red", "orange", "yellow", "lime", "cyan", "violet"];

let blocks = [];
let obstacles = [];

function makeBlocks() {
  blocks = [];
  const shapes = ["rect", "circle", "triangle"];

  for (let row = 0; row < blockRows; row++) {
    for (let col = 0; col < blockCols; col++) {
      blocks.push({
        x: blockStartX + col * (blockWidth + blockGap),
        y: blockStartY + row * (blockHeight + blockGap),
        width: blockWidth,
        height: blockHeight,
        color: colors[(row + col) % colors.length],
        shape: shapes[(row + col) % shapes.length],
        alive: true
      });
    }
  }
}

function makeObstacles() {
  obstacles = [
    { x: 98, y: 132, width: 52, height: 14, shape: "rect" },
    { x: 226, y: 154, width: 30, height: 30, shape: "circle" },
    { x: 340, y: 126, width: 48, height: 34, shape: "triangle" }
  ];
}

function resetBall() {
  ballX = gameWidth / 2;
  ballY = 220;
  ballSpeedX = initialBallSpeedX;
  ballSpeedY = initialBallSpeedY;
}

function resetPaddle() {
  paddleX = (gameWidth - getPaddleWidth()) / 2;
  paddleSpeed = 0;
}

function resetTimer() {
  gameStartTime = performance.now();
  pausedStartTime = 0;
  totalPausedTime = 0;
}

function resetGame() {
  score = 0;
  destroyedBlockCount = 0;
  bonusEndTime = 0;
  lives = 3;
  combo = 0;
  messageText = "";
  messageEndTime = 0;
  particles = [];
  isPaused = false;
  keys.left = false;
  keys.right = false;
  resetTimer();
  makeBlocks();
  makeObstacles();
  resetBall();
  resetPaddle();
}

function startGame() {
  resetGame();
  isGameStarted = true;
  gameScreen = "playing";
}

function endGame() {
  finalScore = score;
  finalTime = getElapsedSeconds();
  addRanking(finalScore, finalTime);
  isGameStarted = false;
  isPaused = false;
  gameScreen = "gameOver";
  keys.left = false;
  keys.right = false;
  paddleSpeed = 0;
}

function showTitleScreen() {
  resetGame();
  isGameStarted = false;
  gameScreen = "title";
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function isBonusActive() {
  return performance.now() < bonusEndTime;
}

function getPaddleWidth() {
  return isBonusActive() ? bonusPaddleWidth : paddleWidth;
}

function startBonusTime() {
  bonusEndTime = performance.now() + bonusDuration;
}

function getBonusSecondsLeft() {
  return Math.ceil(Math.max(0, bonusEndTime - performance.now()) / 1000);
}

function resizeCanvas() {
  const cssWidth = window.innerWidth;
  const cssHeight = window.innerHeight;
  devicePixelRatioValue = window.devicePixelRatio || 1;
  viewScale = Math.min(cssWidth / gameWidth, cssHeight / gameHeight);
  viewOffsetX = (cssWidth - gameWidth * viewScale) / 2;
  viewOffsetY = (cssHeight - gameHeight * viewScale) / 2;

  canvas.width = Math.floor(cssWidth * devicePixelRatioValue);
  canvas.height = Math.floor(cssHeight * devicePixelRatioValue);
  canvas.style.width = cssWidth + "px";
  canvas.style.height = cssHeight + "px";
  ctx.imageSmoothingEnabled = false;
}

function prepareFrame() {
  ctx.setTransform(devicePixelRatioValue, 0, 0, devicePixelRatioValue, 0, 0);
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(
    devicePixelRatioValue * viewScale,
    0,
    0,
    devicePixelRatioValue * viewScale,
    devicePixelRatioValue * viewOffsetX,
    devicePixelRatioValue * viewOffsetY
  );
}

function showMessage(text) {
  messageText = text;
  messageEndTime = performance.now() + 1500;
}

function makeParticles(x, y, color) {
  for (let i = 0; i < 10; i++) {
    particles.push({
      x: x,
      y: y,
      speedX: (Math.random() - 0.5) * 3,
      speedY: (Math.random() - 0.5) * 3,
      size: 2 + Math.random() * 3,
      color: color,
      life: 28
    });
  }
}

function updateParticles() {
  particles = particles.filter(function(particle) {
    particle.x += particle.speedX;
    particle.y += particle.speedY;
    particle.speedY += 0.03;
    particle.life -= 1;
    return particle.life > 0;
  });
}

function updatePaddle() {
  const currentPaddleWidth = getPaddleWidth();

  if (keys.left) {
    paddleSpeed -= paddleAcceleration;
  }

  if (keys.right) {
    paddleSpeed += paddleAcceleration;
  }

  if (!keys.left && !keys.right) {
    paddleSpeed *= paddleFriction;
  }

  paddleSpeed = clamp(paddleSpeed, -paddleMaxSpeed, paddleMaxSpeed);
  paddleX += paddleSpeed;

  if (paddleX < 0) {
    paddleX = 0;
    paddleSpeed = 0;
  }

  if (paddleX + currentPaddleWidth > gameWidth) {
    paddleX = gameWidth - currentPaddleWidth;
    paddleSpeed = 0;
  }
}

function updateBall() {
  ballX += ballSpeedX;
  ballY += ballSpeedY;

  if (ballX < ballRadius || ballX > gameWidth - ballRadius) {
    ballSpeedX *= -1;
  }

  if (ballY < ballRadius) {
    ballSpeedY *= -1;
  }
}

function checkPaddleCollision() {
  const currentPaddleWidth = getPaddleWidth();
  const isTouchingPaddle =
    ballY + ballRadius > paddleY &&
    ballY - ballRadius < paddleY + paddleHeight &&
    ballX > paddleX &&
    ballX < paddleX + currentPaddleWidth &&
    ballSpeedY > 0;

  if (!isTouchingPaddle) {
    return;
  }

  const hitPosition = (ballX - (paddleX + currentPaddleWidth / 2)) / (currentPaddleWidth / 2);
  ballSpeedX = hitPosition * 3;
  ballSpeedY *= -1;
  ballY = paddleY - ballRadius;
  combo = 0;
}

function isTouchingObject(object) {
  if (object.shape === "circle") {
    const centerX = object.x + object.width / 2;
    const centerY = object.y + object.height / 2;
    const radius = Math.min(object.width, object.height) / 2;
    const distanceX = ballX - centerX;
    const distanceY = ballY - centerY;

    return Math.hypot(distanceX, distanceY) < ballRadius + radius;
  }

  return (
    ballX + ballRadius > object.x &&
    ballX - ballRadius < object.x + object.width &&
    ballY + ballRadius > object.y &&
    ballY - ballRadius < object.y + object.height
  );
}

function bounceFromObject(object) {
  const centerX = object.x + object.width / 2;
  const centerY = object.y + object.height / 2;
  const distanceX = ballX - centerX;
  const distanceY = ballY - centerY;

  if (Math.abs(distanceX / object.width) > Math.abs(distanceY / object.height)) {
    ballSpeedX *= -1;
  } else {
    ballSpeedY *= -1;
  }

  if (object.shape === "circle" || object.shape === "triangle") {
    ballSpeedX += clamp(distanceX / object.width, -1, 1) * 0.9;
    ballSpeedY += clamp(distanceY / object.height, -1, 1) * 0.5;
  }

  ballSpeedX = clamp(ballSpeedX, -4.5, 4.5);
  ballSpeedY = clamp(ballSpeedY, -4.5, 4.5);

  if (Math.abs(ballSpeedY) < 1.5) {
    ballSpeedY = ballSpeedY < 0 ? -1.5 : 1.5;
  }
}

function checkBlockCollision() {
  for (let block of blocks) {
    const isTouchingBlock = block.alive && isTouchingObject(block);

    if (isTouchingBlock) {
      block.alive = false;
      bounceFromObject(block);
      destroyedBlockCount += 1;
      combo += 1;
      score += 10 + Math.min(combo - 1, 5) * 2;
      makeParticles(block.x + block.width / 2, block.y + block.height / 2, block.color);

      if (destroyedBlockCount % bonusBlockInterval === 0) {
        startBonusTime();
        showMessage("BONUS TIME!");
      } else if (combo >= 3) {
        showMessage("COMBO x" + combo);
      }

      if (score > highScore) {
        highScore = score;
      }

      break;
    }
  }
}

function checkObstacleCollision() {
  for (let obstacle of obstacles) {
    if (isTouchingObject(obstacle)) {
      bounceFromObject(obstacle);
      break;
    }
  }
}

function checkRoundState() {
  if (blocks.every(block => block.alive === false)) {
    makeBlocks();
    resetBall();
    resetPaddle();
  }

  if (ballY > gameHeight) {
    lives -= 1;
    combo = 0;

    if (lives <= 0) {
      endGame();
      return;
    }

    showMessage("LIVES LEFT: " + lives);
    resetBall();
    resetPaddle();
  }
}

function getElapsedSeconds() {
  const now = isPaused ? pausedStartTime : performance.now();
  return Math.floor((now - gameStartTime - totalPausedTime) / 1000);
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
}

function compareRankings(first, second) {
  if (second.score !== first.score) {
    return second.score - first.score;
  }

  return first.time - second.time;
}

function loadRankings() {
  try {
    const savedRankings = JSON.parse(localStorage.getItem(rankingStorageKey));
    rankings = Array.isArray(savedRankings) ? savedRankings : [];
  } catch (error) {
    rankings = [];
  }

  rankings = rankings
    .filter(ranking => Number.isFinite(ranking.score) && Number.isFinite(ranking.time))
    .sort(compareRankings)
    .slice(0, 5);

  highScore = rankings.length > 0 ? rankings[0].score : 0;
}

function saveRankings() {
  localStorage.setItem(rankingStorageKey, JSON.stringify(rankings));
}

function addRanking(newScore, elapsedSeconds) {
  if (newScore <= 0) {
    return;
  }

  rankings.push({
    score: newScore,
    time: elapsedSeconds
  });

  rankings.sort(compareRankings);
  rankings = rankings.slice(0, 5);
  highScore = rankings[0].score;
  saveRankings();
}

function drawText() {
  ctx.fillStyle = "white";
  ctx.font = "16px Arial";
  ctx.fillText("Score: " + score, 10, 20);
  ctx.fillText("Lives: " + lives, 125, 20);
  ctx.fillText("Time: " + formatTime(getElapsedSeconds()), 215, 20);
  ctx.fillText("High: " + highScore, 360, 20);

  if (isBonusActive()) {
    ctx.fillStyle = "gold";
    ctx.fillText("Bonus: " + getBonusSecondsLeft(), 10, 40);
  }

  if (combo >= 2) {
    ctx.fillStyle = "cyan";
    ctx.fillText("Combo x" + combo, 125, 40);
  }

  if (performance.now() < messageEndTime) {
    ctx.fillStyle = "white";
    ctx.font = "22px Arial";
    ctx.textAlign = "center";
    ctx.fillText(messageText, gameWidth / 2, 252);
    ctx.textAlign = "left";
  }
}

function drawPauseText() {
  if (!isPaused) {
    return;
  }

  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(0, 0, gameWidth, gameHeight);

  ctx.fillStyle = "white";
  ctx.font = "28px Arial";
  ctx.textAlign = "center";
  ctx.fillText("PAUSED", gameWidth / 2, gameHeight / 2 - 10);

  ctx.font = "14px Arial";
  ctx.fillText("Press Space or P to resume", gameWidth / 2, gameHeight / 2 + 20);
  ctx.textAlign = "left";
}

function drawPixelRect(x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
}

function drawStartBackground() {
  drawPixelRect(0, 0, gameWidth, gameHeight, "#0b1538");
  drawPixelRect(0, 54, gameWidth, 54, "#172c62");
  drawPixelRect(0, 108, gameWidth, 64, "#244c7d");
  drawPixelRect(0, 172, gameWidth, 148, "#121724");

  for (let x = 16; x < gameWidth; x += 38) {
    drawPixelRect(x, 22 + (x % 3) * 9, 3, 3, "#f9f0a8");
  }

  drawPixelFuji();
  drawPixelCity();
}

function drawPixelFuji() {
  const rows = [
    { x: 232, y: 92, width: 16, color: "#f7fbff" },
    { x: 216, y: 104, width: 48, color: "#f7fbff" },
    { x: 200, y: 116, width: 80, color: "#dfeeff" },
    { x: 184, y: 128, width: 112, color: "#8fb4d8" },
    { x: 168, y: 140, width: 144, color: "#6992c5" },
    { x: 152, y: 152, width: 176, color: "#476aa7" },
    { x: 136, y: 164, width: 208, color: "#314b82" },
    { x: 120, y: 176, width: 240, color: "#233867" }
  ];

  rows.forEach(function(row) {
    drawPixelRect(row.x, row.y, row.width, 12, row.color);
  });

  drawPixelRect(216, 116, 16, 12, "#ffffff");
  drawPixelRect(248, 116, 16, 12, "#ffffff");
  drawPixelRect(232, 128, 16, 12, "#eef7ff");
}

function drawPixelCity() {
  const buildings = [
    { x: 10, y: 226, width: 34, height: 76, color: "#1d2540" },
    { x: 52, y: 204, width: 44, height: 98, color: "#232b4b" },
    { x: 106, y: 236, width: 32, height: 66, color: "#1a2238" },
    { x: 348, y: 218, width: 38, height: 84, color: "#202846" },
    { x: 396, y: 196, width: 42, height: 106, color: "#263050" },
    { x: 446, y: 232, width: 28, height: 70, color: "#1c243d" }
  ];

  buildings.forEach(function(building) {
    drawPixelRect(building.x, building.y, building.width, building.height, building.color);

    for (let y = building.y + 12; y < building.y + building.height - 8; y += 16) {
      for (let x = building.x + 8; x < building.x + building.width - 6; x += 14) {
        const isLightOn = (x + y) % 3 !== 0;
        drawPixelRect(x, y, 5, 7, isLightOn ? "#ffd866" : "#3a4161");
      }
    }
  });

  drawPixelRect(0, 302, gameWidth, 18, "#070a12");
}

function drawStartScreen() {
  drawStartBackground();

  ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
  ctx.fillRect(70, 28, 340, 260);

  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.font = "32px Arial";
  ctx.fillText("BLOCK BREAK", gameWidth / 2, 55);

  ctx.font = "12px Arial";
  ctx.fillText("made by Malbon", gameWidth / 2, 73);

  ctx.font = "16px Arial";
  ctx.fillText("Press Enter, Space, or Click to Start", gameWidth / 2, 95);

  ctx.font = "20px Arial";
  ctx.fillText("Ranking", gameWidth / 2, 135);

  ctx.font = "16px Arial";

  if (rankings.length === 0) {
    ctx.fillText("No scores yet", gameWidth / 2, 175);
  } else {
    rankings.forEach(function(ranking, index) {
      const rankText =
        index + 1 + ". Score: " + ranking.score + "  Time: " + formatTime(ranking.time);
      ctx.fillText(rankText, gameWidth / 2, 170 + index * 24);
    });
  }

  ctx.font = "13px Arial";
  ctx.fillText("Arrow keys: Move   Space/P: Pause", gameWidth / 2, 300);
  ctx.textAlign = "left";
}

function drawButton(button, fillColor) {
  ctx.fillStyle = fillColor || "#1d2a52";
  ctx.fillRect(button.x, button.y, button.width, button.height);
  ctx.strokeStyle = "white";
  ctx.strokeRect(button.x, button.y, button.width, button.height);
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.font = "13px Arial";
  ctx.fillText(button.label, button.x + button.width / 2, button.y + 19);
  ctx.textAlign = "left";
}

function drawGameOverScreen() {
  drawStartBackground();

  ctx.fillStyle = "rgba(0, 0, 0, 0.62)";
  ctx.fillRect(58, 24, 364, 274);

  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.font = "30px Arial";
  ctx.fillText("GAME OVER", gameWidth / 2, 62);

  ctx.font = "18px Arial";
  ctx.fillText("Score: " + finalScore, gameWidth / 2, 105);
  ctx.fillText("Time: " + formatTime(finalTime), gameWidth / 2, 132);
  ctx.fillText("High Score: " + highScore, gameWidth / 2, 159);

  ctx.font = "13px Arial";
  ctx.fillText("Share your score", gameWidth / 2, 244);

  drawButton(resultButtons.retry, "#244f88");
  drawButton(resultButtons.title, "#333b57");
  drawButton(resultButtons.x, "#111827");
  drawButton(resultButtons.facebook, "#244f88");
  drawButton(resultButtons.line, "#1b8f45");
  ctx.textAlign = "left";
}

function getCanvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left - viewOffsetX) / viewScale,
    y: (event.clientY - rect.top - viewOffsetY) / viewScale
  };
}

function isInsideButton(point, button) {
  return (
    point.x >= button.x &&
    point.x <= button.x + button.width &&
    point.y >= button.y &&
    point.y <= button.y + button.height
  );
}

function getShareText() {
  return "ブロック崩しでスコア" + finalScore + "点でした。あなたもチャレンジしてみてね！";
}

function shareScore(service) {
  const text = encodeURIComponent(getShareText());
  const url = encodeURIComponent(window.location.href);
  let shareUrl = "";

  if (service === "x") {
    shareUrl = "https://twitter.com/intent/tweet?text=" + text + "&url=" + url;
  }

  if (service === "facebook") {
    shareUrl = "https://www.facebook.com/sharer/sharer.php?u=" + url + "&quote=" + text;
  }

  if (service === "line") {
    shareUrl = "https://social-plugins.line.me/lineit/share?url=" + url + "&text=" + text;
  }

  if (shareUrl) {
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  }
}

function handleGameOverClick(point) {
  if (isInsideButton(point, resultButtons.retry)) {
    startGame();
    return;
  }

  if (isInsideButton(point, resultButtons.title)) {
    showTitleScreen();
    return;
  }

  if (isInsideButton(point, resultButtons.x)) {
    shareScore("x");
    return;
  }

  if (isInsideButton(point, resultButtons.facebook)) {
    shareScore("facebook");
    return;
  }

  if (isInsideButton(point, resultButtons.line)) {
    shareScore("line");
  }
}

function drawBall() {
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
  ctx.fill();
}

function drawPaddle() {
  ctx.fillStyle = isBonusActive() ? "gold" : "white";
  ctx.fillRect(paddleX, paddleY, getPaddleWidth(), paddleHeight);
}

function drawShape(object) {
  if (object.shape === "circle") {
    ctx.beginPath();
    ctx.arc(
      object.x + object.width / 2,
      object.y + object.height / 2,
      Math.min(object.width, object.height) / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
    return;
  }

  if (object.shape === "triangle") {
    ctx.beginPath();
    ctx.moveTo(object.x + object.width / 2, object.y);
    ctx.lineTo(object.x + object.width, object.y + object.height);
    ctx.lineTo(object.x, object.y + object.height);
    ctx.closePath();
    ctx.fill();
    return;
  }

  ctx.fillRect(object.x, object.y, object.width, object.height);
}

function drawBlocks() {
  for (let block of blocks) {
    if (block.alive) {
      ctx.fillStyle = block.color;
      drawShape(block);
    }
  }
}

function drawObstacles() {
  for (let obstacle of obstacles) {
    ctx.fillStyle = "gray";
    drawShape(obstacle);
  }
}

function drawParticles() {
  for (let particle of particles) {
    ctx.fillStyle = particle.color;
    ctx.globalAlpha = particle.life / 28;
    ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
  }

  ctx.globalAlpha = 1;
}

function draw() {
  prepareFrame();

  if (gameScreen === "title") {
    drawStartScreen();
    requestAnimationFrame(draw);
    return;
  }

  if (gameScreen === "gameOver") {
    drawGameOverScreen();
    requestAnimationFrame(draw);
    return;
  }

  drawStartBackground();
  ctx.fillStyle = "rgba(0, 0, 0, 0.48)";
  ctx.fillRect(0, 0, gameWidth, gameHeight);

  drawText();
  drawBall();
  drawPaddle();
  drawObstacles();
  drawBlocks();
  drawParticles();

  if (isPaused) {
    drawPauseText();
    requestAnimationFrame(draw);
    return;
  }

  updatePaddle();
  updateBall();
  checkPaddleCollision();
  checkBlockCollision();
  checkObstacleCollision();
  checkRoundState();
  updateParticles();

  requestAnimationFrame(draw);
}

document.addEventListener("keydown", function(event) {
  if (gameScreen === "title" && (event.code === "Enter" || event.code === "Space")) {
    startGame();
    return;
  }

  if (gameScreen === "gameOver") {
    if (event.code === "Enter" || event.code === "Space") {
      startGame();
      return;
    }

    if (event.code === "Escape") {
      showTitleScreen();
      return;
    }
  }

  if (gameScreen !== "playing") {
    return;
  }

  if ((event.code === "Space" || event.key.toLowerCase() === "p") && !event.repeat) {
    if (isPaused) {
      const pausedTime = performance.now() - pausedStartTime;
      totalPausedTime += pausedTime;

      if (bonusEndTime > 0) {
        bonusEndTime += pausedTime;
      }

      isPaused = false;
    } else {
      pausedStartTime = performance.now();
      isPaused = true;
    }

    keys.left = false;
    keys.right = false;
    paddleSpeed = 0;
    return;
  }

  if (event.key === "ArrowLeft") {
    keys.left = true;
  }

  if (event.key === "ArrowRight") {
    keys.right = true;
  }
});

canvas.addEventListener("click", function(event) {
  const point = getCanvasPoint(event);

  if (gameScreen === "title") {
    startGame();
    return;
  }

  if (gameScreen === "gameOver") {
    handleGameOverClick(point);
  }
});

window.addEventListener("resize", function() {
  resizeCanvas();
});

document.addEventListener("keyup", function(event) {
  if (event.key === "ArrowLeft") {
    keys.left = false;
  }

  if (event.key === "ArrowRight") {
    keys.right = false;
  }
});

resizeCanvas();
loadRankings();
makeBlocks();
makeObstacles();
draw();
