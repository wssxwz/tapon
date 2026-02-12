class TapOnGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.level = 1;
        this.bestScore = parseInt(localStorage.getItem('tapon_best') || '0');
        this.isPlaying = false;
        this.isRotating = false;
        this.rotation = 0;
        this.baseRotationSpeed = 0.08; // base speed - much faster!
        this.rotationSpeed = 0.08; // current speed
        
        // Circle dimensions
        this.centerX = 0;
        this.centerY = 0;
        this.outerRadius = 150;
        this.innerRadius = 100;
        this.ballRadius = 12;
        
        // Target zone (special area)
        this.targetStartAngle = 0;
        this.targetEndAngle = 0;
        
        this.setupCanvas();
        this.setupControls();
        this.updateBestScore();
        this.calculateTargetZone();
    }

    setupCanvas() {
        // Mobile-friendly sizing
        const maxSize = 500;
        const padding = 40; // Safe padding for mobile
        const availableWidth = window.innerWidth - padding;
        const availableHeight = window.innerHeight - padding - 100; // Extra space for text
        
        const size = Math.min(availableWidth, availableHeight, maxSize);
        
        this.canvas.width = size;
        this.canvas.height = size;
        this.centerX = size / 2;
        this.centerY = size / 2;
        
        // Scale circle size for smaller screens
        if (size < 400) {
            const scale = size / 400;
            this.outerRadius = 150 * scale;
            this.innerRadius = 100 * scale;
            this.ballRadius = 12 * scale;
        }
        
        // Add resize handler
        window.addEventListener('resize', () => this.handleResize());
    }
    
    handleResize() {
        // Recalculate canvas size on orientation change
        const maxSize = 500;
        const padding = 40;
        const availableWidth = window.innerWidth - padding;
        const availableHeight = window.innerHeight - padding - 100;
        
        const size = Math.min(availableWidth, availableHeight, maxSize);
        
        if (size !== this.canvas.width) {
            this.canvas.width = size;
            this.canvas.height = size;
            this.centerX = size / 2;
            this.centerY = size / 2;
            
            if (size < 400) {
                const scale = size / 400;
                this.outerRadius = 150 * scale;
                this.innerRadius = 100 * scale;
                this.ballRadius = 12 * scale;
            }
        }
    }

    setupControls() {
        // Click/Tap on canvas
        this.canvas.addEventListener('click', (e) => {
            console.log('Canvas clicked');
            this.handleInput();
        });
        
        // Touch on canvas
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            console.log('Canvas touched');
            this.handleInput();
        });
        
        // Spacebar
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.isPlaying) {
                e.preventDefault();
                console.log('Space pressed');
                this.handleInput();
            }
        });
    }

    calculateTargetZone() {
        // Level 1-10: progressively narrower target zone
        // Level 1: ~90 degrees (π/2 radians)
        // Level 10: ~15 degrees (just wider than ball)
        
        const maxAngle = Math.PI / 2; // 90 degrees
        const minAngle = Math.PI / 12; // 15 degrees
        
        const targetSize = maxAngle - ((maxAngle - minAngle) / 9) * Math.min(this.level - 1, 9);
        
        // Random position for target zone
        const randomStart = Math.random() * Math.PI * 2;
        this.targetStartAngle = randomStart;
        this.targetEndAngle = randomStart + targetSize;
        
        // Update rotation speed based on level
        // Level 1: 0.08 rad/frame (~4.6 deg/frame)
        // Level 10: 0.24 rad/frame (~13.8 deg/frame) - 3x faster!
        // Each level adds 25% more speed
        this.rotationSpeed = this.baseRotationSpeed * (1 + (this.level - 1) * 0.25);
        console.log(`Level ${this.level}: Speed = ${this.rotationSpeed.toFixed(3)} rad/frame`);
    }

    start() {
        document.getElementById('startScreen').classList.add('hidden');
        this.isPlaying = true;
        this.isRotating = true;
        this.rotation = 0;
        this.gameLoop();
    }

    restart() {
        this.level = 1;
        this.rotation = 0;
        this.calculateTargetZone();
        document.getElementById('gameOverScreen').classList.remove('show');
        this.isPlaying = true;
        this.isRotating = true;
        this.updateLevelDisplay();
        this.gameLoop();
    }

    handleInput() {
        console.log('handleInput called, isPlaying:', this.isPlaying, 'isRotating:', this.isRotating);
        
        if (!this.isPlaying || !this.isRotating) {
            console.log('Ignoring input - not in playing state');
            return;
        }
        
        this.isRotating = false;
        console.log('Stopped rotating at angle:', this.rotation);
        
        // Check if ball is in target zone
        const ballAngle = this.normalizeAngle(this.rotation);
        const targetStart = this.normalizeAngle(this.targetStartAngle);
        const targetEnd = this.normalizeAngle(this.targetEndAngle);
        
        let isInTarget = false;
        
        if (targetStart <= targetEnd) {
            isInTarget = ballAngle >= targetStart && ballAngle <= targetEnd;
        } else {
            // Target zone wraps around 0
            isInTarget = ballAngle >= targetStart || ballAngle <= targetEnd;
        }
        
        if (isInTarget) {
            this.success();
        } else {
            this.fail();
        }
    }

    success() {
        // Show success message
        const successScreen = document.getElementById('successScreen');
        successScreen.classList.add('show');
        
        setTimeout(() => {
            successScreen.classList.remove('show');
            this.nextLevel();
        }, 1000);
    }

    fail() {
        this.isPlaying = false;
        
        // Update best score
        if (this.level > this.bestScore) {
            this.bestScore = this.level;
            localStorage.setItem('tapon_best', this.bestScore.toString());
            this.updateBestScore();
        }
        
        // Show game over
        document.getElementById('finalLevel').textContent = this.level;
        document.getElementById('gameOverScreen').classList.add('show');
    }

    nextLevel() {
        this.level++;
        this.rotation = 0;
        this.calculateTargetZone();
        this.updateLevelDisplay();
        this.isRotating = true;
    }

    updateLevelDisplay() {
        document.getElementById('currentLevel').textContent = this.level;
    }

    updateBestScore() {
        document.getElementById('bestScore').textContent = this.bestScore;
    }

    normalizeAngle(angle) {
        while (angle < 0) angle += Math.PI * 2;
        while (angle >= Math.PI * 2) angle -= Math.PI * 2;
        return angle;
    }

    gameLoop() {
        if (!this.isPlaying) return;
        
        // Update
        if (this.isRotating) {
            this.rotation += this.rotationSpeed;
        }
        
        // Draw
        this.draw();
        
        requestAnimationFrame(() => this.gameLoop());
    }

    draw() {
        const ctx = this.ctx;
        
        // Clear canvas
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw track (light gray ring)
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, this.outerRadius, 0, Math.PI * 2);
        ctx.arc(this.centerX, this.centerY, this.innerRadius, 0, Math.PI * 2, true);
        ctx.fillStyle = '#7f8c9c';
        ctx.fill();
        
        // Draw target zone (dark area)
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, this.outerRadius, 
                this.targetStartAngle, this.targetEndAngle);
        ctx.arc(this.centerX, this.centerY, this.innerRadius, 
                this.targetEndAngle, this.targetStartAngle, true);
        ctx.closePath();
        ctx.fillStyle = '#2d3e50';
        ctx.fill();
        
        // Draw ball (using emoji-style circle for now)
        const ballDistance = (this.outerRadius + this.innerRadius) / 2;
        const ballX = this.centerX + Math.cos(this.rotation) * ballDistance;
        const ballY = this.centerY + Math.sin(this.rotation) * ballDistance;
        
        // Draw ball with gradient (fire-like)
        const gradient = ctx.createRadialGradient(ballX, ballY, 0, ballX, ballY, this.ballRadius);
        gradient.addColorStop(0, '#ffeb3b');
        gradient.addColorStop(0.3, '#ff9800');
        gradient.addColorStop(0.6, '#ff5722');
        gradient.addColorStop(1, '#e91e63');
        
        ctx.beginPath();
        ctx.arc(ballX, ballY, this.ballRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Add white highlight
        ctx.beginPath();
        ctx.arc(ballX - 3, ballY - 3, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();
    }
}

// Initialize game
const game = new TapOnGame();
