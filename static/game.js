const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

const GRAVITY = 0.5;
const JUMP_FORCE = -10;
const GAME_SPEED_INCREMENT = 0.0001;

const player = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    width: 30,
    height: 50,
    vy: 0,
    grounded: false,
    color: '#FFC520'
};

let path = [];
let obstacles = [];
let particles = [];
let trees = [];
let clouds = [];
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let gameSpeed = 2;
let pathWidth = 200;
let gameLoop;
let gameActive = false;

// Load images
const mountainImg = new Image();
mountainImg.src = 'https://opengameart.org/sites/default/files/country-platform-preview.png';

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

mountainImg.onload = imageLoaded;
mountainImg.onerror = imageLoaded;  // Proceed even if image fails to load
playerImg.onload = imageLoaded;
playerImg.onerror = imageLoaded;  // Proceed even if image fails to load

function generatePath() {
    if (path.length === 0) {
        path.push({
            x: canvas.width / 2 - pathWidth / 2,
            y: canvas.height,
            width: pathWidth
        });
    }

    const lastSegment = path[path.length - 1];
    const newX = Math.max(50, Math.min(canvas.width - pathWidth - 50, lastSegment.x + (Math.random() - 0.5) * 100));

    path.push({
        x: newX,
        y: lastSegment.y - 100,
        width: pathWidth
    });
}

function generateObstacle() {
    if (Math.random() < 0.03) {  // 3% chance to generate an obstacle
        const lastPathSegment = path[path.length - 1];
        obstacles.push({
            x: lastPathSegment.x + Math.random() * (lastPathSegment.width - 40),
            y: lastPathSegment.y,
            width: 40,
            height: 40
        });
    }
}

function generateTree() {
    if (Math.random() < 0.05) {  // 5% chance to generate a tree
        const side = Math.random() < 0.5 ? 'left' : 'right';
        const x = side === 'left' ? Math.random() * 50 : canvas.width - Math.random() * 50 - 30;
        trees.push({
            x: x,
            y: -50,
            width: 30,
            height: 50
        });
    }
}

function generateCloud() {
    if (Math.random() < 0.01) {  // 1% chance to generate a cloud
        clouds.push({
            x: canvas.width,
            y: Math.random() * canvas.height / 2,
            width: Math.random() * 50 + 50,
            height: Math.random() * 30 + 20,
            speed: Math.random() * 0.5 + 0.1
        });
    }
}

function drawStartScreen() {
    drawBackground();
    ctx.font = '48px Roboto';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.fillText('Mountain Runner', canvas.width / 2, canvas.height / 2);
    ctx.font = '24px Roboto';
    ctx.fillText('Click to start', canvas.width / 2, canvas.height / 2 + 40);
}

function drawBackground() {
    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#87CEEB");
    gradient.addColorStop(1, "#E0F6FF");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Mountains
    if (mountainImg.complete && mountainImg.naturalHeight !== 0) {
        ctx.drawImage(mountainImg, 0, canvas.height - 300, canvas.width, 300);
    } else {
        // Fallback if image doesn't load
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.moveTo(0, canvas.height);
        ctx.lineTo(canvas.width / 4, canvas.height / 2);
        ctx.lineTo(canvas.width / 2, canvas.height * 3 / 4);
        ctx.lineTo(canvas.width * 3 / 4, canvas.height / 3);
        ctx.lineTo(canvas.width, canvas.height * 2 / 3);
        ctx.lineTo(canvas.width, canvas.height);
        ctx.closePath();
        ctx.fill();
    }
}

function drawPlayer() {
    if (playerImg.complete && playerImg.naturalHeight !== 0) {
        ctx.drawImage(playerImg, player.x - player.width / 2, player.y - player.height / 2, player.width, player.height);
    } else {
        // Fallback if image doesn't load
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x - player.width / 2, player.y - player.height / 2, player.width, player.height);
    }
}

function drawPath() {
    ctx.fillStyle = '#8B4513';  // Brown color for the path
    for (let i = 0; i < path.length - 1; i++) {
        const current = path[i];
        const next = path[i + 1];

        ctx.beginPath();
        ctx.moveTo(current.x, current.y);
        ctx.lineTo(current.x + current.width, current.y);
        ctx.lineTo(next.x + next.width, next.y);
        ctx.lineTo(next.x, next.y);
        ctx.closePath();
        ctx.fill();
    }
}

