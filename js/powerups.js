// ===== POWER-UP SYSTEM =====
// Güç artırıcı oluşturma ve yönetimi

const PowerUps = {
    scene: null,
    activePowerUp: null,
    powerUpTimer: 0,
    meshes: [],

    types: {
        speed: {
            name: 'Hız Boost',
            color: 0x4d96ff,
            icon: '⚡',
            duration: 5,
            effect: (game) => { game.speedMultiplier = 1.8; },
            remove: (game) => { game.speedMultiplier = 1; }
        },
        shield: {
            name: 'Kalkan',
            color: 0x6bcb77,
            icon: '🛡️',
            duration: 8,
            effect: (game) => { Physics.ballBody.shieldActive = true; },
            remove: (game) => { Physics.ballBody.shieldActive = false; }
        },
        magnet: {
            name: 'Mıknatıs',
            color: 0xffd93d,
            icon: '🧲',
            duration: 6,
            effect: (game) => { game.magnetActive = true; },
            remove: (game) => { game.magnetActive = false; }
        },
        shrink: {
            name: 'Küçülme',
            color: 0xcc66ff,
            icon: '🔮',
            duration: 7,
            effect: (game) => {
                Physics.ballBody.smallScale = 0.5;
                if (game.ballMesh) game.ballMesh.scale.setScalar(0.5);
            },
            remove: (game) => {
                Physics.ballBody.smallScale = 1;
                if (game.ballMesh) game.ballMesh.scale.setScalar(1);
            }
        }
    },

    init(scene) {
        this.scene = scene;
        this.activePowerUp = null;
        this.powerUpTimer = 0;
        this.meshes = [];
    },

    createPowerUp(x, y, z, type) {
        const config = this.types[type];
        if (!config) return null;

        // Dış küre (yarı saydam)
        const outerGeo = new THREE.SphereGeometry(0.5, 16, 16);
        const outerMat = new THREE.MeshStandardMaterial({
            color: config.color,
            transparent: true,
            opacity: 0.3,
            metalness: 0.3,
            roughness: 0.1
        });
        const outer = new THREE.Mesh(outerGeo, outerMat);

        // İç küre (parlak)
        const innerGeo = new THREE.SphereGeometry(0.25, 12, 12);
        const innerMat = new THREE.MeshBasicMaterial({
            color: config.color
        });
        const inner = new THREE.Mesh(innerGeo, innerMat);

        // Yıldız şekli (dekoratif)
        const starGeo = new THREE.OctahedronGeometry(0.35, 0);
        const starMat = new THREE.MeshBasicMaterial({
            color: config.color,
            wireframe: true,
            transparent: true,
            opacity: 0.6
        });
        const star = new THREE.Mesh(starGeo, starMat);

        const group = new THREE.Group();
        group.add(outer);
        group.add(inner);
        group.add(star);
        group.position.set(x, y, z);
        this.scene.add(group);

        const trigger = Physics.addTrigger(x, y, z, 0.7, 'powerup', { powerType: type });
        trigger.mesh = group;

        this.meshes.push({
            group,
            outer,
            inner,
            star,
            trigger,
            type,
            baseY: y
        });

        return trigger;
    },

    activate(type, game) {
        // Önceki power-up'ı kaldır
        if (this.activePowerUp) {
            this.types[this.activePowerUp].remove(game);
        }

        const config = this.types[type];
        this.activePowerUp = type;
        this.powerUpTimer = config.duration;

        // Efekti uygula
        config.effect(game);

        // UI güncelle
        const iconEl = document.getElementById('powerup-icon');
        const fillEl = document.getElementById('powerup-fill');
        const container = document.getElementById('hud-powerup');

        container.style.display = 'flex';
        iconEl.textContent = config.icon;
        iconEl.style.background = `rgba(${this._hexToRgb(config.color)}, 0.3)`;
        fillEl.style.background = `#${config.color.toString(16).padStart(6, '0')}`;
        fillEl.style.width = '100%';

        AudioSystem.playPowerUp();
    },

    update(delta, time, game) {
        // Power-up zamanlayıcısı
        if (this.activePowerUp) {
            this.powerUpTimer -= delta;
            const config = this.types[this.activePowerUp];
            const ratio = this.powerUpTimer / config.duration;

            const fillEl = document.getElementById('powerup-fill');
            if (fillEl) {
                fillEl.style.width = `${Math.max(0, ratio * 100)}%`;
                // Son %25'te yanıp sönme uyarısı
                if (ratio < 0.25) {
                    fillEl.classList.add('low');
                } else {
                    fillEl.classList.remove('low');
                }
            }

            if (this.powerUpTimer <= 0) {
                config.remove(game);
                this.activePowerUp = null;
                document.getElementById('hud-powerup').style.display = 'none';
                if (fillEl) fillEl.classList.remove('low');
            }
        }

        // Animasyonlar (hover + rotate)
        for (const pu of this.meshes) {
            if (pu.trigger.collected) {
                if (pu.group.visible) {
                    pu.group.visible = false;
                }
                continue;
            }
            pu.group.position.y = pu.baseY + Math.sin(time * 2) * 0.3;
            pu.star.rotation.y += delta * 2;
            pu.star.rotation.x += delta * 1.5;
            pu.outer.rotation.y -= delta;
        }

        // Mıknatıs efekti - yakın coinleri çek
        if (game.magnetActive && Physics.ballBody) {
            const ball = Physics.ballBody;
            const magnetRange = 8;
            for (const trigger of Physics.triggerBodies) {
                if (trigger.collected || trigger.type !== 'coin') continue;
                const dx = ball.pos.x - trigger.pos.x;
                const dy = ball.pos.y - trigger.pos.y;
                const dz = ball.pos.z - trigger.pos.z;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                if (dist < magnetRange && dist > 0.1) {
                    const force = (magnetRange - dist) / magnetRange * 8 * delta;
                    trigger.pos.x += (dx / dist) * force;
                    trigger.pos.y += (dy / dist) * force;
                    trigger.pos.z += (dz / dist) * force;
                    if (trigger.mesh) {
                        trigger.mesh.position.set(trigger.pos.x, trigger.pos.y, trigger.pos.z);
                    }
                }
            }
        }
    },

    clear() {
        for (const pu of this.meshes) {
            pu.group.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
            this.scene.remove(pu.group);
        }
        this.meshes = [];
        this.activePowerUp = null;
        this.powerUpTimer = 0;
    },

    _hexToRgb(hex) {
        const r = (hex >> 16) & 255;
        const g = (hex >> 8) & 255;
        const b = hex & 255;
        return `${r},${g},${b}`;
    }
};
