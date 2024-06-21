const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

const GRAVITY = 0.5;
const JUMP_FORCE = -12;
const MOVE_SPEED = 3;
const CLIMB_SPEED = 2;

const player = {
    x: 100,
    y: canvas.height - 50,
    width: 30,
    height: 50,
    vx: 0,
    vy: 0,
    climbing: false,
    jumping: false,
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
    const lastSegment = terrain[terrain.length - 1] || { x: 0, y: canvas.height - 100, width: 100 };
    let newY = Math.max(100, Math.min(canvas.height - 100, lastSegment.y + (Math.random() - 0.5) * 30));

    // Ensure smooth transition between segments
    const maxHeightDifference = 20;
    if (Math.abs(newY - lastSegment.y) > maxHeightDifference) {
        newY = lastSegment.y + Math.sign(newY - lastSegment.y) * maxHeightDifference;
    }

    const newSegment = {
        x: lastSegment.x + lastSegment.width,
        y: newY,
        width: Math.random() * 100 + 50
    };
    terrain.push(newSegment);

    // Randomly add pitfalls
    if (Math.random() < 0.1 && terrain.length > 5) {  // Reduced probability and ensure some initial solid ground
        const pitfallWidth = Math.random() * 60 + 40;  // Slightly narrower pitfalls
        terrain.push({
            x: newSegment.x + newSegment.width,
            y: canvas.height + 50,  // Below the canvas
            width: pitfallWidth
        });
    }
}

function generateObstacle() {
    if (Math.random() < 0.1) {
        const lastTerrainSegment = terrain[terrain.length - 1];
        const obstacleType = Math.random() < 0.33 ? 'rock' : Math.random() < 0.66 ? 'tree' : 'bear';
        obstacles.push({
            x: lastTerrainSegment.x + Math.random() * lastTerrainSegment.width,
            y: lastTerrainSegment.y - 30,
            width: 30,
            height: 30,
            type: obstacleType
        });
    }
}

function generatePowerUp() {
    if (Math.random() < 0.05) {
        const lastTerrainSegment = terrain[terrain.length - 1];
        const type = Math.random() < 0.5 ? 'jetpack' : 'pickaxe';
        powerUps.push({
            x: lastTerrainSegment.x + Math.random() * lastTerrainSegment.width,
            y: lastTerrainSegment.y - 50,
            width: 30,
            height: 30,
            type: type
        });
    }
}

function drawTerrain() {
    ctx.fillStyle = '#8B4513';
    terrain.forEach(segment => {
        ctx.fillRect(segment.x - player.x + 100, segment.y, segment.width, canvas.height - segment.y);
    });
}

