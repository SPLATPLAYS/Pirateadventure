// Constants
const SHIP_SPEED = 5;
const WAVE_HEIGHT = 20;
const TREASURE_SPAWN_INTERVAL = 3000;
const OBSTACLE_SPAWN_INTERVAL = 4000;
const OBSTACLE_SPEED = 2;
const MIN_OBSTACLE_SIZE = 30;
const MAX_OBSTACLE_SIZE = 50;
const OBSTACLE_COLORS = ['#FF4444', '#FF6B6B', '#FA8072'];
const POWERUP_SPAWN_INTERVAL = 10000;
const DIFFICULTY_INCREASE_INTERVAL = 20000;
const HEALTH_MAX = 3;
const SOUND_EFFECTS = {
    collect: new Audio('collect.mp3'),
    coin: new Audio('coin.mp3'),
    damage: new Audio('damage.mp3'),
    gameOver: new Audio('gameover.mp3')
};
const GAME_STATES = {
    MENU: 'menu',
    PLAYING: 'playing',
    GAMEOVER: 'gameover'
};

let canvas, ctx;
let ship, treasures, obstacles, waves;
let score, gameOver;
let health;
let difficulty;
let powerups;
let particles;
let scoreMultiplier;
let currentObstacleSpeed = OBSTACLE_SPEED;
let gameState = GAME_STATES.MENU;

function initGame() {
    // Hide menu when game starts
    document.getElementById('menu').style.display = 'none';
    gameState = GAME_STATES.PLAYING;
    
    // Initialize canvas
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    // Game state
    ship = {
        x: canvas.width / 2,
        y: canvas.height - 30,
        width: 50,
        height: 50,
        dx: 0,
        dy: 0,
        rotation: 0
    };

    treasures = [];
    obstacles = [];
    score = 0;
    waves = [];
    gameOver = false;
    health = HEALTH_MAX;
    difficulty = 1;
    powerups = [];
    particles = [];
    scoreMultiplier = 1;

    // Initialize waves
    for (let i = 0; i < canvas.width/50; i++) {
        waves.push({
            x: i * 50,
            y: 0,
            amplitude: WAVE_HEIGHT,
            frequency: 0.02,
            offset: Math.random() * Math.PI * 2
        });
    }

    // Event listeners
    document.addEventListener('keydown', moveShip);
    document.addEventListener('keyup', stopShip);

    // Start game loop
    setInterval(generateTreasure, TREASURE_SPAWN_INTERVAL);
    // Add to initGame function after treasure interval
    setInterval(generateObstacle, OBSTACLE_SPAWN_INTERVAL);
    setInterval(increaseDifficulty, DIFFICULTY_INCREASE_INTERVAL);
    setInterval(generatePowerup, POWERUP_SPAWN_INTERVAL);
    update();
}

// Add obstacle generation function
function generateObstacle() {
    if (obstacles.length < 3) {
        const size = MIN_OBSTACLE_SIZE + Math.random() * (MAX_OBSTACLE_SIZE - MIN_OBSTACLE_SIZE);
        obstacles.push({
            x: Math.random() * (canvas.width - size),
            y: -size,
            width: size,
            height: size,
            speed: currentObstacleSpeed * (1 + Math.random() * 0.5),
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.1
        });
    }
}

// Modify drawObstacles function to remove collision check
function drawObstacles() {
    // Use for loop instead of forEach for safe removal
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        
        // Move and rotate obstacle
        obstacle.y += obstacle.speed;
        obstacle.rotation += obstacle.rotationSpeed;
        
        // Remove if off screen
        if (obstacle.y > canvas.height) {
            obstacles.splice(i, 1);
            continue;
        }
        
        // Draw obstacle (rock)
        ctx.save();
        ctx.translate(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2);
        ctx.rotate(obstacle.rotation);
        
        // Create gradient
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, obstacle.width/2);
        gradient.addColorStop(0, OBSTACLE_COLORS[0]);
        gradient.addColorStop(1, OBSTACLE_COLORS[2]);
        
        // Draw rock shape
        ctx.beginPath();
        ctx.moveTo(-obstacle.width/2, obstacle.height/3);
        ctx.lineTo(-obstacle.width/3, -obstacle.height/2);
        ctx.lineTo(obstacle.width/3, -obstacle.height/2);
        ctx.lineTo(obstacle.width/2, obstacle.height/3);
        ctx.closePath();
        
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.restore();
    }
}

// Add new function to check all obstacle collisions
function checkObstacleCollisions() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        const collision = checkCollision(ship, obstacle);
        
        if (collision) {
            health--;
            createParticles(ship.x + ship.width/2, ship.y + ship.height/2, '#FF0000', 20);
            SOUND_EFFECTS.damage.play();
            obstacles.splice(i, 1);
            
            if (health <= 0) {
                gameOver = true;
                SOUND_EFFECTS.gameOver.play();
                showGameOver();
            }
            break; // Only process one collision per frame
        }
    }
}

