const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
let W = (canvas.width = window.innerWidth);
let H = (canvas.height = window.innerHeight);

window.addEventListener('resize', () => {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
  player.h = H * 0.12;
  player.w = player.h * (img.width / img.height) * 0.9;
  player.y = H * 0.9 - player.h - 10;
});


// ✅ Touch controls for mobile
window.addEventListener('touchstart', e => {
  e.preventDefault();
  if (!started) {
    started = true;
    document.getElementById('startScreen').style.display = 'none';
    running = true;
    return;
  }
  doJump();
});

window.addEventListener('touchend', e => {
  e.preventDefault();
  jumpPressed = false;
});



// Load assets
const img = new Image();
img.src = "beard.png";
const coinImg = new Image();
coinImg.src = "coin.png";

const jumpSound = new Audio("jump.mp3");
const hitSound = new Audio("collision.mp3");
jumpSound.volume = 0.8;
hitSound.volume = 0.8;

// Player setup
const player = {
  x: W * 0.15,
  y: H * 0.7,
  w: 80,
  h: 110,
  vy: 0,
  gravity: 0.7,         // less gravity = slower fall
  jumpStrength: -22,    // stronger jump
  jumpsLeft: 2,
  lives: 3,
};



let pillars = [];
let coins = [];
let spawnTimer = 0;
let spawnInterval = 140;
let speed = 5;
let score = 0;
let running = false;
let started = false;
let colorTime = 0;

function spawnPillar() {
  const height = Math.random() * 100 + 80;
  const width = Math.random() * 80 + 100;
  pillars.push({
    x: W + 80,
    y: H * 0.9 - height,
    w: width,
    h: height,
    passed: false,
  });

  // Occasionally spawn a coin
  if (Math.random() < 0.4) {
    coins.push({
      x: W + 80 + width / 2,
      y: H * 0.9 - height - 50,
      r: 20,
      collected: false,
    });
  }
}

function resetGame() {
  pillars = [];
  coins = [];
  spawnTimer = 0;
  score = 0;
  speed = 5;
  player.y = H * 0.7;
  player.vy = 0;
  player.jumpsLeft = 2;
  player.lives = 3;
  running = true;

  document.getElementById("score").textContent = score;
  document.getElementById("message").style.display = "none";

  // ✅ Load best score from localStorage
  const best = localStorage.getItem("bestScore") || 0;
  document.getElementById("bestScore").textContent = best;
}

function playJump() {
  try {
    jumpSound.cloneNode().play();
  } catch (e) {}
}

function playHit() {
  try {
    hitSound.cloneNode().play();
  } catch (e) {}
}

function update() {
  if (!running) return;

  // Day/Night background cycle
  colorTime += 0.002;
  if (colorTime > Math.PI * 2) colorTime = 0;
  const bgValue = Math.floor(128 + Math.sin(colorTime) * 100);
  canvas.style.background = `rgb(${bgValue}, ${bgValue + 20}, ${bgValue + 30})`;

  // Gravity and movement
  player.vy += player.gravity;
  player.y += player.vy;
  if (player.y + player.h > H * 0.9) {
    player.y = H * 0.9 - player.h;
    player.vy = 0;
    player.jumpsLeft = 2;
  }

  // Speed curve (gradual increase)
  speed += 0.0005;

  // Spawn pillars
  spawnTimer++;
  if (spawnTimer > spawnInterval) {
    spawnPillar();
    spawnTimer = 0;
  }

  // Move pillars & coins
  for (let i = pillars.length - 1; i >= 0; i--) {
    const p = pillars[i];
    p.x -= speed;

    if (!p.passed && p.x + p.w < player.x) {
      p.passed = true;
      score++;
      document.getElementById("score").textContent = score;
    }

    if (p.x + p.w < -50) pillars.splice(i, 1);

    // Collision
    if (
      player.x < p.x + p.w &&
      player.x + player.w > p.x &&
      player.y < p.y + p.h &&
      player.y + player.h > p.y
    ) {
      playHit();
      player.lives--;
      pillars.splice(i, 1); // remove hit pillar
      if (player.lives <= 0) {
        running = false;
        showGameOver();
      }
    }
  }

  // Coins
  for (let i = coins.length - 1; i >= 0; i--) {
    const c = coins[i];
    c.x -= speed;
    if (
      !c.collected &&
      player.x < c.x + c.r &&
      player.x + player.w > c.x - c.r &&
      player.y < c.y + c.r &&
      player.y + player.h > c.y - c.r
    ) {
      c.collected = true;
      score += 5; // bonus points
      document.getElementById("score").textContent = score;
    }
    if (c.x + c.r < -50) coins.splice(i, 1);
  }
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  // Ground
  ctx.fillStyle = "#4b4f52";
  ctx.fillRect(0, H * 0.9, W, H * 0.1);

  // Player
  if (img.complete) {
    ctx.drawImage(img, player.x, player.y, player.w, player.h);
  }

  // Pillars
  for (const p of pillars) {
    if (img.complete) ctx.drawImage(img, p.x, p.y, p.w, p.h);
  }

  // Coins
  for (const c of coins) {
    if (!c.collected) {
      ctx.drawImage(coinImg, c.x - c.r, c.y - c.r, c.r * 2, c.r * 2);
    }
  }

  // Lives display
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Lives: " + player.lives, 10, 40);
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

function showGameOver() {
  // ✅ Check for new best score
  const best = localStorage.getItem("bestScore") || 0;
  if (score > best) {
    localStorage.setItem("bestScore", score);
  }

  // ✅ Update display
  document.getElementById("bestScore").textContent =
    localStorage.getItem("bestScore") || 0;

  document.getElementById("status").textContent =
    "Game Over — Score: " + score;
  document.getElementById("message").style.display = "block";
}

function doJump() {
  if (!running) return;
  if (player.jumpsLeft > 0) {
    player.vy = player.jumpStrength;
    player.jumpsLeft--;
    playJump();
  }
}

// Variable jump height — shorter if key released quickly
let jumpPressed = false;
window.addEventListener("mousedown", () => (jumpPressed = true));
window.addEventListener("mouseup", () => (jumpPressed = false));
window.addEventListener("keydown", (e) => {
  if (e.code === "Space") jumpPressed = true;
});
window.addEventListener("keyup", (e) => {
  if (e.code === "Space") jumpPressed = false;
});

function variableJump() {
  if (jumpPressed && player.vy < 0) {
    player.vy += 0.3; // slow falling for higher jump
  }
  requestAnimationFrame(variableJump);
}
variableJump();

// Controls
window.addEventListener("click", (e) => {
  if (e.target.id === "restart") return;
  if (!started) {
    started = true;
    document.getElementById("startScreen").style.display = "none";
    running = true;
    return;
  }
  doJump();
});
window.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    if (!started) {
      started = true;
      document.getElementById("startScreen").style.display = "none";
      running = true;
      return;
    }
    doJump();
  }
});

document.getElementById("restart").addEventListener("click", resetGame);

img.onload = () => {
  player.h = H * 0.12;
  player.w = player.h * (img.width / img.height) * 0.9;
  player.y = H * 0.9 - player.h - 10;
  loop();
};

document.getElementById("bestScore").textContent =
  localStorage.getItem("bestScore") || 0;