function drawObstacles() {
    obstacles.forEach(obstacle => {
        switch(obstacle.type) {
            case 'rock':
                ctx.fillStyle = '#808080';
                ctx.beginPath();
                ctx.arc(obstacle.x - player.x + 100 + obstacle.width / 2, obstacle.y + obstacle.height / 2, obstacle.width / 2, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'tree':
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(obstacle.x - player.x + 100, obstacle.y, obstacle.width / 3, obstacle.height);
                ctx.fillStyle = '#228B22';
                ctx.beginPath();
                ctx.moveTo(obstacle.x - player.x + 100 - obstacle.width / 2, obstacle.y);
                ctx.lineTo(obstacle.x - player.x + 100 + obstacle.width / 2, obstacle.y);
                ctx.lineTo(obstacle.x - player.x + 100, obstacle.y - obstacle.height);
                ctx.closePath();
                ctx.fill();
                break;
            case 'bear':
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(obstacle.x - player.x + 100, obstacle.y, obstacle.width, obstacle.height);
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.arc(obstacle.x - player.x + 100 + obstacle.width * 0.2, obstacle.y + obstacle.height * 0.2, obstacle.width * 0.1, 0, Math.PI * 2);
                ctx.arc(obstacle.x - player.x + 100 + obstacle.width * 0.8, obstacle.y + obstacle.height * 0.2, obstacle.width * 0.1, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
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
    const progress = Math.min(1, player.x / 10000);  // Assume 10000 is the "top" of the mountain
    gradient.addColorStop(0, `rgb(${135 - 100 * progress}, ${206 - 100 * progress}, ${235 - 100 * progress})`);
    gradient.addColorStop(1, `rgb(${224 - 100 * progress}, ${246 - 100 * progress}, ${255 - 100 * progress})`);
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

    // Draw snow-capped peaks in the distance
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 300 - (player.x % 300), canvas.height - 100 - i * 50);
        ctx.lineTo(i * 300 + 150 - (player.x % 300), canvas.height - 300 - i * 50);
        ctx.lineTo(i * 300 + 300 - (player.x % 300), canvas.height - 100 - i * 50);
        ctx.closePath();
        ctx.fill();
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

    // Apply gravity
    player.vy += GRAVITY;

    // Move player
    const nextX = player.x + player.vx;
    const nextY = player.y + player.vy;

    // Check for terrain collision and climbing
    player.climbing = false;
    let onGround = false;
    let currentTerrain = null;

    for (let segment of terrain) {
        if (nextX + player.width > segment.x && nextX < segment.x + segment.width) {
            currentTerrain = segment;
            // Check for collision with the top of the terrain
            if (nextY + player.height > segment.y && player.y + player.height <= segment.y) {
                player.y = segment.y - player.height;
                player.vy = 0;
                player.climbing = true;
                onGround = true;
                break;
            }
        }
    }

    // Update player position
    if (currentTerrain) {
        player.x = nextX;
        if (!onGround) {
            player.y = nextY;
        }
    } else {
        player.x = nextX;
        player.y = nextY;
    }

    // Reset jumping state if on ground
    if (onGround) {
        player.jumping = false;
    }

    // Climbing mechanics
    if (player.climbing) {
        if (player.powerUp === 'pickaxe') {
            player.vx = CLIMB_SPEED * 1.5;
        } else {
            player.vx = CLIMB_SPEED;
        }
    } else {
        player.vx = MOVE_SPEED;
    }

    // Jetpack mechanics
    if (player.powerUp === 'jetpack') {
        player.vy = -CLIMB_SPEED * 2;
        player.vx = MOVE_SPEED * 1.5;
    }

    // Check for falling off the mountain or hitting obstacles
    if (player.y > canvas.height || obstacles.some(obstacle =>
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
    while (terrain[terrain.length - 1].x - player.x < canvas.width * 2) {
        generateTerrain();
        generateObstacle();
        generatePowerUp();
    }

    // Remove off-screen elements
    terrain = terrain.filter(segment => segment.x + segment.width > player.x - 100);
    obstacles = obstacles.filter(obstacle => obstacle.x > player.x - 100);
    powerUps = powerUps.filter(powerUp => powerUp.x > player.x - 100);

    updateScore();

    requestAnimationFrame(update);
}

function startGame() {
    terrain = [{ x: 0, y: canvas.height - 100, width: 200 }];
    obstacles = [];
    powerUps = [];
    score = 0;
    player.x = 100;
    player.y = canvas.height - 150;
    player.vx = MOVE_SPEED;
    player.vy = 0;
    player.climbing = false;
    player.jumping = false;
    player.powerUp = null;
    gameActive = true;
    document.getElementById('scoreDisplay').innerText = 'Score: 0';
    document.getElementById('highScoreDisplay').innerText = `High Score: ${highScore}`;

    for (let i = 0; i < 20; i++) {
        generateTerrain();
    }

    requestAnimationFrame(update);
}

function jump() {
    if (!player.jumping && !player.powerUp) {
        player.vy = JUMP_FORCE;
        player.jumping = true;
        player.climbing = false;
    }
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
    } else {
        jump();
    }
});

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        if (!gameActive) {
            startGame();
        } else {
            jump();
        }
    }
});

document.getElementById('highScoreDisplay').innerText = `High Score: ${highScore}`;
drawStartScreen();