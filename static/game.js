const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

const GRAVITY = 0.5;
const JUMP_FORCE = -10;
const MOVE_SPEED = 5;
const CLIMB_SPEED = 3;

const player = {
    x: 100,
    y: canvas.height - 50,
    width: 30,
    height: 50,
    vy: 0,
    climbing: false,
    color: '#FFC520',
    powerUp: null
};

let terrain = [];
let obstacles = [];
let powerUps = [];
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let gameLoop;
let gameActive = false;

// Load images
const backgroundImg = new Image();
backgroundImg.src = 'https://opengameart.org/sites/default/files/country-platform-preview.png';

const playerImg = new Image();
playerImg.src = 'https://opengameart.org/sites/default/files/styles/medium/public/char_run.gif';

let imagesLoaded = 0;
const totalImages = 2;

function imageLoaded() {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
        canvas.style.display = 'block';
        drawStartScreen();
    }
}

backgroundImg.onload = imageLoaded;
backgroundImg.onerror = imageLoaded;
playerImg.onload = imageLoaded;
playerImg.onerror = imageLoaded;

function generateTerrain() {
    const lastSegment = terrain[terrain.length - 1] || { x: 0, y: canvas.height - 100 };
    const newSegment = {
        x: lastSegment.x + Math.random() * 100 + 50,
        y: Math.max(100, Math.min(canvas.height - 100, lastSegment.y + (Math.random() - 0.5) * 100))
    };
    terrain.push(newSegment);
}

function generateObstacle() {
    if (Math.random() < 0.05) {
        const lastTerrainSegment = terrain[terrain.length - 1];
        obstacles.push({
            x: lastTerrainSegment.x,
            y: lastTerrainSegment.y - 30,
            width: 30,
            height: 30
        });
    }
}

function generatePowerUp() {
    if (Math.random() < 0.02) {
        const lastTerrainSegment = terrain[terrain.length - 1];
        const type = Math.random() < 0.5 ? 'jetpack' : 'pickaxe';
        powerUps.push({
            x: lastTerrainSegment.x,
            y: lastTerrainSegment.y - 50,
            width: 30,
            height: 30,
            type: type
        });
    }
}

function drawTerrain() {
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2;
    ctx.beginPath();
    terrain.forEach((segment, index) => {
        if (index === 0) {
            ctx.moveTo(segment.x - player.x + 100, segment.y);
        } else {
            ctx.lineTo(segment.x - player.x + 100, segment.y);
        }
    });
    ctx.stroke();
}

function drawObstacles() {
    ctx.fillStyle = '#808080';
    obstacles.forEach(obstacle => {
        ctx.fillRect(obstacle.x - player.x + 100, obstacle.y, obstacle.width, obstacle.height);
    });
}

function drawPowerUps() {
    powerUps.forEach(powerUp => {
        if (powerUp.type === 'jetpack') {
            ctx.fillStyle = '#FF4500';
        } else {
            ctx.fillStyle = '#C0C0C0';
        }
        ctx.fillRect(powerUp.x - player.x + 100, powerUp.y, powerUp.width, powerUp.height);
    });
}

function drawPlayer() {
    if (playerImg.complete && playerImg.naturalHeight !== 0) {
        ctx.drawImage(playerImg, 100, player.y, player.width, player.height);
    } else {
        ctx.fillStyle = player.color;
        ctx.fillRect(100, player.y, player.width, player.height);
    }

    if (player.powerUp) {
        ctx.fillStyle = player.powerUp === 'jetpack' ? '#FF4500' : '#C0C0C0';
        ctx.fillRect(100 + player.width, player.y, 10, 10);
    }
}

function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#87CEEB");
    gradient.addColorStop(1, "#E0F6FF");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (backgroundImg.complete && backgroundImg.naturalHeight !== 0) {
        const scale = canvas.height / backgroundImg.height;
        const scaledWidth = backgroundImg.width * scale;
        const repetitions = Math.ceil(canvas.width / scaledWidth) + 1;

        for (let i = 0; i < repetitions; i++) {
            ctx.drawImage(
                backgroundImg,
                i * scaledWidth - (player.x % scaledWidth),
                0,
                scaledWidth,
                canvas.height
            );
        }
    }
}