// Modify showGameOver to show menu again
function showGameOver() {
    const finalScore = score;
    document.getElementById('score').textContent = `Game Over! Final Score: ${finalScore}`;
    
    // Add visual effect
    ctx.save();
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    
    createExplosion(ship.x + ship.width/2, ship.y + ship.height/2);
    
    // Show menu after delay
    setTimeout(() => {
        document.getElementById('gameContainer').style.display = 'none';
        showMenu();
    }, 2000);
}

function createExplosion(x, y) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, 50, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 165, 0, 0.6)';
    ctx.fill();
    ctx.restore();
}

function drawShip() {
    ctx.save();
    ctx.translate(ship.x + ship.width/2, ship.y + ship.height/2);
    ctx.rotate(ship.rotation);
    
    // Draw ship hull
    ctx.beginPath();
    ctx.moveTo(-ship.width/2, ship.height/2);
    ctx.lineTo(0, -ship.height/2);
    ctx.lineTo(ship.width/2, ship.height/2);
    ctx.closePath();
    ctx.fillStyle = '#8B4513';
    ctx.fill();
    
    // Draw sail
    ctx.beginPath();
    ctx.moveTo(0, -ship.height/4);
    ctx.lineTo(0, -ship.height/2);
    ctx.lineTo(ship.width/3, -ship.height/4);
    ctx.closePath();
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    
    ctx.restore();
}

function drawWaves() {
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    
    for (let wave of waves) {
        wave.offset += 0.02;
        const y = canvas.height - wave.amplitude * 
                 Math.sin(wave.frequency * wave.x + wave.offset);
        ctx.lineTo(wave.x, y);
    }
    
    ctx.lineTo(canvas.width, canvas.height);
    ctx.fillStyle = '#4169E1';
    ctx.fill();
}

function generateTreasure() {
    if (treasures.length < 5) {
        treasures.push({
            x: Math.random() * (canvas.width - 30),
            y: Math.random() * (canvas.height - 100),
            width: 30,
            height: 30,
            rotation: Math.random() * Math.PI * 2
        });
    }
}

function drawTreasures() {
    treasures.forEach(treasure => {
        ctx.save();
        ctx.translate(treasure.x + treasure.width/2, treasure.y + treasure.height/2);
        ctx.rotate(treasure.rotation);
        
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(-treasure.width/2, -treasure.height/2, 
                    treasure.width, treasure.height);
        ctx.strokeStyle = '#B8860B';
        ctx.strokeRect(-treasure.width/2, -treasure.height/2, 
                      treasure.width, treasure.height);
        
        ctx.restore();
    });
}

function checkCollisions() {
    treasures = treasures.filter(treasure => {
        const collision = checkCollision(ship, treasure);
        if (collision) {
            score += 10 * scoreMultiplier;
            updateScore();
            SOUND_EFFECTS.coin.play();
            return false;
        }
        return true;
    });
}

// Fix checkObstacleCollision function 
function checkObstacleCollision(obstacle) {
    const collision = checkCollision(ship, obstacle);
           
    if (collision) {
        health--;
        createParticles(ship.x + ship.width/2, ship.y + ship.height/2, '#FF0000', 20);
        SOUND_EFFECTS.damage.play();
        
        // Remove obstacle after collision
        obstacles = obstacles.filter(o => o !== obstacle);
        
        if (health <= 0) {
            gameOver = true;
            SOUND_EFFECTS.gameOver.play();
            showGameOver();
        }
        return true;
    }
    return false;
}

function updateScore() {
    const scoreElement = document.getElementById('score');
    scoreElement.textContent = `Score: ${score}`;
}

