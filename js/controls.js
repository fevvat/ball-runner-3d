// ===== CONTROLS SYSTEM =====
// Klavye + Fare + Mobil kontrolleri

const Controls = {
    keys: {},
    mouse: { x: 0, y: 0, dx: 0, dy: 0 },
    platformTilt: { x: 0, z: 0 },
    moveForce: { x: 0, z: 0 },
    jumpRequested: false,
    jumpHeld: false,
    isMobile: false,
    joystick: { active: false, dx: 0, dy: 0 },
    locked: false,
    sensitivity: 0.004,

    init() {
        this.isMobile = /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent) ||
                        ('ontouchstart' in window);

        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Space') {
                e.preventDefault();
                this.jumpRequested = true;
                this.jumpHeld = true;
            }
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            if (e.code === 'Space') {
                this.jumpHeld = false;
            }
        });

        const canvas = document.getElementById('gameCanvas');
        // Pointer lock sadece masaüstünde
        if (!this.isMobile) {
            canvas.addEventListener('click', () => {
                if (!this.locked && typeof Game !== 'undefined' && Game.state === 'playing') {
                    canvas.requestPointerLock();
                }
            });
        }

        document.addEventListener('pointerlockchange', () => {
            this.locked = !!document.pointerLockElement;
        });

        document.addEventListener('mousemove', (e) => {
            if (this.locked) {
                this.mouse.dx = e.movementX;
                this.mouse.dy = e.movementY;
            }
        });

        if (this.isMobile) {
            this._initMobileControls();
        }
    },

    _initMobileControls() {
        document.getElementById('mobile-controls').style.display = 'none';

        const joystickZone = document.getElementById('joystick-zone');
        const joystickStick = document.getElementById('joystick-stick');
        const jumpBtn = document.getElementById('mobile-jump');

        let touchId = null;
        let startX = 0, startY = 0;
        const maxDist = 40;

        joystickZone.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            touchId = touch.identifier;
            startX = touch.clientX;
            startY = touch.clientY;
            this.joystick.active = true;
        }, { passive: false });

        joystickZone.addEventListener('touchmove', (e) => {
            e.preventDefault();
            for (const touch of e.changedTouches) {
                if (touch.identifier === touchId) {
                    let dx = touch.clientX - startX;
                    let dy = touch.clientY - startY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > maxDist) {
                        dx = (dx / dist) * maxDist;
                        dy = (dy / dist) * maxDist;
                    }
                    this.joystick.dx = dx / maxDist;
                    this.joystick.dy = dy / maxDist;
                    joystickStick.style.transform = `translate(${dx}px, ${dy}px)`;
                }
            }
        }, { passive: false });

        const resetJoystick = () => {
            touchId = null;
            this.joystick.active = false;
            this.joystick.dx = 0;
            this.joystick.dy = 0;
            joystickStick.style.transform = '';
        };

        joystickZone.addEventListener('touchend', resetJoystick);
        joystickZone.addEventListener('touchcancel', resetJoystick);

        jumpBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.jumpRequested = true;
            this.jumpHeld = true;
        });
        jumpBtn.addEventListener('touchend', () => {
            this.jumpHeld = false;
        });

        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', (e) => {
                if (e.gamma != null && e.beta != null) {
                    this.platformTilt.x = (e.beta - 30) * 0.02;
                    this.platformTilt.z = e.gamma * 0.02;
                }
            });
        }
    },

    update(delta) {
        const force = 38;
        // Havada azaltılmış kontrol
        const airControl = 0.45;
        const isOnGround = Physics.ballBody && Physics.ballBody.onGround;
        const controlMult = isOnGround ? 1 : airControl;

        this.moveForce.x = 0;
        this.moveForce.z = 0;

        // Klavye
        if (this.keys['KeyW'] || this.keys['ArrowUp']) this.moveForce.z = -force;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) this.moveForce.z = force;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) this.moveForce.x = -force;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) this.moveForce.x = force;

        // Çapraz normalleştirme
        if (this.moveForce.x !== 0 && this.moveForce.z !== 0) {
            const diag = 1 / Math.sqrt(2);
            this.moveForce.x *= diag;
            this.moveForce.z *= diag;
        }

        // Havada kontrol azaltması
        this.moveForce.x *= controlMult;
        this.moveForce.z *= controlMult;

        // Mobil joystick
        if (this.joystick.active) {
            this.moveForce.x = this.joystick.dx * force * controlMult;
            this.moveForce.z = this.joystick.dy * force * controlMult;
        }

        // Fare ile platform eğme
        if (this.locked) {
            this.platformTilt.x += this.mouse.dy * this.sensitivity;
            this.platformTilt.z += this.mouse.dx * this.sensitivity;
            this.platformTilt.x = Math.max(-0.4, Math.min(0.4, this.platformTilt.x));
            this.platformTilt.z = Math.max(-0.4, Math.min(0.4, this.platformTilt.z));
            this.platformTilt.x *= 0.92;
            this.platformTilt.z *= 0.92;
        }

        this.mouse.dx = 0;
        this.mouse.dy = 0;

        if (Physics.ballBody) {
            const ball = Physics.ballBody;
            const speedMult = (typeof Game !== 'undefined' ? Game.speedMultiplier : 1) || 1;

            ball.vel.x += this.moveForce.x * delta * speedMult;
            ball.vel.z += this.moveForce.z * delta * speedMult;

            // Hız limiti
            const maxVel = 18 * speedMult;
            const currentSpeed = Math.sqrt(ball.vel.x * ball.vel.x + ball.vel.z * ball.vel.z);
            if (currentSpeed > maxVel) {
                const ratio = maxVel / currentSpeed;
                ball.vel.x *= ratio;
                ball.vel.z *= ratio;
            }

            // Zıplama - double jump desteği
            if (this.jumpRequested && ball.jumpsLeft > 0) {
                if (ball.onGround) {
                    ball.vel.y = 11;
                    ball.jumpsLeft--;
                    AudioSystem.playJump();
                } else if (ball.jumpsLeft < ball.maxJumps) {
                    // Havada ikinci zıplama - biraz daha zayıf
                    ball.vel.y = 9;
                    ball.jumpsLeft--;
                    AudioSystem.playJump();
                    // Double jump parçacık efekti
                    if (typeof ParticleSystem !== 'undefined') {
                        ParticleSystem.emit(ball.pos, {
                            count: 8, color: 0x4d96ff, size: 0.08,
                            speed: 3, lifetime: 0.4, gravity: -1, type: 'ring'
                        });
                    }
                }
            }
            this.jumpRequested = false;

            // Jump cut - Space bırakılınca zıplama kesilir (kısa zıplama)
            if (!this.jumpHeld && ball.vel.y > 4 && !ball.onGround) {
                ball.vel.y *= 0.85;
            }
        }
    },

    reset() {
        this.keys = {};
        this.mouse = { x: 0, y: 0, dx: 0, dy: 0 };
        this.platformTilt = { x: 0, z: 0 };
        this.moveForce = { x: 0, z: 0 };
        this.jumpRequested = false;
        this.jumpHeld = false;
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
    }
};