function updateScore() {
    score = Math.floor(player.x / 10);
    document.getElementById('scoreDisplay').innerText = `Score: ${score}`;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        document.getElementById('highScoreDisplay').innerText = `High Score: ${highScore}`;
    }
}

function gameOver() {
    gameActive = false;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = '48px Roboto';
    ctx.fillStyle = '#FFC520';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2);
    ctx.font = '24px Roboto';
    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 40);
    ctx.fillText(`High Score: ${highScore}`, canvas.width / 2, canvas.height / 2 + 70);
    ctx.fillText('Click or press SPACE to play again', canvas.width / 2, canvas.height / 2 + 110);
}

function update() {
    if (!gameActive) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawTerrain();
    drawObstacles();
    drawPowerUps();
    drawPlayer();

    // Move player
    player.x += MOVE_SPEED;
    if (player.climbing) {
        player.y -= CLIMB_SPEED;
    } else if (player.powerUp === 'jetpack') {
        player.y -= CLIMB_SPEED * 2;
    } else {
        player.vy += GRAVITY;
        player.y += player.vy;
    }

    // Check for ground collision
    const groundLevel = canvas.height - 50;
    if (player.y > groundLevel) {
        player.y = groundLevel;
        player.vy = 0;
        player.climbing = false;
    }

    // Check for terrain collision
    player.climbing = false;
    terrain.forEach(segment => {
        if (player.x >= segment.x - 15 && player.x <= segment.x + 15 &&
            player.y + player.height >= segment.y - 5 && player.y + player.height <= segment.y + 5) {
            player.y = segment.y - player.height;
            player.vy = 0;
            player.climbing = true;
        }
    });

    // Check for obstacle collision
    if (obstacles.some(obstacle =>
        player.x + player.width > obstacle.x &&
        player.x < obstacle.x + obstacle.width &&
        player.y + player.height > obstacle.y &&
        player.y < obstacle.y + obstacle.height
    )) {
        gameOver();
        return;
    }

    // Check for power-up collection
    powerUps = powerUps.filter(powerUp => {
        if (player.x + player.width > powerUp.x &&
            player.x < powerUp.x + powerUp.width &&
            player.y + player.height > powerUp.y &&
            player.y < powerUp.y + powerUp.height) {
            player.powerUp = powerUp.type;
            setTimeout(() => { player.powerUp = null; }, 5000);  // Power-up lasts for 5 seconds
            return false;
        }
        return true;
    });

    // Generate new terrain, obstacles, and power-ups
    while (terrain[terrain.length - 1].x - player.x < canvas.width) {
        generateTerrain();
        generateObstacle();
        generatePowerUp();
    }

    // Remove off-screen elements
    terrain = terrain.filter(segment => segment.x > player.x - canvas.width);
    obstacles = obstacles.filter(obstacle => obstacle.x > player.x - canvas.width);
    powerUps = powerUps.filter(powerUp => powerUp.x > player.x - canvas.width);

    updateScore();

    requestAnimationFrame(update);
}

function startGame() {
    terrain = [{ x: 0, y: canvas.height - 100 }];
    obstacles = [];
    powerUps = [];
    score = 0;
    player.x = 100;
    player.y = canvas.height - 150;
    player.vy = 0;
    player.climbing = false;
    player.powerUp = null;
    gameActive = true;
    document.getElementById('scoreDisplay').innerText = 'Score: 0';
    document.getElementById('highScoreDisplay').innerText = `High Score: ${highScore}`;

    for (let i = 0; i < 20; i++) {
        generateTerrain();
    }

    requestAnimationFrame(update);
}

function drawStartScreen() {
    drawBackground();
    ctx.font = '48px Roboto';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.fillText('Mountain Climber', canvas.width / 2, canvas.height / 2);
    ctx.font = '24px Roboto';
    ctx.fillText('Click or press SPACE to start', canvas.width / 2, canvas.height / 2 + 40);
}

canvas.addEventListener('click', () => {
    if (!gameActive) {
        startGame();
    } else if (!player.climbing && player.powerUp !== 'jetpack') {
        player.vy = JUMP_FORCE;
    }
});

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        if (!gameActive) {
            startGame();
        } else if (!player.climbing && player.powerUp !== 'jetpack') {
            player.vy = JUMP_FORCE;
        }
    }
});

document.getElementById('highScoreDisplay').innerText = `High Score: ${highScore}`;
drawStartScreen();