function drawObstacles() {
    ctx.fillStyle = '#808080';  // Gray color for boulders
    obstacles.forEach(obstacle => {
        ctx.beginPath();
        ctx.arc(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2, obstacle.width / 2, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawTrees() {
    ctx.fillStyle = '#228B22';  // Green color for trees
    trees.forEach(tree => {
        ctx.fillRect(tree.x, tree.y, tree.width, tree.height);
        ctx.beginPath();
        ctx.arc(tree.x + tree.width / 2, tree.y, tree.width, 0, Math.PI, true);
        ctx.fill();
    });
}

function drawClouds() {
    ctx.fillStyle = '#FFFFFF';  // White color for clouds
    clouds.forEach(cloud => {
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, cloud.width / 2, Math.PI * 0.5, Math.PI * 1.5);
        ctx.arc(cloud.x + cloud.width * 0.5, cloud.y - cloud.height * 0.5, cloud.height, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.width, cloud.y, cloud.width / 2, Math.PI * 1.5, Math.PI * 0.5);
        ctx.closePath();
        ctx.fill();
    });
}

function createParticles(x, y) {
    for (let i = 0; i < 5; i++) {
        particles.push({
            x: x,
            y: y,
            vx: Math.random() * 4 - 2,
            vy: Math.random() * -3 - 1,
            radius: Math.random() * 3 + 1,
            color: '#8B4513'
        });
    }
}

function drawParticles() {
    particles.forEach(particle => {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();
    });
}

function updateParticles() {
    particles = particles.filter(particle => particle.y < canvas.height);
    particles.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.1;
        particle.radius *= 0.96;
    });
}

function movePath() {
    path.forEach(segment => {
        segment.y += gameSpeed;
    });
    path = path.filter(segment => segment.y < canvas.height + 100);

    while (path.length < 10) {
        generatePath();
        generateObstacle();
        generateTree();
        generateCloud();
    }
}

function moveObstacles() {
    obstacles.forEach(obstacle => {
        obstacle.y += gameSpeed;
    });
    obstacles = obstacles.filter(obstacle => obstacle.y < canvas.height);
}

function moveTrees() {
    trees.forEach(tree => {
        tree.y += gameSpeed;
    });
    trees = trees.filter(tree => tree.y < canvas.height);
}

function moveClouds() {
    clouds.forEach(cloud => {
        cloud.x -= cloud.speed;
        cloud.y += gameSpeed * 0.1;
    });
    clouds = clouds.filter(cloud => cloud.x + cloud.width > 0 && cloud.y < canvas.height);
}

function checkCollision() {
    const playerSegment = path.find(segment => segment.y > player.y && segment.y - 100 < player.y + player.height);
    if (playerSegment) {
        if (player.x - player.width / 2 < playerSegment.x || player.x + player.width / 2 > playerSegment.x + playerSegment.width) {
            return true;
        }
    }

    return obstacles.some(obstacle => {
        const dx = obstacle.x + obstacle.width / 2 - player.x;
        const dy = obstacle.y + obstacle.height / 2 - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (obstacle.width / 2 + player.width / 3);
    });
}

function updateScore() {
    score++;
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
    ctx.fillText('Click to play again', canvas.width / 2, canvas.height / 2 + 110);
}

function update() {
    if (!gameActive) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawClouds();
    drawTrees();
    drawPath();
    drawObstacles();
    drawPlayer();
    drawParticles();

    movePath();
    moveObstacles();
    moveTrees();
    moveClouds();
    updateParticles();

    // Apply gravity
    player.vy += GRAVITY;
    player.y += player.vy;

    // Check for ground collision
    const groundLevel = canvas.height - 50;
    if (player.y > groundLevel) {
        player.y = groundLevel;
        player.vy = 0;
        player.grounded = true;
        createParticles(player.x, player.y + player.height / 2);
    } else {
        player.grounded = false;
    }

    updateScore();

    if (checkCollision()) {
        gameOver();
        return;
    }

    gameSpeed += GAME_SPEED_INCREMENT;
    pathWidth = Math.max(100, 200 - score / 10);

    requestAnimationFrame(update);
}

function startGame() {
    path = [];
    obstacles = [];
    trees = [];
    clouds = [];
    particles = [];
    score = 0;
    gameSpeed = 2;
    pathWidth = 200;
    player.x = canvas.width / 2;
    player.y = canvas.height - 50;
    player.vy = 0;
    gameActive = true;
    document.getElementById('scoreDisplay').innerText = 'Score: 0';
    document.getElementById('highScoreDisplay').innerText = `High Score: ${highScore}`;

    for (let i = 0; i < 10; i++) {
        generatePath();
    }

    requestAnimationFrame(update);
}

canvas.addEventListener('mousemove', (e) => {
    if (gameActive) {
        const rect = canvas.getBoundingClientRect();
        player.x = e.clientX - rect.left;
    }
});

canvas.addEventListener('click', () => {
    if (!gameActive) {
        startGame();
    }
});

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        if (!gameActive) {
            startGame();
        } else if (player.grounded) {
            player.vy = JUMP_FORCE;
            createParticles(player.x, player.y + player.height / 2);
        }
    }
});

document.getElementById('highScoreDisplay').innerText = `High Score: ${highScore}`;

// Initial draw of start screen
drawStartScreen();