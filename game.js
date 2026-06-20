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
const paddleHeight = 10;
const paddleY = 290;
let paddleX = (canvas.width - paddleWidth) / 2;
let paddleSpeed = 0;
const paddleMaxSpeed = 7;
const paddleAcceleration = 0.7;
const paddleFriction = 0.85;

// キー入力
const keys = {
  left: false,
  right: false
};

// スコア
let score = 0;
let highScore = 0;
let isPaused = false;

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

function makeBlocks() {
  blocks = [];

  for (let row = 0; row < blockRows; row++) {
    for (let col = 0; col < blockCols; col++) {
      blocks.push({
        x: blockStartX + col * (blockWidth + blockGap),
        y: blockStartY + row * (blockHeight + blockGap),
        width: blockWidth,
        height: blockHeight,
        color: colors[(row + col) % colors.length],
        alive: true
      });
    }
  }
}

function resetBall() {
  ballX = canvas.width / 2;
  ballY = 220;
  ballSpeedX = 3;
  ballSpeedY = -3;
}

function resetPaddle() {
  paddleX = (canvas.width - paddleWidth) / 2;
  paddleSpeed = 0;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function updatePaddle() {
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

  if (paddleX + paddleWidth > canvas.width) {
    paddleX = canvas.width - paddleWidth;
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
  const isTouchingPaddle =
    ballY + ballRadius > paddleY &&
    ballY - ballRadius < paddleY + paddleHeight &&
    ballX > paddleX &&
    ballX < paddleX + paddleWidth &&
    ballSpeedY > 0;

  if (!isTouchingPaddle) {
    return;
  }

  const hitPosition = (ballX - (paddleX + paddleWidth / 2)) / (paddleWidth / 2);
  ballSpeedX = hitPosition * 4;
  ballSpeedY *= -1;
  ballY = paddleY - ballRadius;
}

function checkBlockCollision() {
  for (let block of blocks) {
    const isTouchingBlock =
      block.alive &&
      ballX + ballRadius > block.x &&
      ballX - ballRadius < block.x + block.width &&
      ballY + ballRadius > block.y &&
      ballY - ballRadius < block.y + block.height;

    if (isTouchingBlock) {
      block.alive = false;
      ballSpeedY *= -1;
      score += 10;

      if (score > highScore) {
        highScore = score;
      }

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
    score = 0;
    makeBlocks();
    resetBall();
    resetPaddle();
  }
}

function drawText() {
  ctx.fillStyle = "white";
  ctx.font = "16px Arial";
  ctx.fillText("Score: " + score, 10, 20);
  ctx.fillText("High Score: " + highScore, 350, 20);
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

function drawBall() {
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
  ctx.fill();
}

function drawPaddle() {
  ctx.fillStyle = "white";
  ctx.fillRect(paddleX, paddleY, paddleWidth, paddleHeight);
}

function drawBlocks() {
  for (let block of blocks) {
    if (block.alive) {
      ctx.fillStyle = block.color;
      ctx.fillRect(block.x, block.y, block.width, block.height);
    }
  }
}

function draw() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawText();
  drawBall();
  drawPaddle();
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
  checkRoundState();

  requestAnimationFrame(draw);
}

document.addEventListener("keydown", function(event) {
  if ((event.code === "Space" || event.key.toLowerCase() === "p") && !event.repeat) {
    isPaused = !isPaused;
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

document.addEventListener("keyup", function(event) {
  if (event.key === "ArrowLeft") {
    keys.left = false;
  }

  if (event.key === "ArrowRight") {
    keys.right = false;
  }
});

makeBlocks();
draw();
