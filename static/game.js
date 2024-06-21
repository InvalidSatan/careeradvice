const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const player = {
    x: canvas.width / 2,
    y: canvas.height - 30,
    width: 20,
    height: 20,
    color: '#FFC520'
};

let path = [];
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let gameSpeed = 2;
let pathWidth = 200;
let gameLoop;
let gameActive = false;

function generatePath() {
    if (path.length === 0) {
        path.push({
            x: canvas.width / 2 - pathWidth / 2,
            y: canvas.height,
            width: pathWidth
        });
    }

    const lastSegment = path[path.length - 1];
    const newX = Math.max(0, Math.min(canvas.width - pathWidth, lastSegment.x + (Math.random() - 0.5) * 50));

    path.push({
        x: newX,
        y: lastSegment.y - 100,
        width: pathWidth
    });
}

function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x - player.width / 2, player.y - player.height / 2, player.width, player.height);
}

function drawPath() {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#F8F9FA';
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

function movePath() {
    path.forEach(segment => {
        segment.y += gameSpeed;
    });
    path = path.filter(segment => segment.y < canvas.height + 100);

    while (path.length < 10) {
        generatePath();
    }
}

function checkCollision() {
    const playerSegment = path.find(segment => segment.y > player.y && segment.y - 100 < player.y);
    if (playerSegment) {
        return player.x - player.width / 2 < playerSegment.x || player.x + player.width / 2 > playerSegment.x + playerSegment.width;
    }
    return false;
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
    drawPath();
    drawPlayer();
    movePath();
    updateScore();

    if (checkCollision()) {
        gameOver();
        return;
    }

    if (score % 100 === 0) {
        gameSpeed += 0.1;
        pathWidth = Math.max(50, pathWidth - 1);
    }

    requestAnimationFrame(update);
}

function startGame() {
    path = [];
    score = 0;
    gameSpeed = 2;
    pathWidth = 200;
    player.x = canvas.width / 2;
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

document.getElementById('highScoreDisplay').innerText = `High Score: ${highScore}`;
ctx.font = '48px Roboto';
ctx.fillStyle = '#000000';
ctx.textAlign = 'center';
ctx.fillText('App State Path Runner', canvas.width / 2, canvas.height / 2);
ctx.font = '24px Roboto';
ctx.fillText('Click to start', canvas.width / 2, canvas.height / 2 + 40);