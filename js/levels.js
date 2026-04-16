// ===== LEVELS SYSTEM =====
// 3 farklı temalı level tasarımı + checkpoint + tema dekorasyonları

const Levels = {
    currentLevel: 1,
    themes: {
        1: {
            name: 'Orman',
            skyColor: 0x87ceeb,
            fogColor: 0x87ceeb,
            fogNear: 30,
            fogFar: 120,
            ambientColor: 0x404040,
            lightColor: 0xffffff,
            lightIntensity: 1.0,
            groundColor: 0x4a8c3f,
            platformColor: 0x8b6914,
            accentColor: 0x2d5a1e,
            edgeColor: 0x6bcb77,
            ballColor: 0x8bc34a,
            musicTheme: 'forest'
        },
        2: {
            name: 'Uzay',
            skyColor: 0x0a0a2e,
            fogColor: 0x0a0a2e,
            fogNear: 40,
            fogFar: 150,
            ambientColor: 0x333355,
            lightColor: 0x8888ff,
            lightIntensity: 0.9,
            groundColor: 0x2a2a5e,
            platformColor: 0x4444aa,
            accentColor: 0x6666cc,
            edgeColor: 0x8866ff,
            ballColor: 0x9966ff,
            musicTheme: 'space'
        },
        3: {
            name: 'Lav',
            skyColor: 0x1a0500,
            fogColor: 0x1a0500,
            fogNear: 25,
            fogFar: 100,
            ambientColor: 0x441100,
            lightColor: 0xff6622,
            lightIntensity: 1.2,
            groundColor: 0x333333,
            platformColor: 0x555555,
            accentColor: 0xff4400,
            edgeColor: 0xff6600,
            ballColor: 0xff4422,
            musicTheme: 'lava'
        }
    },

    getTheme(level) {
        return this.themes[level] || this.themes[1];
    },

    _addCoinRow(startX, y, startZ, count, spacing, axis = 'z') {
        const coins = [];
        for (let i = 0; i < count; i++) {
            const cx = axis === 'x' ? startX + i * spacing : startX;
            const cz = axis === 'z' ? startZ + i * spacing : startZ;
            coins.push({ x: cx, y: y + 1.2, z: cz });
        }
        return coins;
    },

    // Tema dekorasyonları oluştur
    buildDecorations(scene, level) {
        if (level === 2) {
            // Uzay - yıldız alanı
            const starCount = 600;
            const positions = new Float32Array(starCount * 3);
            const sizes = new Float32Array(starCount);
            for (let i = 0; i < starCount; i++) {
                positions[i * 3] = (Math.random() - 0.5) * 300;
                positions[i * 3 + 1] = Math.random() * 100 + 5;
                positions[i * 3 + 2] = (Math.random() - 0.5) * 400;
                sizes[i] = Math.random() * 0.5 + 0.1;
            }
            const starGeo = new THREE.BufferGeometry();
            starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            starGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
            const starMat = new THREE.PointsMaterial({
                color: 0xffffff, size: 0.4, transparent: true, opacity: 0.8,
                sizeAttenuation: true
            });
            scene.add(new THREE.Points(starGeo, starMat));

            // Nebula efekti - büyük parlayan küre
            const nebulaGeo = new THREE.SphereGeometry(15, 16, 16);
            const nebulaMat = new THREE.MeshBasicMaterial({
                color: 0x4422aa, transparent: true, opacity: 0.04, side: THREE.BackSide
            });
            const nebula = new THREE.Mesh(nebulaGeo, nebulaMat);
            nebula.position.set(30, 20, -100);
            scene.add(nebula);

            const nebula2 = new THREE.Mesh(
                new THREE.SphereGeometry(10, 16, 16),
                new THREE.MeshBasicMaterial({ color: 0x2244aa, transparent: true, opacity: 0.05, side: THREE.BackSide })
            );
            nebula2.position.set(-40, 15, -180);
            scene.add(nebula2);

        } else if (level === 3) {
            // Lav - parlayan lav zemini
            const lavaGeo = new THREE.PlaneGeometry(80, 400);
            const lavaMat = new THREE.MeshStandardMaterial({
                color: 0xff4400,
                emissive: 0xff2200,
                emissiveIntensity: 0.6,
                transparent: true,
                opacity: 0.85,
                roughness: 0.9,
                metalness: 0.1
            });
            const lavaPlane = new THREE.Mesh(lavaGeo, lavaMat);
            lavaPlane.rotation.x = -Math.PI / 2;
            lavaPlane.position.set(0, -4, -110);
            scene.add(lavaPlane);

            // Lav ışıkları
            const lavaColors = [0xff4400, 0xff6600, 0xff2200];
            for (let i = 0; i < 6; i++) {
                const light = new THREE.PointLight(
                    lavaColors[i % 3], 0.6, 25
                );
                light.position.set(
                    (Math.random() - 0.5) * 20,
                    -2,
                    -30 - i * 35
                );
                scene.add(light);
            }

            // Lav parçacıkları (yükselen kıvılcımlar)
            const sparkCount = 100;
            const sparkPositions = new Float32Array(sparkCount * 3);
            for (let i = 0; i < sparkCount; i++) {
                sparkPositions[i * 3] = (Math.random() - 0.5) * 60;
                sparkPositions[i * 3 + 1] = -3 + Math.random() * 2;
                sparkPositions[i * 3 + 2] = (Math.random()) * -220;
            }
            const sparkGeo = new THREE.BufferGeometry();
            sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
            const sparkMat = new THREE.PointsMaterial({
                color: 0xff6600, size: 0.3, transparent: true, opacity: 0.7
            });
            const sparks = new THREE.Points(sparkGeo, sparkMat);
            scene.add(sparks);

        } else if (level === 1) {
            // Orman - ağaç silüetleri (basit koni + silindir)
            for (let i = 0; i < 20; i++) {
                const side = i % 2 === 0 ? -1 : 1;
                const treeGroup = new THREE.Group();

                // Gövde
                const trunkGeo = new THREE.CylinderGeometry(0.15, 0.2, 2, 6);
                const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3a1e });
                const trunk = new THREE.Mesh(trunkGeo, trunkMat);
                trunk.position.y = 1;
                treeGroup.add(trunk);

                // Yaprak
                const leafGeo = new THREE.ConeGeometry(1.2, 3, 6);
                const leafMat = new THREE.MeshStandardMaterial({
                    color: 0x2d5a1e, roughness: 0.9
                });
                const leaf = new THREE.Mesh(leafGeo, leafMat);
                leaf.position.y = 3.5;
                treeGroup.add(leaf);

                treeGroup.position.set(
                    side * (8 + Math.random() * 6),
                    0,
                    -i * 9 - Math.random() * 5
                );
                treeGroup.scale.setScalar(0.8 + Math.random() * 0.6);
                scene.add(treeGroup);
            }
        }
    },

    // Level 1 - Orman (Kolay)
    buildLevel1(scene) {
        const theme = this.themes[1];
        const platforms = [];
        const obstacles = [];
        const coins = [];
        const powerups = [];
        const checkpoints = [];
        let z = 0;

        // --- Başlangıç alanı ---
        platforms.push({ x: 0, y: 0, z: 0, w: 6, h: 0.5, d: 8 });
        coins.push(...this._addCoinRow(0, 0.5, -2, 3, 1.5, 'z'));

        // --- Bölüm 1: Düz platformlar ---
        z = -10;
        platforms.push({ x: 0, y: 0, z: z, w: 5, h: 0.5, d: 6 });
        platforms.push({ x: 0, y: 0, z: z - 8, w: 5, h: 0.5, d: 6 });
        coins.push(...this._addCoinRow(0, 0.5, z - 2, 3, 1.5, 'z'));

        // --- Bölüm 2: Eğik platform (rampa) ---
        z = -26;
        platforms.push({ x: 0, y: 0, z: z, w: 5, h: 0.5, d: 10, tiltX: -0.15 });
        coins.push(...this._addCoinRow(-1, 1, z, 5, 2, 'z'));

        checkpoints.push({ x: 0, y: 1.5, z: -35 }); // Checkpoint 1

        // --- Bölüm 3: İçe göçük platform ---
        z = -40;
        platforms.push({ x: -3, y: 0, z: z, w: 2, h: 0.5, d: 8 });
        platforms.push({ x: 3, y: 0, z: z, w: 2, h: 0.5, d: 8 });
        platforms.push({ x: 0, y: -2, z: z, w: 4, h: 0.5, d: 8 });
        platforms.push({ x: -2, y: -1, z: z, w: 1, h: 0.5, d: 8, tiltZ: 0.3 });
        platforms.push({ x: 2, y: -1, z: z, w: 1, h: 0.5, d: 8, tiltZ: -0.3 });
        powerups.push({ x: 0, y: -0.5, z: z, type: 'speed' });

        // --- Bölüm 4: Salınan sarkaç ---
        z = -54;
        platforms.push({ x: 0, y: 0, z: z, w: 5, h: 0.5, d: 12 });
        obstacles.push({ type: 'pendulum', x: 0, y: 2, z: z - 2, speed: 1.5 });
        coins.push(...this._addCoinRow(-1.5, 0.5, z - 4, 3, 1.5, 'x'));

        checkpoints.push({ x: 0, y: 1.5, z: -64 }); // Checkpoint 2

        // --- Bölüm 5: Hareketli duvar ---
        z = -70;
        platforms.push({ x: 0, y: 0, z: z, w: 8, h: 0.5, d: 14 });
        obstacles.push({ type: 'wall', x: 0, y: 1.2, z: z - 2, w: 3, h: 2.5, d: 0.5, speed: 1.2, range: 2.5, axis: 'x' });
        obstacles.push({ type: 'wall', x: 0, y: 1.2, z: z - 6, w: 3, h: 2.5, d: 0.5, speed: 1, range: 2, axis: 'x', phase: Math.PI });
        coins.push(...this._addCoinRow(0, 0.5, z - 8, 4, 1.5, 'z'));
        powerups.push({ x: 0, y: 1, z: z - 4, type: 'shield' });

        // --- Bölüm 6: Sıçrama platformları ---
        z = -90;
        platforms.push({ x: 0, y: 0, z: z, w: 4, h: 0.5, d: 4, bounce: true });
        platforms.push({ x: 0, y: 4, z: z - 8, w: 5, h: 0.5, d: 5 });
        coins.push({ x: 0, y: 6, z: z - 8 });
        coins.push({ x: -1, y: 6, z: z - 8 });
        coins.push({ x: 1, y: 6, z: z - 8 });

        checkpoints.push({ x: 0, y: 5.5, z: -98 }); // Checkpoint 3

        // --- Bölüm 7: Buz platformu ---
        z = -104;
        platforms.push({ x: 0, y: 4, z: z, w: 5, h: 0.5, d: 10, ice: true });
        obstacles.push({ type: 'wall', x: 0, y: 5.2, z: z - 3, w: 2.5, h: 2, d: 0.5, speed: 1.5, range: 1.5, axis: 'x' });
        coins.push(...this._addCoinRow(0, 5, z - 6, 3, 1.5, 'z'));

        // --- Bölüm 8: Dönen platform ---
        z = -120;
        platforms.push({ x: 0, y: 3, z: z, w: 8, h: 0.5, d: 3, rotating: true, rotateSpeed: 0.5 });
        platforms.push({ x: 0, y: 3, z: z - 8, w: 5, h: 0.5, d: 5 });
        powerups.push({ x: 0, y: 4.5, z: z - 8, type: 'magnet' });

        checkpoints.push({ x: 0, y: 4.5, z: -128 }); // Checkpoint 4

        // --- Bölüm 9: Kompleks bölüm ---
        z = -136;
        platforms.push({ x: -3, y: 3, z: z, w: 3, h: 0.5, d: 4 });
        platforms.push({ x: 3, y: 3, z: z - 4, w: 3, h: 0.5, d: 4 });
        platforms.push({ x: -3, y: 3, z: z - 8, w: 3, h: 0.5, d: 4 });
        platforms.push({ x: 0, y: 3, z: z - 14, w: 5, h: 0.5, d: 4 });
        coins.push(...this._addCoinRow(-3, 4, z - 1, 2, 2, 'z'));
        coins.push(...this._addCoinRow(3, 4, z - 5, 2, 2, 'z'));
        coins.push(...this._addCoinRow(-3, 4, z - 9, 2, 2, 'z'));

        // --- Bölüm 10: Yükselen bloklar ---
        z = -156;
        platforms.push({ x: 0, y: 3, z: z, w: 6, h: 0.5, d: 10 });
        obstacles.push({ type: 'rising', x: -1.5, y: 4, z: z - 3, speed: 1.5, range: 2 });
        obstacles.push({ type: 'rising', x: 1.5, y: 4, z: z - 6, speed: 1.5, range: 2, phase: Math.PI });

        checkpoints.push({ x: 0, y: 4.5, z: -162 }); // Checkpoint 5

        // --- Bitiş platformu ---
        z = -172;
        platforms.push({ x: 0, y: 3, z: z, w: 6, h: 0.5, d: 6 });

        return {
            platforms, obstacles, coins, powerups, checkpoints, theme,
            startPos: { x: 0, y: 2, z: 2 },
            finishPos: { x: 0, y: 4.5, z: z },
            totalLength: Math.abs(z)
        };
    },

    // Level 2 - Uzay (Orta)
    buildLevel2(scene) {
        const theme = this.themes[2];
        const platforms = [];
        const obstacles = [];
        const coins = [];
        const powerups = [];
        const checkpoints = [];
        let z = 0;

        platforms.push({ x: 0, y: 0, z: 0, w: 6, h: 0.5, d: 8 });

        z = -10;
        platforms.push({ x: 0, y: 0, z: z, w: 2, h: 0.5, d: 12 });
        coins.push(...this._addCoinRow(0, 1, z - 2, 5, 2, 'z'));

        checkpoints.push({ x: 0, y: 1.5, z: -20 });

        z = -28;
        platforms.push({ x: -3, y: 0, z: z, w: 3, h: 0.5, d: 3, moving: true, moveAxis: 'x', moveRange: 2, moveSpeed: 1 });
        platforms.push({ x: 3, y: 0, z: z - 6, w: 3, h: 0.5, d: 3, moving: true, moveAxis: 'x', moveRange: 2, moveSpeed: 1.2, moveOffset: Math.PI });
        platforms.push({ x: 0, y: 0, z: z - 12, w: 4, h: 0.5, d: 4 });
        powerups.push({ x: 0, y: 1, z: z - 12, type: 'shield' });

        z = -46;
        platforms.push({ x: 0, y: 0, z: z, w: 10, h: 0.5, d: 10 });
        obstacles.push({ type: 'spinner', x: 0, y: 1, z: z, armLength: 3.5, speed: 1.2, arms: 3 });
        coins.push({ x: -4, y: 1, z: z - 4 });
        coins.push({ x: 4, y: 1, z: z - 4 });
        coins.push({ x: 0, y: 1, z: z + 4 });

        checkpoints.push({ x: 0, y: 1.5, z: -55 });

        z = -62;
        platforms.push({ x: -3, y: 1, z: z, w: 4, h: 0.5, d: 5, tiltZ: -0.2 });
        platforms.push({ x: 3, y: 2, z: z - 7, w: 4, h: 0.5, d: 5, tiltZ: 0.2 });
        platforms.push({ x: -3, y: 3, z: z - 14, w: 4, h: 0.5, d: 5, tiltZ: -0.2 });
        platforms.push({ x: 0, y: 4, z: z - 21, w: 5, h: 0.5, d: 4 });
        coins.push(...this._addCoinRow(-3, 2, z - 1, 3, 1.5, 'z'));
        coins.push(...this._addCoinRow(3, 3, z - 8, 3, 1.5, 'z'));
        coins.push(...this._addCoinRow(-3, 4, z - 15, 3, 1.5, 'z'));

        checkpoints.push({ x: 0, y: 5.5, z: -83 });

        z = -90;
        platforms.push({ x: 0, y: 4, z: z, w: 5, h: 0.5, d: 16 });
        obstacles.push({ type: 'laser', x: 0, y: 5.5, z: z - 3, width: 5, speed: 1 });
        obstacles.push({ type: 'laser', x: 0, y: 5.5, z: z - 7, width: 5, speed: 1.2, phase: Math.PI * 0.5 });
        obstacles.push({ type: 'laser', x: 0, y: 5.5, z: z - 11, width: 5, speed: 0.8, phase: Math.PI });
        powerups.push({ x: 0, y: 5.5, z: z - 7, type: 'shrink' });

        z = -112;
        platforms.push({ x: 0, y: 4, z: z, w: 4, h: 0.5, d: 4, breakable: true });
        platforms.push({ x: 0, y: 4, z: z - 6, w: 4, h: 0.5, d: 4, breakable: true });
        platforms.push({ x: 0, y: 4, z: z - 12, w: 4, h: 0.5, d: 4 });
        coins.push(...this._addCoinRow(0, 5, z - 1, 2, 6, 'z'));

        checkpoints.push({ x: 0, y: 5.5, z: -124 });

        z = -130;
        platforms.push({ x: 0, y: 4, z: z, w: 3, h: 0.5, d: 18 });
        obstacles.push({ type: 'pendulum', x: -1, y: 6, z: z - 4, speed: 2, phase: 0 });
        obstacles.push({ type: 'pendulum', x: 1, y: 6, z: z - 9, speed: 2, phase: Math.PI * 0.5 });
        obstacles.push({ type: 'pendulum', x: 0, y: 6, z: z - 14, speed: 1.8, phase: Math.PI });
        powerups.push({ x: 0, y: 5, z: z - 9, type: 'speed' });

        z = -154;
        platforms.push({ x: 0, y: 4, z: z, w: 8, h: 0.5, d: 16 });
        obstacles.push({ type: 'wall', x: 0, y: 5.5, z: z - 3, w: 3, h: 3, d: 0.5, speed: 1.5, range: 2.5, axis: 'x' });
        obstacles.push({ type: 'rising', x: -2, y: 4.5, z: z - 8, speed: 2, range: 3 });
        obstacles.push({ type: 'rising', x: 2, y: 4.5, z: z - 11, speed: 2, range: 3, phase: Math.PI });
        coins.push(...this._addCoinRow(0, 5, z - 5, 5, 2, 'z'));

        checkpoints.push({ x: 0, y: 5.5, z: -168 });

        z = -176;
        platforms.push({ x: 0, y: 4, z: z, w: 6, h: 0.5, d: 4, rotating: true, rotateSpeed: 0.7 });
        platforms.push({ x: 0, y: 4, z: z - 8, w: 6, h: 0.5, d: 4, rotating: true, rotateSpeed: -0.7 });
        platforms.push({ x: 0, y: 4, z: z - 16, w: 5, h: 0.5, d: 5 });
        powerups.push({ x: 0, y: 5, z: z - 8, type: 'magnet' });

        z = -198;
        platforms.push({ x: 0, y: 4, z: z, w: 6, h: 0.5, d: 20 });
        obstacles.push({ type: 'spinner', x: 0, y: 5, z: z - 5, armLength: 2.5, speed: 1.5, arms: 2 });
        obstacles.push({ type: 'wall', x: 0, y: 5.5, z: z - 12, w: 2.5, h: 3, d: 0.5, speed: 2, range: 2, axis: 'x' });
        obstacles.push({ type: 'laser', x: 0, y: 5.5, z: z - 16, width: 6, speed: 1.5 });
        coins.push(...this._addCoinRow(0, 5, z - 8, 5, 2, 'z'));

        checkpoints.push({ x: 0, y: 5.5, z: -215 });

        z = -224;
        platforms.push({ x: 0, y: 4, z: z, w: 6, h: 0.5, d: 6 });

        return {
            platforms, obstacles, coins, powerups, checkpoints, theme,
            startPos: { x: 0, y: 2, z: 2 },
            finishPos: { x: 0, y: 5.5, z: z },
            totalLength: Math.abs(z)
        };
    },

    // Level 3 - Lav (Zor)
    buildLevel3(scene) {
        const theme = this.themes[3];
        const platforms = [];
        const obstacles = [];
        const coins = [];
        const powerups = [];
        const checkpoints = [];
        let z = 0;

        platforms.push({ x: 0, y: 0, z: 0, w: 5, h: 0.5, d: 6 });

        z = -10;
        for (let i = 0; i < 4; i++) {
            platforms.push({ x: 0, y: 0, z: z - i * 3.5, w: 3, h: 0.5, d: 3, breakable: true });
        }
        platforms.push({ x: 0, y: 0, z: z - 16, w: 4, h: 0.5, d: 4 });
        coins.push(...this._addCoinRow(0, 1, z - 2, 4, 3.5, 'z'));
        powerups.push({ x: 0, y: 1.5, z: z - 7, type: 'speed' });

        checkpoints.push({ x: 0, y: 1.5, z: -26 });

        z = -32;
        platforms.push({ x: 0, y: 0, z: z, w: 6, h: 0.5, d: 18 });
        for (let i = 0; i < 4; i++) {
            obstacles.push({ type: 'laser', x: 0, y: 1.5, z: z - 2 - i * 4, width: 6, speed: 0.8 + i * 0.2, phase: i * Math.PI * 0.5 });
        }
        coins.push(...this._addCoinRow(-2, 1, z - 4, 3, 5, 'z'));
        coins.push(...this._addCoinRow(2, 1, z - 6, 3, 5, 'z'));

        checkpoints.push({ x: 0, y: 1.5, z: -50 });

        z = -56;
        platforms.push({ x: 0, y: 0, z: z, w: 4, h: 0.5, d: 12, ice: true, tiltX: -0.1 });
        obstacles.push({ type: 'pendulum', x: 0, y: 3, z: z - 4, speed: 2.2 });
        obstacles.push({ type: 'pendulum', x: 0, y: 3, z: z - 8, speed: 2, phase: Math.PI });
        powerups.push({ x: 0, y: 1.5, z: z - 6, type: 'shield' });

        z = -74;
        platforms.push({ x: -4, y: 1, z: z, w: 2.5, h: 0.5, d: 10 });
        platforms.push({ x: 4, y: 1, z: z, w: 2.5, h: 0.5, d: 10 });
        platforms.push({ x: 0, y: -1.5, z: z, w: 5, h: 0.5, d: 10 });
        platforms.push({ x: -2.5, y: 0, z: z, w: 1.5, h: 0.5, d: 10, tiltZ: 0.4 });
        platforms.push({ x: 2.5, y: 0, z: z, w: 1.5, h: 0.5, d: 10, tiltZ: -0.4 });
        obstacles.push({ type: 'spinner', x: 0, y: -0.5, z: z - 5, armLength: 2, speed: 1.8, arms: 3 });
        coins.push(...this._addCoinRow(0, 0, z - 1, 5, 2, 'z'));

        checkpoints.push({ x: 0, y: 1.5, z: -84 });

        z = -90;
        platforms.push({ x: 0, y: 0, z: z, w: 3, h: 0.5, d: 3, bounce: true });
        platforms.push({ x: -3, y: 5, z: z - 6, w: 3, h: 0.5, d: 3, bounce: true });
        platforms.push({ x: 3, y: 10, z: z - 12, w: 4, h: 0.5, d: 4 });
        platforms.push({ x: 0, y: 10, z: z - 18, w: 5, h: 0.5, d: 5 });
        coins.push({ x: 0, y: 4, z: z });
        coins.push({ x: -3, y: 9, z: z - 6 });
        coins.push({ x: 3, y: 14, z: z - 12 });
        powerups.push({ x: 0, y: 11.5, z: z - 18, type: 'magnet' });

        checkpoints.push({ x: 0, y: 11.5, z: -108 });

        z = -114;
        platforms.push({ x: 0, y: 10, z: z, w: 6, h: 0.5, d: 20 });
        for (let i = 0; i < 4; i++) {
            obstacles.push({
                type: 'wall', x: 0, y: 11.5, z: z - 3 - i * 4,
                w: 2.5, h: 3, d: 0.5, speed: 1.5 + i * 0.3, range: 2, axis: 'x',
                phase: i * Math.PI * 0.5
            });
        }
        coins.push(...this._addCoinRow(0, 11, z - 3, 4, 4, 'z'));

        z = -140;
        platforms.push({ x: 0, y: 10, z: z, w: 7, h: 0.5, d: 4, rotating: true, rotateSpeed: 0.8 });
        platforms.push({ x: 0, y: 10, z: z - 7, w: 4, h: 0.5, d: 3, breakable: true });
        platforms.push({ x: 0, y: 10, z: z - 12, w: 7, h: 0.5, d: 4, rotating: true, rotateSpeed: -0.8 });
        platforms.push({ x: 0, y: 10, z: z - 19, w: 5, h: 0.5, d: 4 });

        checkpoints.push({ x: 0, y: 11.5, z: -159 });

        z = -164;
        platforms.push({ x: 0, y: 10, z: z, w: 5, h: 0.5, d: 5, moving: true, moveAxis: 'x', moveRange: 3, moveSpeed: 0.8 });
        platforms.push({ x: 0, y: 10, z: z - 8, w: 6, h: 0.5, d: 8 });
        obstacles.push({ type: 'laser', x: 0, y: 11.5, z: z - 8, width: 6, speed: 1.5 });
        obstacles.push({ type: 'pendulum', x: 0, y: 13, z: z - 12, speed: 2.5 });
        powerups.push({ x: 0, y: 11.5, z: z - 8, type: 'shrink' });

        z = -182;
        platforms.push({ x: 0, y: 10, z: z, w: 8, h: 0.5, d: 30 });
        obstacles.push({ type: 'spinner', x: 0, y: 11, z: z - 5, armLength: 3, speed: 2, arms: 4 });
        obstacles.push({ type: 'wall', x: 0, y: 11.5, z: z - 12, w: 3, h: 3, d: 0.5, speed: 2.5, range: 2.5, axis: 'x' });
        obstacles.push({ type: 'laser', x: 0, y: 11.5, z: z - 18, width: 8, speed: 2 });
        obstacles.push({ type: 'rising', x: -2, y: 11, z: z - 22, speed: 2.5, range: 3 });
        obstacles.push({ type: 'rising', x: 2, y: 11, z: z - 25, speed: 2.5, range: 3, phase: Math.PI });
        obstacles.push({ type: 'pendulum', x: 0, y: 14, z: z - 28, speed: 2.5 });
        coins.push(...this._addCoinRow(-3, 11, z - 8, 4, 5, 'z'));
        coins.push(...this._addCoinRow(3, 11, z - 10, 4, 5, 'z'));

        checkpoints.push({ x: 0, y: 11.5, z: -210 });

        z = -218;
        platforms.push({ x: 0, y: 10, z: z, w: 6, h: 0.5, d: 6 });

        return {
            platforms, obstacles, coins, powerups, checkpoints, theme,
            startPos: { x: 0, y: 2, z: 2 },
            finishPos: { x: 0, y: 11.5, z: z },
            totalLength: Math.abs(z)
        };
    },

    build(level, scene) {
        this.currentLevel = level;
        switch(level) {
            case 1: return this.buildLevel1(scene);
            case 2: return this.buildLevel2(scene);
            case 3: return this.buildLevel3(scene);
            default: return this.buildLevel1(scene);
        }
    }
};