// Update the update function to use new collision check
function update() {
    if (gameState !== GAME_STATES.PLAYING) return;
    
    // Update ship position
    ship.x += ship.dx;
    ship.y += ship.dy;
    
    // Boundary checks
    ship.x = Math.max(0, Math.min(ship.x, canvas.width - ship.width));
    ship.y = Math.max(0, Math.min(ship.y, canvas.height - ship.height));
    
    // Rotate ship based on movement
    if (ship.dx !== 0) {
        ship.rotation = ship.dx > 0 ? 0.1 : -0.1;
    } else {
        ship.rotation = 0;
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawWaves();
    drawShip();
    drawTreasures();
    drawObstacles();
    checkCollisions();
    checkObstacleCollisions(); // Add this line
    updateParticles();
    drawParticles();
    drawPowerups();
    
    // Draw health
    for (let i = 0; i < health; i++) {
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(10 + i * 30, 10, 20, 20);
    }
    
    // Draw multiplier
    if (scoreMultiplier > 1) {
        ctx.fillStyle = '#FFD700';
        ctx.font = '20px Arial';
        ctx.fillText(`${scoreMultiplier}x`, canvas.width - 50, 30);
    }
    
    requestAnimationFrame(update);
}

function moveShip(e) {
    if (gameOver) return;
    
    switch(e.key) {
        case 'ArrowLeft':
            ship.dx = -SHIP_SPEED;
            break;
        case 'ArrowRight':
            ship.dx = SHIP_SPEED;
            break;
        case 'ArrowUp':
            ship.dy = -SHIP_SPEED;
            break;
        case 'ArrowDown':
            ship.dy = SHIP_SPEED;
            break;
    }
}

function stopShip(e) {
    switch(e.key) {
        case 'ArrowLeft':
        case 'ArrowRight':
            ship.dx = 0;
            ship.rotation = 0;
            break;
        case 'ArrowUp':
        case 'ArrowDown':
            ship.dy = 0;
            break;
    }
}

function increaseDifficulty() {
    if (!gameOver) {
        difficulty += 0.2;
        currentObstacleSpeed *= 1.1;
    }
}

function generatePowerup() {
    if (!gameOver && powerups.length < 1) {
        powerups.push({
            x: Math.random() * (canvas.width - 30),
            y: -30,
            width: 30,
            height: 30,
            type: Math.random() < 0.5 ? 'health' : 'multiplier',
            dy: 2
        });
    }
}

function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x,
            y,
            dx: (Math.random() - 0.5) * 5,
            dy: (Math.random() - 0.5) * 5,
            radius: Math.random() * 3 + 1,
            alpha: 1,
            color
        });
    }
}

function updateParticles() {
    particles.forEach((particle, index) => {
        particle.x += particle.dx;
        particle.y += particle.dy;
        particle.alpha -= 0.02;
        
        if (particle.alpha <= 0) {
            particles.splice(index, 1);
        }
    });
}

function drawParticles() {
    particles.forEach(particle => {
        ctx.save();
        ctx.globalAlpha = particle.alpha;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

// Improve powerup visualization
function drawPowerups() {
    powerups.forEach((powerup, index) => {
        powerup.y += powerup.dy;
        
        if (powerup.y > canvas.height) {
            powerups.splice(index, 1);
            return;
        }
        
        ctx.save();
        // Create rainbow gradient
        const gradient = ctx.createRadialGradient(
            powerup.x + powerup.width/2, 
            powerup.y + powerup.height/2, 
            0,
            powerup.x + powerup.width/2, 
            powerup.y + powerup.height/2, 
            powerup.width/2
        );
        
        if (powerup.type === 'health') {
            gradient.addColorStop(0, '#FF69B4');
            gradient.addColorStop(0.5, '#FF1493');
            gradient.addColorStop(1, '#FF0000');
        } else {
            gradient.addColorStop(0, '#FFD700');
            gradient.addColorStop(0.5, '#FFA500');
            gradient.addColorStop(1, '#FF8C00');
        }
        
        // Draw glowing circle
        ctx.beginPath();
        ctx.arc(
            powerup.x + powerup.width/2, 
            powerup.y + powerup.height/2,
            powerup.width/2,
            0,
            Math.PI * 2
        );
        
        // Add glow effect
        ctx.shadowColor = powerup.type === 'health' ? '#FF69B4' : '#FFD700';
        ctx.shadowBlur = 15;
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Draw icon
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
            powerup.type === 'health' ? '❤️' : '⭐',
            powerup.x + powerup.width/2,
            powerup.y + powerup.height/2
        );
        
        ctx.restore();
        
        if (checkCollision(ship, powerup)) {
            if (powerup.type === 'health') {
                health = Math.min(HEALTH_MAX, health + 1);
            } else {
                scoreMultiplier *= 2;
                setTimeout(() => scoreMultiplier = 1, 5000);
            }
            powerups.splice(index, 1);
            SOUND_EFFECTS.collect.play();
            createParticles(powerup.x + powerup.width/2, powerup.y + powerup.height/2, 
                          powerup.type === 'health' ? '#FF69B4' : '#FFD700', 
                          15);
        }
    });
}

function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj2.height > obj2.y;
}

function restart() {
    if (gameOver) {
        initGame();
    }
}

function showMenu() {
    gameState = GAME_STATES.MENU;
    document.getElementById('menu').style.display = 'flex';
}

document.addEventListener('keydown', e => {
    if (e.key === 'r' && gameOver) {
        restart();
    }
});


// Add after your existing event listeners
document.getElementById('playButton').addEventListener('click', () => {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';
    initGame();
});

// Remove the automatic game start
document.removeEventListener('DOMContentLoaded', initGame);
document.addEventListener('DOMContentLoaded', showMenu);
