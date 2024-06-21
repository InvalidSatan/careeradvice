const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const player = {
    x: canvas.width / 2,
    y: canvas.height - 30,
    radius: 15,
    color: '#FFC520'
};

let obstacles = [];
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let gameSpeed = 2;
let gameLoop;

function drawPlayer() {
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.fill();
    ctx.closePath();
}

function drawObstacles() {
    obstacles.forEach(obstacle => {
        ctx.beginPath();
        ctx.rect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        ctx.fillStyle = '#000000';
        ctx.fill();
        ctx.closePath();
    });
}

function moveObstacles() {
    obstacles.forEach(obstacle => {
        obstacle.y += gameSpeed;
    });
    obstacles = obstacles.filter(obstacle => obstacle.y < canvas.height);
}

function createObstacle() {
    const width = Math.random() * (50 - 20) + 20;
    obstacles.push({
        x: Math.random() * (canvas.width - width),
        y: 0,
        width: width,
        height: 20
    });
}

function checkCollision() {
    return obstacles.some(obstacle => {
        return player.x < obstacle.x + obstacle.width &&
               player.x + player.radius > obstacle.x &&
               player.y < obstacle.y + obstacle.height &&
               player.y + player.radius > obstacle.y;
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
    clearInterval(gameLoop);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPlayer();
    drawObstacles();
    moveObstacles();
    updateScore();
    if (checkCollision()) {
        gameOver();
    }
    if (score % 100 === 0) {
        gameSpeed += 0.1;
    }
}

function startGame() {
    obstacles = [];
    score = 0;
    gameSpeed = 2;
    player.x = canvas.width / 2;
    document.getElementById('scoreDisplay').innerText = 'Score: 0';
    document.getElementById('highScoreDisplay').innerText = `High Score: ${highScore}`;
    clearInterval(gameLoop);
    gameLoop = setInterval(update, 20);
    setInterval(createObstacle, 1000);
}

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    player.x = e.clientX - rect.left;
});

canvas.addEventListener('click', () => {
    if (!gameLoop) {
        startGame();
    }
});

document.getElementById('highScoreDisplay').innerText = `High Score: ${highScore}`;
ctx.font = '48px Roboto';
ctx.fillStyle = '#000000';
ctx.textAlign = 'center';
ctx.fillText('App State Dodge', canvas.width / 2, canvas.height / 2);
ctx.font = '24px Roboto';
ctx.fillText('Click to start', canvas.width / 2, canvas.height / 2 + 40);