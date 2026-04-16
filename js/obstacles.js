// ===== OBSTACLES SYSTEM =====
// Engel oluşturma ve yönetimi

const Obstacles = {
    scene: null,
    obstacles: [],

    init(scene) {
        this.scene = scene;
        this.obstacles = [];
    },

    // Salınan sarkaç
    createPendulum(x, y, z, options = {}) {
        const {
            length = 4,
            ballRadius = 0.6,
            speed = 1.5,
            phase = 0,
            color = 0xff4444
        } = options;

        // Sarkaç çubuğu
        const rodGeo = new THREE.CylinderGeometry(0.05, 0.05, length, 8);
        const rodMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 });
        const rod = new THREE.Mesh(rodGeo, rodMat);

        // Sarkaç topu
        const ballGeo = new THREE.SphereGeometry(ballRadius, 16, 16);
        const ballMat = new THREE.MeshStandardMaterial({ color, metalness: 0.6, roughness: 0.3 });
        const ball = new THREE.Mesh(ballGeo, ballMat);

        const group = new THREE.Group();
        rod.position.y = -length / 2;
        ball.position.y = -length;
        group.add(rod);
        group.add(ball);
        group.position.set(x, y + length, z);
        this.scene.add(group);

        // Fizik body - sarkaç topu için
        const body = Physics.addObstacleBody(x, y, z, ballRadius * 2, ballRadius * 2, ballRadius * 2, {
            moveType: 'swing',
            moveSpeed: speed,
            moveRange: length * 0.8,
            phase: phase
        });

        const obstacle = {
            type: 'pendulum',
            group,
            ball,
            rod,
            body,
            pivotX: x,
            pivotY: y + length,
            pivotZ: z,
            length,
            speed,
            phase,
            time: 0
        };

        this.obstacles.push(obstacle);
        return obstacle;
    },

    // Dönen çark
    createSpinner(x, y, z, options = {}) {
        const {
            armLength = 4,
            armWidth = 0.4,
            armHeight = 0.8,
            speed = 1,
            arms = 2,
            color = 0xff6600
        } = options;

        const group = new THREE.Group();
        const bodies = [];

        for (let i = 0; i < arms; i++) {
            const angle = (i / arms) * Math.PI;
            const armGeo = new THREE.BoxGeometry(armLength * 2, armHeight, armWidth);
            const armMat = new THREE.MeshStandardMaterial({ color, metalness: 0.5, roughness: 0.4 });
            const arm = new THREE.Mesh(armGeo, armMat);
            arm.rotation.y = angle;
            group.add(arm);

            const body = Physics.addObstacleBody(x, y, z, armLength * 2, armHeight, armWidth, {
                moveType: 'rotate',
                moveSpeed: speed,
                moveRange: armLength,
                phase: angle
            });
            bodies.push(body);
        }

        // Merkez silindir
        const centerGeo = new THREE.CylinderGeometry(0.4, 0.4, armHeight + 0.2, 16);
        const centerMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.9 });
        const center = new THREE.Mesh(centerGeo, centerMat);
        group.add(center);

        group.position.set(x, y, z);
        this.scene.add(group);

        const obstacle = {
            type: 'spinner',
            group,
            bodies,
            speed,
            centerX: x,
            centerY: y,
            centerZ: z,
            armLength
        };

        this.obstacles.push(obstacle);
        return obstacle;
    },

    // İleri-geri hareket eden duvar
    createMovingWall(x, y, z, options = {}) {
        const {
            width = 2,
            height = 2,
            depth = 0.5,
            speed = 1,
            range = 3,
            axis = 'x',
            phase = 0,
            color = 0xcc3333
        } = options;

        const geo = new THREE.BoxGeometry(width, height, depth);
        const mat = new THREE.MeshStandardMaterial({
            color,
            metalness: 0.4,
            roughness: 0.5,
            emissive: new THREE.Color(color).multiplyScalar(0.15)
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        this.scene.add(mesh);

        const body = Physics.addObstacleBody(x, y, z, width, height, depth, {
            moveType: 'linear',
            moveSpeed: speed,
            moveRange: range,
            moveAxis: axis,
            phase: phase
        });
        body.mesh = mesh;

        this.obstacles.push({ type: 'wall', mesh, body });
        return body;
    },

    // Yükselen-alçalan blok
    createRisingBlock(x, y, z, options = {}) {
        const {
            width = 1.5,
            height = 2.5,
            depth = 1.5,
            speed = 1.5,
            range = 2,
            phase = 0,
            color = 0x9933cc
        } = options;

        const geo = new THREE.BoxGeometry(width, height, depth);
        const mat = new THREE.MeshStandardMaterial({
            color,
            metalness: 0.5,
            roughness: 0.3,
            emissive: new THREE.Color(color).multiplyScalar(0.1)
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        this.scene.add(mesh);

        const body = Physics.addObstacleBody(x, y, z, width, height, depth, {
            moveType: 'linear',
            moveSpeed: speed,
            moveRange: range,
            moveAxis: 'y',
            phase: phase
        });
        body.mesh = mesh;

        this.obstacles.push({ type: 'rising', mesh, body });
        return body;
    },

    // Lazer ışını
    createLaser(x, y, z, options = {}) {
        const {
            width = 6,
            height = 0.15,
            speed = 1,
            phase = 0,
            color = 0xff0000
        } = options;

        const group = new THREE.Group();

        // Lazer ışını
        const beamGeo = new THREE.BoxGeometry(width, height, height);
        const beamMat = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.8
        });
        const beam = new THREE.Mesh(beamGeo, beamMat);
        group.add(beam);

        // Glow efekti
        const glowGeo = new THREE.BoxGeometry(width, height * 3, height * 3);
        const glowMat = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.15
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        group.add(glow);

        // İki uçtaki emitter
        for (let side = -1; side <= 1; side += 2) {
            const emitterGeo = new THREE.BoxGeometry(0.3, 0.6, 0.6);
            const emitterMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.9 });
            const emitter = new THREE.Mesh(emitterGeo, emitterMat);
            emitter.position.x = side * (width / 2 + 0.15);
            group.add(emitter);
        }

        group.position.set(x, y, z);
        this.scene.add(group);

        const body = Physics.addObstacleBody(x, y, z, width, height * 2, height * 2, {
            moveType: 'laser',
            moveSpeed: speed,
            laserInterval: 2,
            phase: phase
        });
        body.mesh = group;

        const obstacle = {
            type: 'laser',
            group,
            beam,
            glow,
            body,
            beamMat,
            glowMat,
            originalOpacity: 0.8,
            color
        };

        this.obstacles.push(obstacle);
        return obstacle;
    },

    update(time, delta) {
        for (const obs of this.obstacles) {
            if (obs.type === 'pendulum') {
                const angle = Math.sin(time * obs.speed + obs.phase) * 1.2;
                obs.group.rotation.z = angle;

                // Update obstacle body position
                const bx = obs.pivotX + Math.sin(angle) * obs.length;
                const by = obs.pivotY - Math.cos(angle) * obs.length;
                obs.body.pos.x = bx;
                obs.body.pos.y = by;
            } else if (obs.type === 'spinner') {
                obs.group.rotation.y += obs.speed * delta;
                // Update each arm body
                for (let i = 0; i < obs.bodies.length; i++) {
                    const b = obs.bodies[i];
                    const angle = obs.group.rotation.y + b.phase;
                    b.pos.x = obs.centerX + Math.cos(angle) * obs.armLength;
                    b.pos.z = obs.centerZ + Math.sin(angle) * obs.armLength;
                }
            } else if (obs.type === 'laser') {
                const isOn = Math.sin(time * obs.body.moveSpeed + obs.body.phase) > -0.3;
                obs.beam.visible = isOn;
                obs.glow.visible = isOn;
                if (isOn) {
                    obs.beamMat.opacity = 0.6 + Math.sin(time * 10) * 0.2;
                    obs.glowMat.opacity = 0.1 + Math.sin(time * 10) * 0.05;
                }
            }
        }
    },

    clear() {
        const disposeMesh = (mesh) => {
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) {
                if (Array.isArray(mesh.material)) {
                    mesh.material.forEach(m => m.dispose());
                } else {
                    mesh.material.dispose();
                }
            }
        };

        for (const obs of this.obstacles) {
            if (obs.group) {
                obs.group.traverse(disposeMesh);
                this.scene.remove(obs.group);
            }
            if (obs.mesh) {
                disposeMesh(obs.mesh);
                this.scene.remove(obs.mesh);
            }
        }
        this.obstacles = [];
    }
};
