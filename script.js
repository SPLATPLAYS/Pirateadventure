// Constants
let SHIP_SPEED = 5;
let baseShipSpeed = 5;
const WAVE_HEIGHT = 20;
let TREASURE_SPAWN_INTERVAL = 3000;
let OBSTACLE_SPAWN_INTERVAL = 4000;
const OBSTACLE_SPEED = 2;
const MIN_OBSTACLE_SIZE = 30;
const MAX_OBSTACLE_SIZE = 50;
const OBSTACLE_COLORS = ['#FF4444', '#FF6B6B', '#FA8072'];
const POWERUP_SPAWN_INTERVAL = 10000;
const DIFFICULTY_INCREASE_INTERVAL = 20000;
const HEALTH_MAX = 3
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

const POWERUP_TYPES = {
    HEALTH: {type: 'health', icon: '❤️', color: '#FF69B4'},
    SPEED: {type: 'speed', icon: '⚡', color: '#00FF00'},
    SHIELD: {type: 'shield', icon: '🛡️', color: '#4169E1'},
    MULTIPLIER: {type: 'multiplier', icon: '⭐', color: '#FFD700'},
    MAGNET: {type: 'magnet', icon: '🧲', color: '#8B4513'},
    TIME_SLOW: {type: 'timeSlow', icon: '⏰', color: '#4B0082'}
};

const SCORE_EVENTS = {
    TREASURE: 10,
    POWERUP: 25,
    SURVIVE_TIME: 1
};

const DAY_CYCLE_DURATION = 60000; // 1 minute per day cycle
const WEATHER_STATES = {
    CLEAR: 'clear',
    RAIN: 'rain',
    STORM: 'storm'
};

const API_BASE = 'https://my-own-counter-api-production.up.railway.app';
const NAMESPACE = 'pirateadventure'; // Unique namespace for the game
const LEADERBOARD_SIZE = 5; // Number of top scores to show
const MAX_LEADERBOARD_SIZE = 10;
const SCORE_BUCKET_SIZE = 100;
const MAX_SCORES = 10;
const LEADERBOARD_KEY = `${NAMESPACE}_scores`; // Key for storing all scores

let highScore = localStorage.getItem('highScore') || 0;

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
let gameIntervals = [];
let dayTime = 0; // 0 to 1 (0 = midnight, 0.5 = noon)
let weather = WEATHER_STATES.CLEAR;
let raindrops = [];
let combo = 0;
let comboTimer = 0;
let achievements = [];

// Add these debug functions at the top
const DEBUG = true;
function log(...args) {
    if (DEBUG) console.log(...args);
}

// Add these constants
const LEADERBOARD_CACHE_KEY = 'pirateLeaderboardCache';
const LEADERBOARD_CACHE_DURATION = 60000; // 1 minute

