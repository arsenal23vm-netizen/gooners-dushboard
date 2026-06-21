const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// ボール
let ballX = canvas.width / 2;
let ballY = 220;
let ballSpeedX = 3;
let ballSpeedY = -3;
const ballRadius = 8;

// バー
const paddleWidth = 80;
const bonusPaddleWidth = 120;
const paddleHeight = 10;
const paddleY = 290;
let paddleX = (canvas.width - paddleWidth) / 2;
let paddleSpeed = 0;
const paddleMaxSpeed = 7;
const paddleAcceleration = 0.7;
const paddleFriction = 0.85;
const bonusDuration = 10000;
const bonusBlockInterval = 5;
let destroyedBlockCount = 0;
let bonusEndTime = 0;

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
let gameStartTime = performance.now();
let pausedStartTime = 0;
let totalPausedTime = 0;
const rankingStorageKey = "blockBreakRankings";

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
    { x: 105, y: 180, width: 55, height: 14, shape: "rect" },
    { x: 218, y: 205, width: 34, height: 34, shape: "circle" },
    { x: 335, y: 172, width: 48, height: 34, shape: "triangle" }
  ];
}

function resetBall() {
  ballX = canvas.width / 2;
  ballY = 220;
  ballSpeedX = 3;
  ballSpeedY = -3;
}

function resetPaddle() {
  paddleX = (canvas.width - getPaddleWidth()) / 2;
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

  if (paddleX + currentPaddleWidth > canvas.width) {
    paddleX = canvas.width - currentPaddleWidth;
    paddleSpeed = 0;
  }
}

function updateBall() {
  ballX += ballSpeedX;
  ballY += ballSpeedY;

  if (ballX < ballRadius || ballX > canvas.width - ballRadius) {
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
  ballSpeedX = hitPosition * 4;
  ballSpeedY *= -1;
  ballY = paddleY - ballRadius;
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
    ballSpeedX += clamp(distanceX / object.width, -1, 1) * 1.4;
    ballSpeedY += clamp(distanceY / object.height, -1, 1) * 0.8;
  }

  ballSpeedX = clamp(ballSpeedX, -6, 6);
  ballSpeedY = clamp(ballSpeedY, -6, 6);

  if (Math.abs(ballSpeedY) < 2) {
    ballSpeedY = ballSpeedY < 0 ? -2 : 2;
  }
}

function checkBlockCollision() {
  for (let block of blocks) {
    const isTouchingBlock = block.alive && isTouchingObject(block);

    if (isTouchingBlock) {
      block.alive = false;
      bounceFromObject(block);
      score += 10;
      destroyedBlockCount += 1;

      if (destroyedBlockCount % bonusBlockInterval === 0) {
        startBonusTime();
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

  if (ballY > canvas.height) {
    addRanking(score, getElapsedSeconds());
    resetGame();
    isGameStarted = false;
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
  ctx.fillText("Time: " + formatTime(getElapsedSeconds()), 165, 20);
  ctx.fillText("High Score: " + highScore, 350, 20);

  if (isBonusActive()) {
    ctx.fillStyle = "gold";
    ctx.fillText("Bonus: " + getBonusSecondsLeft(), 10, 40);
  }
}

function drawPauseText() {
  if (!isPaused) {
    return;
  }

  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";
  ctx.font = "28px Arial";
  ctx.textAlign = "center";
  ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2 - 10);

  ctx.font = "14px Arial";
  ctx.fillText("Press Space or P to resume", canvas.width / 2, canvas.height / 2 + 20);
  ctx.textAlign = "left";
}

function drawStartScreen() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.font = "32px Arial";
  ctx.fillText("BLOCK BREAK", canvas.width / 2, 55);

  ctx.font = "16px Arial";
  ctx.fillText("Press Enter, Space, or Click to Start", canvas.width / 2, 90);

  ctx.font = "20px Arial";
  ctx.fillText("Ranking", canvas.width / 2, 135);

  ctx.font = "16px Arial";

  if (rankings.length === 0) {
    ctx.fillText("No scores yet", canvas.width / 2, 175);
  } else {
    rankings.forEach(function(ranking, index) {
      const rankText =
        index + 1 + ". Score: " + ranking.score + "  Time: " + formatTime(ranking.time);
      ctx.fillText(rankText, canvas.width / 2, 170 + index * 24);
    });
  }

  ctx.font = "13px Arial";
  ctx.fillText("Arrow keys: Move   Space/P: Pause", canvas.width / 2, 300);
  ctx.textAlign = "left";
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

function draw() {
  if (!isGameStarted) {
    drawStartScreen();
    requestAnimationFrame(draw);
    return;
  }

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawText();
  drawBall();
  drawPaddle();
  drawObstacles();
  drawBlocks();

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

  requestAnimationFrame(draw);
}

document.addEventListener("keydown", function(event) {
  if (!isGameStarted && (event.code === "Enter" || event.code === "Space")) {
    startGame();
    return;
  }

  if (!isGameStarted) {
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

canvas.addEventListener("click", function() {
  if (!isGameStarted) {
    startGame();
  }
});

document.addEventListener("keyup", function(event) {
  if (event.key === "ArrowLeft") {
    keys.left = false;
  }

  if (event.key === "ArrowRight") {
    keys.right = false;
  }
});

loadRankings();
makeBlocks();
makeObstacles();
draw();
