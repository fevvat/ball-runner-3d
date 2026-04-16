// ===== MAIN GAME =====
// Ana oyun döngüsü ve tüm sistemlerin entegrasyonu

const Game = {
    state: 'menu',
    scene: null,
    camera: null,
    renderer: null,
    clock: null,

    // Oyun verileri
    score: 0,
    distance: 0,
    lives: 3,
    coins: 0,
    combo: 1,
    maxCombo: 1,
    comboTimer: 0,
    speedMultiplier: 1,
    magnetActive: false,
    levelData: null,
    currentLevel: 1,
    gameTime: 0,
    lastSafeZ: 0,
    lastSafeY: 2,
    checkpointZ: null,
    checkpointY: null,
    checkpointPos: null,
    checkpointMeshes: [],

    // Screen shake
    shakeIntensity: 0,
    shakeDecay: 0.9,

    // Invincibility
    invincible: false,
    invincibleTimer: 0,

    // Slow motion
    slowMotion: 1,
    slowMotionTarget: 1,

    // Three.js objeleri
    ballMesh: null,
    ballGlow: null,
    ballLight: null,
    platformMeshes: [],
    coinMeshes: [],
    finishMesh: null,

    // Kamera hedefleri (GC önlemek için bir kez oluştur)
    _lookTarget: null,
    _cameraTargetFov: 60,
    _worldVec: null,

    // Cached DOM elements
    _hudScore: null,
    _hudDistance: null,

    // Ses açık/kapalı
    soundEnabled: true,
    musicEnabled: true,

    init() {
        const canvas = document.getElementById('gameCanvas');
        this.renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: false
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
        this.camera.position.set(0, 8, 10);
        this.camera.lookAt(0, 0, 0);
        this.clock = new THREE.Clock();
        this._lookTarget = new THREE.Vector3();
        this._worldVec = new THREE.Vector3();

        // Cache DOM
        this._hudScore = document.getElementById('hud-score');
        this._hudDistance = document.getElementById('hud-distance');

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        Controls.init();
        Minimap.init();
        UI.init();
        this._simulateLoading();
    },

    _simulateLoading() {
        const fill = document.getElementById('loader-fill');
        const text = document.getElementById('loading-text');
        const steps = [
            { p: 20, t: 'Three.js yükleniyor...' },
            { p: 40, t: 'Fizik motoru hazırlanıyor...' },
            { p: 60, t: 'Level verileri okunuyor...' },
            { p: 80, t: 'Ses sistemi başlatılıyor...' },
            { p: 100, t: 'Hazır!' }
        ];
        let i = 0;
        const next = () => {
            if (i < steps.length) {
                fill.style.width = steps[i].p + '%';
                text.textContent = steps[i].t;
                i++;
                setTimeout(next, 300 + Math.random() * 200);
            } else {
                setTimeout(() => {
                    document.getElementById('loading-screen').style.display = 'none';
                    document.getElementById('main-menu').style.display = 'flex';
                    this._animateMenuBackground();
                }, 400);
            }
        };
        setTimeout(next, 500);
    },

    _menuScene: null,
    _menuCamera: null,
    _menuBalls: null,

    _animateMenuBackground() {
        if (!this._menuScene) {
            this._menuScene = new THREE.Scene();
            this._menuCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
            this._menuCamera.position.set(0, 5, 12);
            this._menuCamera.lookAt(0, 0, 0);

            this._menuScene.add(new THREE.AmbientLight(0x404060, 0.5));
            const light = new THREE.DirectionalLight(0x4d96ff, 1);
            light.position.set(5, 10, 5);
            this._menuScene.add(light);

            this._menuBalls = [];
            for (let i = 0; i < 8; i++) {
                const geo = new THREE.SphereGeometry(0.5 + Math.random() * 0.3, 16, 16);
                const mat = new THREE.MeshStandardMaterial({
                    color: new THREE.Color().setHSL(Math.random(), 0.7, 0.5),
                    metalness: 0.6, roughness: 0.2
                });
                const ball = new THREE.Mesh(geo, mat);
                ball.userData = {
                    angle: (i / 8) * Math.PI * 2,
                    radius: 4 + Math.random() * 2,
                    speed: 0.3 + Math.random() * 0.3,
                    yOff: Math.random() * 3
                };
                this._menuScene.add(ball);
                this._menuBalls.push(ball);
            }

            const platGeo = new THREE.BoxGeometry(10, 0.3, 10);
            const platMat = new THREE.MeshStandardMaterial({ color: 0x2a2a5e, metalness: 0.3 });
            const plat = new THREE.Mesh(platGeo, platMat);
            plat.position.y = -1;
            this._menuScene.add(plat);
            this._menuScene.fog = new THREE.Fog(0x0a0a2e, 10, 30);
        }

        const animateMenu = () => {
            if (this.state !== 'menu') return;
            requestAnimationFrame(animateMenu);
            const time = Date.now() * 0.001;
            this._menuBalls.forEach(ball => {
                const a = ball.userData.angle + time * ball.userData.speed;
                ball.position.x = Math.cos(a) * ball.userData.radius;
                ball.position.z = Math.sin(a) * ball.userData.radius;
                ball.position.y = Math.sin(time * 2 + ball.userData.yOff) * 1.5 + 1;
            });
            this.renderer.render(this._menuScene, this._menuCamera);
        };
        requestAnimationFrame(animateMenu);
    },

    shake(intensity) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    },

    start(level) {
        this.currentLevel = level;
        this.state = 'playing';
        this.score = 0;
        this.distance = 0;
        this.lives = 3;
        this.coins = 0;
        this.combo = 1;
        this.maxCombo = 1;
        this.comboTimer = 0;
        this.speedMultiplier = 1;
        this.magnetActive = false;
        this.gameTime = 0;
        this.lastSafeZ = 0;
        this.lastSafeY = 2;
        this.checkpointZ = null;
        this.checkpointY = null;
        this.checkpointPos = null;
        this.checkpointMeshes = [];
        this.shakeIntensity = 0;
        this.invincible = false;
        this.invincibleTimer = 0;
        this.slowMotion = 1;
        this.slowMotionTarget = 1;
        this._cameraTargetFov = 60;
        this.platformMeshes = [];
        this.coinMeshes = [];
        this.checkpointMeshes = [];

        this._clearScene();
        Physics.init();

        Obstacles.init(this.scene);
        ParticleSystem.init(this.scene);
        PowerUps.init(this.scene);

        this.levelData = Levels.build(level, this.scene);
        const theme = this.levelData.theme;

        // Tema dekorasyonlarını oluştur (DÜZELTME: daha önce hiç çağrılmıyordu)
        Levels.buildDecorations(this.scene, level);

        this.scene.background = new THREE.Color(theme.skyColor);
        this.scene.fog = new THREE.Fog(theme.fogColor, theme.fogNear, theme.fogFar);

        this.scene.add(new THREE.AmbientLight(theme.ambientColor, 0.6));

        const dirLight = new THREE.DirectionalLight(theme.lightColor, theme.lightIntensity);
        dirLight.position.set(10, 20, 10);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 80;
        dirLight.shadow.camera.left = -30;
        dirLight.shadow.camera.right = 30;
        dirLight.shadow.camera.top = 30;
        dirLight.shadow.camera.bottom = -30;
        this.scene.add(dirLight);
        this.scene.add(dirLight.target);
        this._dirLight = dirLight;

        this.scene.add(new THREE.HemisphereLight(theme.skyColor, theme.groundColor, 0.4));

        this._createBall(theme);

        this._buildPlatforms(this.levelData.platforms, theme);
        this._buildObstacles(this.levelData.obstacles, theme);
        this._buildCoins(this.levelData.coins);
        this._buildCheckpoints(this.levelData.checkpoints || []);
        for (const pu of this.levelData.powerups) {
            PowerUps.createPowerUp(pu.x, pu.y, pu.z, pu.type);
        }
        this._createFinish(this.levelData.finishPos);

        // Checkpointleri kayıt altına al
        this._checkpoints = this.levelData.checkpoints || [];
        this._nextCheckpointIdx = 0;

        if (this.soundEnabled || this.musicEnabled) {
            AudioSystem.init();
            AudioSystem.resume();
            AudioSystem.setPaused(false);
        }
        if (this.musicEnabled) {
            AudioSystem.startMusic(theme.musicTheme);
        }
        if (this.soundEnabled) {
            AudioSystem.startRollSound();
        }

        Minimap.setLevel(this.levelData.platforms, this.levelData.totalLength);
        Minimap.setFinishPos(this.levelData.finishPos);
        Minimap.setCheckpoints(this._checkpoints);

        const sp = this.levelData.startPos;
        Physics.ballBody.pos.x = sp.x;
        Physics.ballBody.pos.y = sp.y;
        Physics.ballBody.pos.z = sp.z;

        UI.hideMenu();
        UI.hideGameOver();
        UI.hideLevelComplete();
        UI.hidePause();
        UI.showHUD();
        UI.updateScore(0);
        UI.updateDistance(0);
        UI.updateLives(this.lives);

        this.clock.start();
        this._gameLoop();
    },

    _createBall(theme) {
        const geo = new THREE.SphereGeometry(0.5, 32, 32);
        const mat = new THREE.MeshStandardMaterial({
            color: 0x4d96ff,
            metalness: 0.8,
            roughness: 0.1,
            envMapIntensity: 1
        });
        this.ballMesh = new THREE.Mesh(geo, mat);
        this.ballMesh.castShadow = true;
        this.scene.add(this.ballMesh);

        const glowGeo = new THREE.SphereGeometry(0.6, 16, 16);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0x4d96ff,
            transparent: true,
            opacity: 0.15
        });
        this.ballGlow = new THREE.Mesh(glowGeo, glowMat);
        this.scene.add(this.ballGlow);

        this.ballLight = new THREE.PointLight(0x4d96ff, 0.8, 12);
        this.ballLight.castShadow = false;
        this.scene.add(this.ballLight);

        Physics.createBall(0, 2, 0, 0.5);
    },

    _buildPlatforms(platforms, theme) {
        for (const p of platforms) {
            let color = theme.platformColor;
            let emissiveIntensity = 0;
            let options = {};

            if (p.bounce) {
                color = 0x44cc44;
                emissiveIntensity = 0.3;
                options.isBounce = true;
            } else if (p.ice) {
                color = 0x88ccff;
                emissiveIntensity = 0.1;
                options.isIce = true;
                options.friction = 0.997;
            } else if (p.breakable) {
                color = 0xaa6633;
                emissiveIntensity = 0.05;
                options.isBreakable = true;
            }

            if (p.tiltX) options.tiltX = p.tiltX;
            if (p.tiltZ) options.tiltZ = p.tiltZ;
            if (p.rotating) {
                options.isRotating = true;
                options.rotateSpeed = p.rotateSpeed || 0.5;
            }
            if (p.moving) {
                options.isMoving = true;
                options.moveAxis = p.moveAxis || 'x';
                options.moveRange = p.moveRange || 2;
                options.moveSpeed = p.moveSpeed || 1;
                options.moveOffset = p.moveOffset || 0;
            }

            const geo = new THREE.BoxGeometry(p.w, p.h, p.d);
            const mat = new THREE.MeshStandardMaterial({
                color,
                metalness: 0.3,
                roughness: 0.6,
                emissive: new THREE.Color(color).multiplyScalar(emissiveIntensity)
            });

            if (p.ice) {
                mat.metalness = 0.6;
                mat.roughness = 0.05;
                mat.transparent = true;
                mat.opacity = 0.85;
            }

            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(p.x, p.y, p.z);
            mesh.receiveShadow = true;
            mesh.castShadow = true;
            if (p.tiltX) mesh.rotation.x = p.tiltX;
            if (p.tiltZ) mesh.rotation.z = p.tiltZ;

            this.scene.add(mesh);
            this.platformMeshes.push(mesh);

            const body = Physics.addStaticBox(p.x, p.y, p.z, p.w, p.h, p.d, options);
            body.mesh = mesh;
            body.extraMeshes = body.extraMeshes || [];

            if (p.bounce) {
                const stripGeo = new THREE.BoxGeometry(p.w * 0.8, 0.06, p.d * 0.8);
                const stripMat = new THREE.MeshBasicMaterial({ color: 0x88ff88, transparent: true, opacity: 0.7 });
                const strip = new THREE.Mesh(stripGeo, stripMat);
                strip.position.set(p.x, p.y + p.h / 2 + 0.04, p.z);
                this.scene.add(strip);
                this.platformMeshes.push(strip);
                body.extraMeshes.push({
                    mesh: strip,
                    offset: { x: 0, y: p.h / 2 + 0.04, z: 0 },
                    followRotation: true
                });
            }

            if (p.breakable) {
                const edgesGeo = new THREE.EdgesGeometry(geo);
                const edgesMat = new THREE.LineBasicMaterial({ color: 0xff4444, transparent: true, opacity: 0.6 });
                const edges = new THREE.LineSegments(edgesGeo, edgesMat);
                edges.position.copy(mesh.position);
                if (p.tiltX) edges.rotation.x = p.tiltX;
                if (p.tiltZ) edges.rotation.z = p.tiltZ;
                this.scene.add(edges);
                // Kırılan platform kenar mesh'ini body'ye bağla
                body.edgeMesh = edges;
                body.extraMeshes.push({
                    mesh: edges,
                    offset: { x: 0, y: 0, z: 0 },
                    followRotation: true
                });
                this.platformMeshes.push(edges);
            }
        }
    },

    _buildObstacles(obstacles, theme) {
        for (const obs of obstacles) {
            switch(obs.type) {
                case 'pendulum':
                    Obstacles.createPendulum(obs.x, obs.y, obs.z, {
                        speed: obs.speed || 1.5, phase: obs.phase || 0, color: theme.accentColor
                    });
                    break;
                case 'spinner':
                    Obstacles.createSpinner(obs.x, obs.y, obs.z, {
                        armLength: obs.armLength || 3, speed: obs.speed || 1,
                        arms: obs.arms || 2, color: 0xff6600
                    });
                    break;
                case 'wall':
                    Obstacles.createMovingWall(obs.x, obs.y, obs.z, {
                        width: obs.w || 2, height: obs.h || 2, depth: obs.d || 0.5,
                        speed: obs.speed || 1, range: obs.range || 3,
                        axis: obs.axis || 'x', phase: obs.phase || 0, color: 0xcc3333
                    });
                    break;
                case 'rising':
                    Obstacles.createRisingBlock(obs.x, obs.y, obs.z, {
                        speed: obs.speed || 1.5, range: obs.range || 2,
                        phase: obs.phase || 0, color: 0x9933cc
                    });
                    break;
                case 'laser':
                    Obstacles.createLaser(obs.x, obs.y, obs.z, {
                        width: obs.width || 6, speed: obs.speed || 1, phase: obs.phase || 0
                    });
                    break;
            }
        }
    },

    _buildCoins(coins) {
        for (const c of coins) {
            const geo = new THREE.TorusGeometry(0.3, 0.1, 8, 16);
            const mat = new THREE.MeshStandardMaterial({
                color: 0xffd93d, metalness: 0.8, roughness: 0.2, emissive: 0x332200
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(c.x, c.y, c.z);
            mesh.rotation.x = Math.PI / 2;
            this.scene.add(mesh);

            const trigger = Physics.addTrigger(c.x, c.y, c.z, 0.5, 'coin');
            trigger.mesh = mesh;
            this.coinMeshes.push({ mesh, trigger, baseY: c.y });
        }
    },

    _buildCheckpoints(checkpoints) {
        this.checkpointMeshes = [];

        checkpoints.forEach((cp, index) => {
            const group = new THREE.Group();

            const ringGeo = new THREE.TorusGeometry(0.8, 0.08, 10, 28);
            const ringMat = new THREE.MeshBasicMaterial({
                color: 0x6bcb77,
                transparent: true,
                opacity: 0.65
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.PI / 2;
            group.add(ring);

            const beamGeo = new THREE.CylinderGeometry(0.18, 0.6, 3.2, 16, 1, true);
            const beamMat = new THREE.MeshBasicMaterial({
                color: 0x6bcb77,
                transparent: true,
                opacity: 0.12,
                side: THREE.DoubleSide
            });
            const beam = new THREE.Mesh(beamGeo, beamMat);
            beam.position.y = 1.4;
            group.add(beam);

            const light = new THREE.PointLight(0x6bcb77, 0.65, 8);
            light.position.set(0, 1.2, 0);
            group.add(light);

            group.position.set(cp.x, cp.y + 0.35, cp.z);
            this.scene.add(group);

            const trigger = Physics.addTrigger(cp.x, cp.y + 0.8, cp.z, 1.1, 'checkpoint', {
                index,
                spawn: { x: cp.x, y: cp.y + 3, z: cp.z }
            });
            trigger.mesh = group;

            this.checkpointMeshes.push({
                group,
                ring,
                beam,
                light,
                trigger,
                baseY: group.position.y
            });
        });
    },

    _createFinish(pos) {
        const ringGeo = new THREE.TorusGeometry(2, 0.15, 8, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x6bcb77, transparent: true, opacity: 0.7 });
        this.finishMesh = new THREE.Mesh(ringGeo, ringMat);
        this.finishMesh.position.set(pos.x, pos.y + 1, pos.z);
        this.finishMesh.rotation.x = Math.PI / 2;
        this.scene.add(this.finishMesh);

        const pillarGeo = new THREE.CylinderGeometry(0.1, 2, 10, 16, 1, true);
        const pillarMat = new THREE.MeshBasicMaterial({
            color: 0x6bcb77, transparent: true, opacity: 0.08, side: THREE.DoubleSide
        });
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.set(pos.x, pos.y + 4, pos.z);
        this.scene.add(pillar);
        this._finishPillar = pillar;

        const finishLight = new THREE.PointLight(0x6bcb77, 1, 15);
        finishLight.position.set(pos.x, pos.y + 2, pos.z);
        this.scene.add(finishLight);

        Physics.addTrigger(pos.x, pos.y, pos.z, 2.5, 'finish');
    },

    _clearScene() {
        // Kırılan platform meshlerini de temizle
        while(this.scene && this.scene.children.length > 0) {
            const child = this.scene.children[0];
            this.scene.remove(child);
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => m.dispose());
                } else {
                    child.material.dispose();
                }
            }
            // Gruplardaki child'ları da dispose et
            if (child.children) {
                child.traverse(c => {
                    if (c.geometry) c.geometry.dispose();
                    if (c.material) {
                        if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
                        else c.material.dispose();
                    }
                });
            }
        }
        this.platformMeshes = [];
        this.coinMeshes = [];
        this.checkpointMeshes = [];
        Obstacles.clear();
        PowerUps.clear();
        ParticleSystem.clear();
        AudioSystem.stopMusic();
        AudioSystem.stopRollSound();
    },

    _gameLoop() {
        if (this.state !== 'playing') return;
        requestAnimationFrame(() => this._gameLoop());

        let delta = Math.min(this.clock.getDelta(), 0.05);
        const time = this.clock.getElapsedTime();

        this.slowMotion += (this.slowMotionTarget - this.slowMotion) * 0.1;
        delta *= this.slowMotion;
        this.gameTime += delta;

        if (this.invincible) {
            this.invincibleTimer -= delta;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
                if (this.ballMesh) this.ballMesh.visible = true;
            } else {
                if (this.ballMesh) {
                    this.ballMesh.visible = Math.sin(time * 20) > 0;
                }
            }
        }

        Controls.update(delta);

        const events = Physics.update(delta, time, Controls.platformTilt);

        if (events && events.length > 0) {
            for (const event of events) {
                this._handlePhysicsEvent(event);
                if (this.state !== 'playing') return;
            }
        }

        PowerUps.update(delta, time, this);
        Obstacles.update(time, delta);
        ParticleSystem.update(delta);

        for (const cp of this.checkpointMeshes) {
            if (!cp.group.visible && cp.trigger.collected) continue;

            cp.group.rotation.y += delta * 1.8;
            cp.group.position.y = cp.baseY + Math.sin(time * 2.5 + cp.trigger.data.index) * 0.12;
            cp.ring.rotation.z += delta * 2.2;
            cp.beam.material.opacity = cp.trigger.collected ? 0.04 : (0.08 + Math.sin(time * 3 + cp.trigger.data.index) * 0.04);
            cp.light.intensity = cp.trigger.collected ? 0.2 : (0.45 + Math.sin(time * 4 + cp.trigger.data.index) * 0.15);

            if (cp.trigger.collected) {
                cp.group.scale.lerp(new THREE.Vector3(0.75, 0.75, 0.75), 0.08);
            }
        }

        // Coin animasyonları
        for (const c of this.coinMeshes) {
            if (c.trigger.collected) {
                if (c.mesh.visible) c.mesh.visible = false;
                continue;
            }
            c.mesh.rotation.y += delta * 3;
            c.mesh.position.y = c.baseY + Math.sin(time * 2 + c.trigger.pos.x) * 0.2;
            c.trigger.pos.y = c.mesh.position.y;
        }

        // Bitiş efekti
        if (this.finishMesh) {
            this.finishMesh.rotation.z += delta * 2;
            this.finishMesh.material.opacity = 0.4 + Math.sin(time * 3) * 0.3;
            if (this._finishPillar) this._finishPillar.rotation.y -= delta * 0.5;
        }

        // Top güncelle
        if (this.ballMesh && Physics.ballBody) {
            const ball = Physics.ballBody;
            this.ballMesh.position.set(ball.pos.x, ball.pos.y, ball.pos.z);
            this.ballGlow.position.copy(this.ballMesh.position);
            this.ballLight.position.set(ball.pos.x, ball.pos.y + 1, ball.pos.z);

            const speed = Math.sqrt(ball.vel.x * ball.vel.x + ball.vel.z * ball.vel.z);
            if (speed > 0.1) {
                const rotAxis = new THREE.Vector3(-ball.vel.z, 0, ball.vel.x).normalize();
                this.ballMesh.rotateOnWorldAxis(rotAxis, speed * delta * 2);
            }

            const glowIntensity = Math.min(speed / 15, 1);
            this.ballGlow.material.opacity = 0.05 + glowIntensity * 0.25;
            const hue = 0.6 - glowIntensity * 0.4;
            this.ballMesh.material.color.setHSL(hue, 0.7, 0.55);
            this.ballGlow.material.color.setHSL(hue, 0.8, 0.5);
            this.ballLight.color.setHSL(hue, 0.8, 0.5);
            this.ballLight.intensity = 0.5 + glowIntensity * 1.5;

            if (speed > 3) {
                ParticleSystem.trail(ball.pos, this.ballMesh.material.color.getHex());
            }

            if (this.combo >= 3 && ball.onGround && speed > 2) {
                ParticleSystem.trail(
                    { x: ball.pos.x, y: ball.pos.y - 0.3, z: ball.pos.z },
                    0xffd93d
                );
            }

            if (this.soundEnabled) AudioSystem.updateRollSound(speed);

            // Güvenli pozisyon kaydet (yerde iken)
            if (ball.onGround) {
                this.lastSafeZ = ball.pos.z;
                this.lastSafeY = ball.pos.y;
            }

            this._cameraTargetFov = 60 + glowIntensity * 15;
        }

        // Mesafe skoru
        if (Physics.ballBody) {
            const newDist = Math.abs(Physics.ballBody.pos.z);
            if (newDist > this.distance) {
                this.score += (newDist - this.distance) * this.combo;
                this.distance = newDist;
            }
        }

        // Combo zamanlayıcı
        if (this.comboTimer > 0) {
            this.comboTimer -= delta;
            if (this.comboTimer <= 0) {
                this.combo = 1;
                UI.hideCombo();
            }
        }

        this._updateCamera(delta, time);

        if (this._dirLight && Physics.ballBody) {
            const bp = Physics.ballBody.pos;
            this._dirLight.position.set(bp.x + 10, bp.y + 20, bp.z + 10);
            this._dirLight.target.position.set(bp.x, bp.y, bp.z);
            this._dirLight.target.updateMatrixWorld();
        }

        // UI güncelle (cached refs)
        if (this._hudScore) this._hudScore.textContent = Math.floor(this.score);
        if (this._hudDistance) this._hudDistance.textContent = Math.floor(this.distance);

        if (Physics.ballBody) {
            Minimap.update(Physics.ballBody.pos, this.levelData.theme);
        }

        this.renderer.render(this.scene, this.camera);
    },

    _updateCamera(delta, time) {
        if (!Physics.ballBody) return;
        const ball = Physics.ballBody;

        const targetX = ball.pos.x * 0.4;
        const targetY = ball.pos.y + 7;
        const targetZ = ball.pos.z + 12;

        const lerpFactor = 1 - Math.exp(-5 * delta);
        this.camera.position.x += (targetX - this.camera.position.x) * lerpFactor;
        this.camera.position.y += (targetY - this.camera.position.y) * lerpFactor;
        this.camera.position.z += (targetZ - this.camera.position.z) * lerpFactor;

        if (this.shakeIntensity > 0.01) {
            this.camera.position.x += (Math.random() - 0.5) * this.shakeIntensity;
            this.camera.position.y += (Math.random() - 0.5) * this.shakeIntensity * 0.5;
            this.shakeIntensity *= this.shakeDecay;
        } else {
            this.shakeIntensity = 0;
        }

        const fovLerp = 1 - Math.exp(-3 * delta);
        this.camera.fov += (this._cameraTargetFov - this.camera.fov) * fovLerp;
        this.camera.updateProjectionMatrix();

        this._lookTarget.set(ball.pos.x, ball.pos.y, ball.pos.z - 3);
        this.camera.lookAt(this._lookTarget);
    },

    _handlePhysicsEvent(event) {
        switch(event.type) {
            case 'trigger': {
                const trigger = event.body;
                if (trigger.type === 'coin') {
                    this.coins++;
                    const points = 10 * this.combo;
                    this.score += points;
                    if (this.soundEnabled) AudioSystem.playCoinCollect();
                    ParticleSystem.coinCollect(trigger.pos);

                    const screenPos = this._worldToScreen(trigger.pos);
                    UI.showScorePopup(`+${points}`, screenPos.x, screenPos.y, '#ffd93d');

                    this.combo = Math.min(this.combo + 1, 10);
                    this.maxCombo = Math.max(this.maxCombo, this.combo);
                    this.comboTimer = 3;
                    if (this.combo > 1) {
                        UI.showCombo(this.combo);
                        if (this.soundEnabled) AudioSystem.playCombo(this.combo);
                    }
                } else if (trigger.type === 'checkpoint') {
                    this.checkpointZ = trigger.pos.z;
                    this.checkpointY = trigger.pos.y;
                    this.checkpointPos = { ...trigger.data.spawn };
                    this._nextCheckpointIdx = Math.max(this._nextCheckpointIdx, trigger.data.index + 1);

                    if (this.soundEnabled) AudioSystem.playCheckpoint();
                    ParticleSystem.checkpoint(trigger.pos);
                    UI.showCheckpoint(`✓ Checkpoint ${trigger.data.index + 1}`);
                    Minimap.activateCheckpoint(trigger.data.index);

                    if (trigger.mesh) {
                        trigger.mesh.scale.setScalar(1.15);
                    }
                } else if (trigger.type === 'powerup') {
                    const pType = trigger.data.powerType;
                    this.score += 25 * this.combo;
                    PowerUps.activate(pType, this);
                    const config = PowerUps.types[pType];
                    ParticleSystem.powerUpCollect(trigger.pos, config.color);

                    this._ballFlash(config.color);

                    const screenPos = this._worldToScreen(trigger.pos);
                    UI.showScorePopup(`${config.icon} +25`, screenPos.x, screenPos.y,
                        '#' + config.color.toString(16).padStart(6, '0'));
                } else if (trigger.type === 'finish') {
                    this._levelComplete();
                }
                break;
            }
            case 'obstacle': {
                if (this.invincible) break;
                if (Physics.ballBody.shieldActive) {
                    Physics.ballBody.shieldActive = false;
                    ParticleSystem.explosion(Physics.ballBody.pos);
                    if (this.soundEnabled) AudioSystem.playHit();
                    this.shake(0.5);
                    const screenPos = this._worldToScreen(Physics.ballBody.pos);
                    UI.showScorePopup('Kalkan!', screenPos.x, screenPos.y, '#6bcb77');
                    Physics.ballBody.vel.x *= -0.5;
                    Physics.ballBody.vel.z *= -0.5;
                    Physics.ballBody.vel.y = 5;
                } else {
                    this._takeDamage();
                }
                break;
            }
            case 'fall': {
                if (this.invincible) {
                    this._respawn();
                    break;
                }
                if (this.soundEnabled) AudioSystem.playFall();
                this._takeDamage();
                break;
            }
            case 'bounce': {
                this.shake(0.2);
                ParticleSystem.emit(Physics.ballBody.pos, {
                    count: 12, color: 0x44cc44, size: 0.12,
                    speed: 4, lifetime: 0.6, gravity: -2, type: 'ring'
                });
                break;
            }
            case 'platform_break': {
                if (this.soundEnabled) AudioSystem.playBreak();
                this.shake(0.4);
                ParticleSystem.breakEffect(event.body.pos, Math.max(event.body.size.x, event.body.size.z));
                // DÜZELTME: Kırılan platform edge mesh'ini de gizle
                if (event.body.edgeMesh) event.body.edgeMesh.visible = false;
                break;
            }
            case 'perfect_landing': {
                // DÜZELTME: Perfect landing eventi artık kullanılıyor
                const bonus = Math.floor(event.airTime * 50);
                this.score += bonus;
                if (Physics.ballBody) {
                    const screenPos = this._worldToScreen(Physics.ballBody.pos);
                    UI.showScorePopup(`Perfect! +${bonus}`, screenPos.x, screenPos.y, '#cc66ff');
                }
                ParticleSystem.emit(Physics.ballBody.pos, {
                    count: 20, color: 0xcc66ff, size: 0.1,
                    speed: 5, lifetime: 0.8, gravity: 0, type: 'ring'
                });
                break;
            }
        }
    },

    // DÜZELTME: _worldVec'i yeniden kullan, her seferinde new THREE.Vector3 oluşturma
    _worldToScreen(pos) {
        this._worldVec.set(pos.x, pos.y + 1, pos.z);
        this._worldVec.project(this.camera);
        return {
            x: (this._worldVec.x * 0.5 + 0.5) * window.innerWidth,
            y: (-this._worldVec.y * 0.5 + 0.5) * window.innerHeight
        };
    },

    _ballFlash(color) {
        if (!this.ballMesh) return;
        this.ballMesh.material.emissive.setHex(color);
        this.ballMesh.material.emissiveIntensity = 1;

        this.ballMesh.scale.setScalar(1.3);
        this.ballGlow.scale.setScalar(1.8);

        let t = 0;
        const flash = () => {
            t += 0.05;
            if (t >= 1) {
                this.ballMesh.material.emissiveIntensity = 0;
                const bs = Physics.ballBody ? Physics.ballBody.smallScale : 1;
                this.ballMesh.scale.setScalar(bs);
                this.ballGlow.scale.setScalar(1);
                return;
            }
            this.ballMesh.material.emissiveIntensity = 1 - t;
            const s = 1 + (1 - t) * 0.3;
            const bs = Physics.ballBody ? Physics.ballBody.smallScale : 1;
            this.ballMesh.scale.setScalar(s * bs);
            this.ballGlow.scale.setScalar(1 + (1 - t) * 0.8);
            requestAnimationFrame(flash);
        };
        requestAnimationFrame(flash);
    },

    _takeDamage() {
        this.lives--;
        this.combo = 1;
        UI.updateLives(this.lives);
        UI.hideCombo();
        if (this.soundEnabled) AudioSystem.playHit();

        this.shake(1.0);
        const canvas = document.getElementById('gameCanvas');
        canvas.classList.add('damaged');
        setTimeout(() => canvas.classList.remove('damaged'), 400);

        this.slowMotionTarget = 0.3;
        setTimeout(() => { this.slowMotionTarget = 1; }, 300);

        if (Physics.ballBody) {
            ParticleSystem.explosion(Physics.ballBody.pos);
        }

        if (this.lives <= 0) {
            this._gameOver();
        } else {
            this._respawn();
        }
    },

    _respawn() {
        const ball = Physics.ballBody;

        // DÜZELTME: Checkpoint'e dön, yoksa lastSafeZ'ye, o da yoksa başlangıca
        if (this.checkpointPos) {
            ball.pos.x = this.checkpointPos.x;
            ball.pos.y = this.checkpointPos.y;
            ball.pos.z = this.checkpointPos.z;
        } else {
            const sp = this.levelData.startPos;
            ball.pos.x = sp.x;
            ball.pos.y = (this.lastSafeY || sp.y) + 3;
            ball.pos.z = this.lastSafeZ !== 0 ? this.lastSafeZ : sp.z;
        }
        ball.vel.x = 0;
        ball.vel.y = 0;
        ball.vel.z = 0;

        this.invincible = true;
        this.invincibleTimer = 2;

        this.camera.position.y += 2;
    },

    _gameOver() {
        this.state = 'gameover';
        this.slowMotionTarget = 0.1;
        setTimeout(() => {
            if (this.soundEnabled) AudioSystem.playGameOver();
            AudioSystem.stopMusic();
            AudioSystem.stopRollSound();
            Controls.reset();
            UI.showGameOver({
                score: this.score,
                distance: this.distance,
                maxCombo: this.maxCombo,
                coins: this.coins,
                level: this.currentLevel
            });
        }, 600);
    },

    _levelComplete() {
        this.state = 'levelcomplete';

        this.slowMotionTarget = 0.3;
        this.shake(0.3);

        const fp = this.levelData.finishPos;
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                ParticleSystem.checkpoint({
                    x: fp.x + (Math.random() - 0.5) * 3,
                    y: fp.y + 1,
                    z: fp.z + (Math.random() - 0.5) * 3
                });
            }, i * 200);
        }

        setTimeout(() => {
            if (this.soundEnabled) AudioSystem.playLevelComplete();
            AudioSystem.stopMusic();
            AudioSystem.stopRollSound();
            Controls.reset();

            const maxTime = 120;
            const timeBonus = Math.max(0, (maxTime - this.gameTime) * 10);

            UI.showLevelComplete({
                score: this.score,
                timeBonus,
                distance: this.distance,
                maxCombo: this.maxCombo,
                coins: this.coins,
                level: this.currentLevel
            });
        }, 800);
    },

    pause() {
        if (this.state !== 'playing') return;
        this.state = 'paused';
        this.clock.stop();
        Controls.reset();
        AudioSystem.setPaused(true);
        UI.showPause();
    },

    resume() {
        if (this.state !== 'paused') return;
        this.state = 'playing';
        this.clock.start();
        UI.hidePause();
        AudioSystem.setPaused(false);
        if (this.musicEnabled) AudioSystem.resume();
        this._gameLoop();
    },

    restart() {
        UI.hideGameOver();
        UI.hideLevelComplete();
        UI.hidePause();
        this.start(this.currentLevel);
    },

    quit() {
        this.state = 'menu';
        this._clearScene();
        Controls.reset();
        UI.hideGameOver();
        UI.hideLevelComplete();
        UI.hidePause();
        UI.hideHUD();
        UI.showMenu();
        this._animateMenuBackground();
    },

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        if (!this.soundEnabled) {
            AudioSystem.setSfxVolume(0);
        } else {
            AudioSystem.setSfxVolume(0.6);
        }
        return this.soundEnabled;
    },

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        if (!this.musicEnabled) {
            AudioSystem.setMusicVolume(0);
        } else {
            AudioSystem.setMusicVolume(0.3);
            if (this.state === 'playing') {
                AudioSystem.resume();
            }
        }
        return this.musicEnabled;
    }
};

window.addEventListener('DOMContentLoaded', () => {
    Game.init();
});
