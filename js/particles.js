// ===== PARTICLE SYSTEM =====
// Three.js tabanlı parçacık efektleri

const ParticleSystem = {
    particles: [],
    scene: null,

    init(scene) {
        this.scene = scene;
        this.particles = [];
    },

    // Genel parçacık oluşturucu
    emit(position, options = {}) {
        const {
            count = 15,
            color = 0xffd93d,
            size = 0.15,
            speed = 3,
            lifetime = 1.0,
            gravity = -5,
            spread = 1,
            type = 'sphere' // sphere, trail, ring
        } = options;

        for (let i = 0; i < count; i++) {
            const geo = new THREE.SphereGeometry(size * (0.5 + Math.random() * 0.5), 4, 4);
            const mat = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 1
            });
            const mesh = new THREE.Mesh(geo, mat);

            let vx, vy, vz;
            if (type === 'ring') {
                const angle = (i / count) * Math.PI * 2;
                vx = Math.cos(angle) * speed;
                vy = speed * 0.5 + Math.random() * speed * 0.5;
                vz = Math.sin(angle) * speed;
            } else if (type === 'trail') {
                vx = (Math.random() - 0.5) * speed * 0.3;
                vy = Math.random() * speed * 0.5;
                vz = (Math.random() - 0.5) * speed * 0.3;
            } else {
                vx = (Math.random() - 0.5) * speed * spread;
                vy = Math.random() * speed;
                vz = (Math.random() - 0.5) * speed * spread;
            }

            mesh.position.set(
                position.x + (Math.random() - 0.5) * 0.3,
                position.y + (Math.random() - 0.5) * 0.3,
                position.z + (Math.random() - 0.5) * 0.3
            );

            this.scene.add(mesh);
            this.particles.push({
                mesh,
                vx, vy, vz,
                life: lifetime,
                maxLife: lifetime,
                gravity
            });
        }
    },

    // Coin toplama efekti
    coinCollect(position) {
        this.emit(position, {
            count: 20,
            color: 0xffd93d,
            size: 0.12,
            speed: 4,
            lifetime: 0.8,
            gravity: -3,
            type: 'ring'
        });
    },

    // Power-up toplama efekti
    powerUpCollect(position, color) {
        this.emit(position, {
            count: 30,
            color: color,
            size: 0.15,
            speed: 5,
            lifetime: 1.0,
            gravity: -2,
            type: 'sphere'
        });
    },

    // Patlama efekti (çarpışma)
    explosion(position) {
        this.emit(position, {
            count: 25,
            color: 0xff4444,
            size: 0.2,
            speed: 6,
            lifetime: 0.6,
            gravity: -8,
            type: 'sphere'
        });
        // İkinci dalga - kıvılcımlar
        this.emit(position, {
            count: 10,
            color: 0xff8800,
            size: 0.08,
            speed: 8,
            lifetime: 0.4,
            gravity: -5,
            type: 'sphere',
            spread: 2
        });
    },

    // Top izi efekti
    trail(position, color = 0x4d96ff) {
        this.emit(position, {
            count: 2,
            color: color,
            size: 0.06,
            speed: 0.5,
            lifetime: 0.4,
            gravity: -1,
            type: 'trail'
        });
    },

    // Platform kırılma efekti
    breakEffect(position, size) {
        this.emit(position, {
            count: 30,
            color: 0x888888,
            size: 0.2,
            speed: 5,
            lifetime: 1.2,
            gravity: -12,
            type: 'sphere',
            spread: size || 1
        });
    },

    // Checkpoint efekti
    checkpoint(position) {
        this.emit(position, {
            count: 40,
            color: 0x6bcb77,
            size: 0.1,
            speed: 3,
            lifetime: 1.5,
            gravity: 2,
            type: 'ring'
        });
    },

    update(delta) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= delta;

            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                p.mesh.geometry.dispose();
                p.mesh.material.dispose();
                this.particles.splice(i, 1);
                continue;
            }

            // Fizik güncellemesi
            p.vy += p.gravity * delta;
            p.mesh.position.x += p.vx * delta;
            p.mesh.position.y += p.vy * delta;
            p.mesh.position.z += p.vz * delta;

            // Opaklık fadeout
            const lifeRatio = p.life / p.maxLife;
            p.mesh.material.opacity = lifeRatio;

            // Küçülme
            const scale = lifeRatio * 0.8 + 0.2;
            p.mesh.scale.setScalar(scale);
        }
    },

    clear() {
        for (const p of this.particles) {
            this.scene.remove(p.mesh);
            p.mesh.geometry.dispose();
            p.mesh.material.dispose();
        }
        this.particles = [];
    }
};