function initGame() {
    // Clear any existing intervals
    gameIntervals.forEach(interval => clearInterval(interval));
    gameIntervals = [];
    
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
    dayTime = 0;
    weather = WEATHER_STATES.CLEAR;
    raindrops = [];
    combo = 0;
    comboTimer = 0;

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

    // Store intervals for cleanup
    gameIntervals.push(setInterval(generateTreasure, TREASURE_SPAWN_INTERVAL));
    gameIntervals.push(setInterval(generateObstacle, OBSTACLE_SPAWN_INTERVAL));
    gameIntervals.push(setInterval(increaseDifficulty, DIFFICULTY_INCREASE_INTERVAL));
    gameIntervals.push(setInterval(generatePowerup, POWERUP_SPAWN_INTERVAL));
    gameIntervals.push(setInterval(updateDayCycle, 100));
    gameIntervals.push(setInterval(updateWeather, 30000));
    
    requestAnimationFrame(update);
    updateLeaderboard(); // Load initial leaderboard
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
    if (ship.hasShield) return; // Skip if shield active
    
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        if (checkCollision(ship, obstacle)) {
            health--;
            createParticles(ship.x + ship.width/2, ship.y + ship.height/2, '#FF0000', 20);
            SOUND_EFFECTS.damage.play();
            obstacles.splice(i, 1);
            
            if (health <= 0) {
                endGame();
            }
            break;
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
    ctx.translate(ship.x + ship.width / 2, ship.y + ship.height / 2);
    ctx.rotate(ship.rotation);

    // Draw wake effect
    ctx.beginPath();
    ctx.moveTo(-ship.width / 2, ship.height / 2);
    ctx.quadraticCurveTo(
        -ship.width,
        ship.height,
        -ship.width * 1.5,
        ship.height * 1.2
    );
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.stroke();
    ctx.closePath(); // Close the wake path

    // Draw ship body
    ctx.beginPath();
    ctx.moveTo(-ship.width / 2, ship.height / 2);
    ctx.lineTo(0, -ship.height / 2);
    ctx.lineTo(ship.width / 2, ship.height / 2);
    ctx.closePath();
    ctx.fillStyle = '#8B4513';
    ctx.fill();

    // Add flag
    ctx.beginPath();
    ctx.moveTo(0, -ship.height / 2);
    ctx.lineTo(-15, -ship.height / 2 - 15);
    ctx.lineTo(0, -ship.height / 2 - 10);
    ctx.closePath(); // Close the flag path
    ctx.fillStyle = '#FF0000';
    ctx.fill();

    // Draw shield if active
    if (ship.hasShield) {
        ctx.beginPath();
        ctx.arc(0, 0, ship.width, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(65,105,225,0.5)';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.closePath(); // Close the shield path
    }

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

// Add this helper function
function playSound(soundName) {
    const sound = SOUND_EFFECTS[soundName].cloneNode();
    sound.play();
}

// Modify checkCollisions function
function checkCollisions() {
    treasures = treasures.filter(treasure => {
        const collision = checkCollision(ship, treasure);
        if (collision) {
            comboTimer = 60; // 1 second at 60fps
            combo++;
            updateScore(SCORE_EVENTS.TREASURE * (1 + combo * 0.5));
            playSound('coin');
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

function updateScore(points) {
    score += points * scoreMultiplier;
    if(score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
    }
    updateScoreDisplay();
}

function updateScoreDisplay() {
    document.getElementById('score').innerHTML = 
        `Score: ${score}<br>High Score: ${highScore}`;
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
    drawEnvironment();
    drawWaves();
    drawShip();
    drawTreasures();
    drawObstacles();
    checkCollisions();
    checkObstacleCollisions(); // Add this line
    updateParticles();
    drawParticles();
    drawPowerups();
    updateCombo();
    
    // Draw UI elements
    drawUI();
    
    if (!gameOver) {
        requestAnimationFrame(update);
    }
}

// Separate UI drawing for cleaner code
function drawUI() {
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
        OBSTACLE_SPAWN_INTERVAL = Math.max(2000, OBSTACLE_SPAWN_INTERVAL - 100);
        TREASURE_SPAWN_INTERVAL = Math.max(1500, TREASURE_SPAWN_INTERVAL - 50);
        
        // Add special effects at difficulty milestones
        if(Math.floor(difficulty) > Math.floor(difficulty - 0.2)) {
            createParticles(canvas.width/2, canvas.height/2, '#FFD700', 30);
            playSound('levelUp');
        }
    }
}

function generatePowerup() {
    if (!gameOver && powerups.length < 1) {
        // Get all powerup types from POWERUP_TYPES
        const powerupTypes = Object.values(POWERUP_TYPES);
        const randomPowerup = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
        
        powerups.push({
            x: Math.random() * (canvas.width - 30),
            y: -30,
            width: 30,
            height: 30,
            type: randomPowerup.type,
            icon: randomPowerup.icon,
            color: randomPowerup.color,
            dy: 2
        });
    }
}

// Update drawPowerups to use the new powerup properties
function drawPowerups() {
    for (let i = powerups.length - 1; i >= 0; i--) {
        const powerup = powerups[i];
        powerup.y += powerup.dy;
        
        if (powerup.y > canvas.height) {
            powerups.splice(i, 1);
            continue;
        }
        
        ctx.save();
        // Create gradient
        const gradient = ctx.createRadialGradient(
            powerup.x + powerup.width/2, 
            powerup.y + powerup.height/2, 
            0,
            powerup.x + powerup.width/2, 
            powerup.y + powerup.height/2, 
            powerup.width/2
        );
        
        gradient.addColorStop(0, powerup.color);
        gradient.addColorStop(1, '#FFFFFF');
        
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
        ctx.shadowColor = powerup.color;
        ctx.shadowBlur = 15;
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Draw icon
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
            powerup.icon,
            powerup.x + powerup.width/2,
            powerup.y + powerup.height/2
        );
        
        ctx.restore();
        
        if (checkCollision(ship, powerup)) {
            applyPowerup(powerup);
            powerups.splice(i, 1);
            SOUND_EFFECTS.collect.play();
            createParticles(
                powerup.x + powerup.width/2, 
                powerup.y + powerup.height/2,
                powerup.color,
                15
            );
        }
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

function applyPowerup(powerup) {
    switch(powerup.type) {
        case 'health':
            health = Math.min(HEALTH_MAX, health + 1);
            break;
        case 'speed':
            const currentSpeed = SHIP_SPEED;
            SHIP_SPEED = baseShipSpeed * 1.5;
            setTimeout(() => {
                SHIP_SPEED = baseShipSpeed;
            }, 5000);
            break;
        case 'shield':
            ship.hasShield = true;
            setTimeout(() => ship.hasShield = false, 8000);
            break;
        case 'multiplier':
            scoreMultiplier *= 2;
            setTimeout(() => scoreMultiplier = 1, 5000);
            break;
        case 'magnet':
            const magnetEffect = setInterval(() => {
                treasures.forEach(treasure => {
                    const dx = ship.x - treasure.x;
                    const dy = ship.y - treasure.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 200) {
                        treasure.x += dx * 0.1;
                        treasure.y += dy * 0.1;
                    }
                });
            }, 16);
            setTimeout(() => clearInterval(magnetEffect), 5000);
            break;
        case 'timeSlow':
            const oldObstacleSpeed = currentObstacleSpeed;
            currentObstacleSpeed *= 0.5;
            setTimeout(() => currentObstacleSpeed = oldObstacleSpeed, 5000);
            break;
    }
}

function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj2.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj2.height > obj2.y; // Fixed y-axis check
}

function restart() {
    if (gameOver) {
        initGame();
    }
}

function endGame() {
    gameOver = true;
    SOUND_EFFECTS.gameOver.play();
    gameIntervals.forEach(interval => clearInterval(interval));
    gameIntervals = [];
    
    // Save score to leaderboard if it's above 0
    if (score > 0) {
        saveScore(score);
    }
    
    showGameOver();
    updateLeaderboard();
}

function showMenu() {
    gameState = GAME_STATES.MENU;
    document.getElementById('menu').style.display = 'flex';
    updateLeaderboard();
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

function updateDayCycle() {
    dayTime = (dayTime + 0.1/600) % 1;
}

function updateWeather() {
    if (Math.random() < 0.3) {
        weather = Object.values(WEATHER_STATES)[Math.floor(Math.random() * 3)];
        if (weather !== WEATHER_STATES.CLEAR) {
            createRaindrops();
        }
    }
}

function createRaindrops() {
    if (weather === WEATHER_STATES.RAIN || weather === WEATHER_STATES.STORM) {
        for (let i = 0; i < 5; i++) {
            raindrops.push({
                x: Math.random() * canvas.width,
                y: -10,
                speed: weather === WEATHER_STATES.STORM ? 15 : 10,
                length: weather === WEATHER_STATES.STORM ? 20 : 10
            });
        }
    }
}

function drawEnvironment() {
    // Draw sky gradient based on time of day
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    
    if (dayTime < 0.25 || dayTime > 0.75) { // Night
        gradient.addColorStop(0, '#000033');
        gradient.addColorStop(1, '#000066');
    } else { // Day
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#4169E1');
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw weather effects
    if (weather !== WEATHER_STATES.CLEAR) {
        updateRain();
    }
}

function updateRain() {
    ctx.strokeStyle = 'rgba(174, 194, 224, 0.5)';
    ctx.lineWidth = 1;
    
    for (let i = raindrops.length - 1; i >= 0; i--) {
        const drop = raindrops[i];
        
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x + (weather === WEATHER_STATES.STORM ? 5 : 0), 
                  drop.y + drop.length);
        ctx.stroke();
        
        drop.y += drop.speed;
        drop.x += weather === WEATHER_STATES.STORM ? 2 : 0;
        
        if (drop.y > canvas.height) {
            raindrops.splice(i, 1);
        }
    }
}

function updateCombo() {
    if (comboTimer > 0) {
        comboTimer--;
    } else if (combo > 0) {
        combo = 0;
    }
}

function getBucketKey(score) {
    return Math.floor(score / SCORE_BUCKET_SIZE);
}

// Modify saveScore function 
async function saveScore(score) {
    try {
        if (score <= 0) return;
        
        // Get existing scores
        const scores = await getLeaderboard();
        scores.push(score);
        scores.sort((a, b) => b - a);
        scores.splice(MAX_SCORES); // Keep only top 10

        // Reset all score counters using URL parameters
        for(let i = 0; i < MAX_SCORES; i++) {
            await fetch(`${API_BASE}/set/${NAMESPACE}/score${i}?value=${scores[i] || 0}`, {
                method: 'PUT'
            });
        }

        // Update cache
        localStorage.setItem(LEADERBOARD_CACHE_KEY, JSON.stringify({
            scores,
            timestamp: Date.now()
        }));

        await updateLeaderboard();
    } catch (error) {
        log('Error saving score:', error);
    }
}

// Modify getLeaderboard function
async function getLeaderboard() {
    try {
        const cache = JSON.parse(localStorage.getItem(LEADERBOARD_CACHE_KEY) || '{"scores":[], "timestamp":0}');
        const now = Date.now();

        if (now - cache.timestamp < LEADERBOARD_CACHE_DURATION) {
            return cache.scores;
        }

        const scores = [];
        // Fetch individual score counters
        for(let i = 0; i < MAX_SCORES; i++) {
            const response = await fetch(`${API_BASE}/get/${NAMESPACE}/score${i}`);
            const data = await response.json();
            log(`Score ${i}:`, data); // Debug log
            if (data && typeof data.count === 'number' && data.count > 0) { // Changed value to count
                scores.push(data.count);
            }
        }

        scores.sort((a, b) => b - a);
        log('Sorted scores:', scores); // Debug log

        localStorage.setItem(LEADERBOARD_CACHE_KEY, JSON.stringify({
            scores,
            timestamp: now
        }));

        return scores;
    } catch (error) {
        log('Error fetching leaderboard:', error);
        return [];
    }
}

// Modify updateLeaderboard function
async function updateLeaderboard() {
    const leaderboardEl = document.getElementById('leaderboard');
    if (!leaderboardEl) return;

    try {
        const scores = await getLeaderboard();
        log('Fetched scores:', scores);
        
        if (!scores || scores.length === 0) {
            leaderboardEl.innerHTML = `
                <h2>High Scores</h2>
                <div class="score-entry">No scores yet!</div>
            `;
            return;
        }

        // Format scores list with medal colors
        const scoresList = scores
            .filter(score => score > 0)
            .map((score, index) => `
                <div class="score-entry ${getMedalClass(index)}">
                    ${index + 1}. ${score} pts
                </div>
            `).join('');

        leaderboardEl.innerHTML = `
            <h2>High Scores</h2>
            ${scoresList || '<div class="score-entry">No scores yet!</div>'}
        `;
        
        log('Updated leaderboard HTML:', leaderboardEl.innerHTML);
    } catch (err) {
        log('Error updating leaderboard:', err);
        leaderboardEl.innerHTML = `
            <h2>High Scores</h2>
            <div class="score-entry">Error loading scores</div>
        `;
    }
}

// Add helper function for medal classes
function getMedalClass(index) {
    switch(index) {
        case 0: return 'gold-medal';
        case 1: return 'silver-medal';
        case 2: return 'bronze-medal';
        default: return '';
    }
}
