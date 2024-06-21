const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

const GRAVITY = 0.5;
const JUMP_FORCE = -12;
const MOVE_SPEED = 3;

const player = {
    x: 100,
    y: canvas.height - 50,
    width: 30,
    height: 50,
    vx: MOVE_SPEED,
    vy: 0,
    jumping: false,
    color: '#FFC520'
};

let terrain = [];
let cameraX = 0;
const terrainWidth = 10000;  // Generate a long stretch of terrain

function generateTerrain() {
    terrain = new Array(terrainWidth).fill(canvas.height - 100);  // Base ground level

    // Generate hills and valleys
    let currentHeight = terrain[0];
    for (let x = 1; x < terrainWidth; x++) {
        if (Math.random() < 0.05) {  // Start a new hill or valley
            const length = Math.floor(Math.random() * 200) + 50;
            const amplitude = Math.random() * 100 - 50;
            for (let i = 0; i < length && x + i < terrainWidth; i++) {
                const t = i / length;
                const y = Math.sin(t * Math.PI) * amplitude;
                terrain[x + i] = Math.max(100, Math.min(canvas.height - 50, currentHeight + y));
            }
            x += length;
            currentHeight = terrain[x - 1];
        } else {
            terrain[x] = currentHeight;
        }
    }
}

function drawTerrain() {
    ctx.fillStyle = '#5b3e26';  // Dark brown for the ground
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    for (let x = 0; x < canvas.width; x++) {
        const terrainX = Math.floor(x + cameraX);
        if (terrainX < terrainWidth) {
            ctx.lineTo(x, terrain[terrainX]);
        }
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();
    ctx.fill();

    // Add grass details
    ctx.strokeStyle = '#2e8b57';  // Sea green for grass
    for (let x = 0; x < canvas.width; x += 5) {
        const terrainX = Math.floor(x + cameraX);
        if (terrainX < terrainWidth) {
            const y = terrain[terrainX];
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y - Math.random() * 5 - 2);
            ctx.stroke();
        }
    }
}

function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x - cameraX, player.y, player.width, player.height);
}

function updatePlayer() {
    player.vy += GRAVITY;
    player.x += player.vx;
    player.y += player.vy;

    // Ground collision
    const groundHeight = terrain[Math.floor(player.x)];
    if (player.y + player.height > groundHeight) {
        player.y = groundHeight - player.height;
        player.vy = 0;
        player.jumping = false;
    }

    // Update camera
    cameraX = player.x - canvas.width / 3;
}

function drawBackground() {
    // Sky
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#87CEEB");
    gradient.addColorStop(1, "#E0F6FF");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Distant mountains
    ctx.fillStyle = '#6a8ea6';
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-100 + (i * 500) - (cameraX * 0.1) % 1500, canvas.height);
        for (let x = 0; x <= 600; x++) {
            const y = Math.sin(x / 100 + i) * 50 + Math.sin(x / 50) * 25;
            ctx.lineTo(x + (i * 500) - (cameraX * 0.1) % 1500, canvas.height - 100 - y);
        }
        ctx.lineTo(700 + (i * 500) - (cameraX * 0.1) % 1500, canvas.height);
        ctx.closePath();
        ctx.fill();
    }
}

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawTerrain();
    updatePlayer();
    drawPlayer();
    requestAnimationFrame(update);
}

function jump() {
    if (!player.jumping) {
        player.vy = JUMP_FORCE;
        player.jumping = true;
    }
}

canvas.addEventListener('click', jump);
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        jump();
    }
});

generateTerrain();
update();