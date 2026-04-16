// ===== PHYSICS SYSTEM =====
// Basit fizik motoru (harici bağımlılık gerektirmez)

const Physics = {
    gravity: -25,
    bodies: [],
    ballBody: null,
    groundBodies: [],
    triggerBodies: [],

    init() {
        this.bodies = [];
        this.groundBodies = [];
        this.triggerBodies = [];
        this.ballBody = null;
    },

    createBall(x, y, z, radius) {
        this.ballBody = {
            type: 'ball',
            pos: { x, y, z },
            vel: { x: 0, y: 0, z: 0 },
            radius: radius,
            mass: 1,
            friction: 0.98,
            restitution: 0.3,
            onGround: false,
            groundNormal: { x: 0, y: 1, z: 0 },
            shieldActive: false,
            smallScale: 1,
            jumpsLeft: 2,
            maxJumps: 2,
            lastAirTime: 0,
            wasOnGround: false
        };
        return this.ballBody;
    },

    addStaticBox(x, y, z, w, h, d, options = {}) {
        const body = {
            type: 'box',
            pos: { x, y, z },
            size: { x: w, y: h, z: d },
            halfSize: { x: w / 2, y: h / 2, z: d / 2 },
            rotation: options.rotation || 0,
            tiltX: options.tiltX || 0,
            tiltZ: options.tiltZ || 0,
            friction: options.friction != null ? options.friction : 0.98,
            isBounce: options.isBounce || false,
            isIce: options.isIce || false,
            isBreakable: options.isBreakable || false,
            broken: false,
            breakTimer: -1,
            isMoving: options.isMoving || false,
            moveAxis: options.moveAxis || 'y',
            moveRange: options.moveRange || 2,
            moveSpeed: options.moveSpeed || 1,
            moveOffset: options.moveOffset || 0,
            originalPos: { x, y, z },
            isRotating: options.isRotating || false,
            rotateSpeed: options.rotateSpeed || 1,
            userData: options.userData || {},
            mesh: null,
            edgeMesh: null,
            extraMeshes: []
        };
        this.groundBodies.push(body);
        return body;
    },

    addTrigger(x, y, z, radius, type, data = {}) {
        const trigger = {
            pos: { x, y, z },
            radius: radius,
            type: type,
            collected: false,
            data: data,
            mesh: null,
            glowMesh: null
        };
        this.triggerBodies.push(trigger);
        return trigger;
    },

    addObstacleBody(x, y, z, w, h, d, options = {}) {
        const body = {
            type: 'obstacle',
            pos: { x, y, z },
            size: { x: w, y: h, z: d },
            halfSize: { x: w / 2, y: h / 2, z: d / 2 },
            originalPos: { x, y, z },
            moveType: options.moveType || 'none',
            moveSpeed: options.moveSpeed || 1,
            moveRange: options.moveRange || 3,
            moveAxis: options.moveAxis || 'x',
            phase: options.phase || 0,
            active: true,
            laserOn: true,
            laserInterval: options.laserInterval || 2,
            mesh: null,
            userData: options.userData || {}
        };
        this.bodies.push(body);
        return body;
    },

    // AABB collision check
    ballBoxCollision(ball, box) {
        if (box.broken) return null;

        const bx = box.pos.x, by = box.pos.y, bz = box.pos.z;
        const hx = box.halfSize.x, hy = box.halfSize.y, hz = box.halfSize.z;

        const closestX = Math.max(bx - hx, Math.min(ball.pos.x, bx + hx));
        const closestY = Math.max(by - hy, Math.min(ball.pos.y, by + hy));
        const closestZ = Math.max(bz - hz, Math.min(ball.pos.z, bz + hz));

        const dx = ball.pos.x - closestX;
        const dy = ball.pos.y - closestY;
        const dz = ball.pos.z - closestZ;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const r = ball.radius * ball.smallScale;

        if (dist < r) {
            const overlap = r - dist;
            const nx = dist > 0.001 ? dx / dist : 0;
            const ny = dist > 0.001 ? dy / dist : 1;
            const nz = dist > 0.001 ? dz / dist : 0;
            return { overlap, nx, ny, nz };
        }
        return null;
    },

    ballTriggerCollision(ball, trigger) {
        const dx = ball.pos.x - trigger.pos.x;
        const dy = ball.pos.y - trigger.pos.y;
        const dz = ball.pos.z - trigger.pos.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        return dist < (ball.radius * ball.smallScale + trigger.radius);
    },

    update(delta, time, platformTilt) {
        if (!this.ballBody) return [];
        const ball = this.ballBody;
        const events = [];

        delta = Math.min(delta, 0.05);

        ball.vel.y += this.gravity * delta;

        if (platformTilt) {
            ball.vel.x += platformTilt.x * 20 * delta;
            ball.vel.z += platformTilt.z * 20 * delta;
        }

        ball.pos.x += ball.vel.x * delta;
        ball.pos.y += ball.vel.y * delta;
        ball.pos.z += ball.vel.z * delta;

        ball.wasOnGround = ball.onGround;
        ball.onGround = false;

        // Hareketli/dönen platformları güncelle
        for (const ground of this.groundBodies) {
            if (ground.broken) continue;

            if (ground.isMoving) {
                const t = time * ground.moveSpeed + ground.moveOffset;
                const offset = Math.sin(t) * ground.moveRange;
                ground.pos[ground.moveAxis] = ground.originalPos[ground.moveAxis] + offset;
                if (ground.mesh) {
                    ground.mesh.position[ground.moveAxis] = ground.pos[ground.moveAxis];
                }
            }

            if (ground.isRotating) {
                ground.rotation += ground.rotateSpeed * delta;
                if (ground.mesh) {
                    ground.mesh.rotation.y = ground.rotation;
                }
            }

            if (ground.extraMeshes && ground.extraMeshes.length > 0) {
                for (const extraItem of ground.extraMeshes) {
                    const extraMesh = extraItem.mesh || extraItem;
                    const offset = extraItem.offset || { x: 0, y: 0, z: 0 };
                    extraMesh.position.set(
                        ground.pos.x + offset.x,
                        ground.pos.y + offset.y,
                        ground.pos.z + offset.z
                    );

                    if (extraItem.followRotation !== false) {
                        extraMesh.rotation.x = ground.tiltX || 0;
                        extraMesh.rotation.y = ground.rotation || 0;
                        extraMesh.rotation.z = ground.tiltZ || 0;
                    }
                }
            }
        }

        // Engel pozisyonlarını güncelle
        for (const obs of this.bodies) {
            if (!obs.active) continue;

            if (obs.moveType === 'linear') {
                const t = time * obs.moveSpeed + obs.phase;
                const offset = Math.sin(t) * obs.moveRange;
                obs.pos[obs.moveAxis] = obs.originalPos[obs.moveAxis] + offset;
            } else if (obs.moveType === 'swing') {
                const t = time * obs.moveSpeed + obs.phase;
                const angle = Math.sin(t) * obs.moveRange;
                obs.pos.x = obs.originalPos.x + Math.sin(angle) * obs.moveRange;
                obs.pos.z = obs.originalPos.z + Math.cos(angle) * obs.moveRange * 0.3;
            } else if (obs.moveType === 'rotate') {
                const t = time * obs.moveSpeed + obs.phase;
                obs.pos.x = obs.originalPos.x + Math.cos(t) * obs.moveRange;
                obs.pos.z = obs.originalPos.z + Math.sin(t) * obs.moveRange;
            } else if (obs.moveType === 'laser') {
                obs.laserOn = Math.sin(time * obs.moveSpeed + obs.phase) > -0.3;
            }

            if (obs.mesh) {
                obs.mesh.position.set(obs.pos.x, obs.pos.y, obs.pos.z);
            }
        }

        // Top vs zemin çarpışmaları
        for (const ground of this.groundBodies) {
            if (ground.broken) continue;

            const col = this.ballBoxCollision(ball, ground);
            if (col) {
                ball.pos.x += col.nx * col.overlap;
                ball.pos.y += col.ny * col.overlap;
                ball.pos.z += col.nz * col.overlap;

                if (col.ny > 0.5) {
                    ball.onGround = true;
                    ball.groundNormal = { x: col.nx, y: col.ny, z: col.nz };

                    ball.jumpsLeft = ball.maxJumps;

                    if (!ball.wasOnGround && ball.lastAirTime > 1.0) {
                        events.push({ type: 'perfect_landing', airTime: ball.lastAirTime });
                    }
                    ball.lastAirTime = 0;

                    if (ground.isBounce) {
                        ball.vel.y = 18;
                        AudioSystem.playBounce();
                        events.push({ type: 'bounce', body: ground });
                        continue;
                    }

                    if (ground.isBreakable && ground.breakTimer < 0) {
                        ground.breakTimer = 0.8;
                    }

                    if (ball.vel.y < 0) {
                        ball.vel.y = 0;
                    }

                    if (ground.tiltX) {
                        ball.vel.z += Math.sin(ground.tiltX) * 15 * delta;
                    }
                    if (ground.tiltZ) {
                        ball.vel.x += Math.sin(ground.tiltZ) * 15 * delta;
                    }

                    const f = ground.isIce ? 0.997 : ground.friction;
                    ball.vel.x *= f;
                    ball.vel.z *= f;
                } else {
                    const dot = ball.vel.x * col.nx + ball.vel.y * col.ny + ball.vel.z * col.nz;
                    if (dot < 0) {
                        ball.vel.x -= 2 * dot * col.nx * ball.restitution;
                        ball.vel.y -= 2 * dot * col.ny * ball.restitution;
                        ball.vel.z -= 2 * dot * col.nz * ball.restitution;
                    }
                    ball.vel.x *= 0.85;
                    ball.vel.z *= 0.85;
                }
            }
        }

        if (!ball.onGround) {
            ball.lastAirTime += delta;
        }

        // Top vs engel çarpışmaları
        for (const obs of this.bodies) {
            if (!obs.active) continue;
            if (obs.moveType === 'laser' && !obs.laserOn) continue;

            const col = this.ballBoxCollision(ball, obs);
            if (col) {
                events.push({ type: 'obstacle', body: obs });
            }
        }

        // Top vs trigger çarpışmaları
        for (const trigger of this.triggerBodies) {
            if (trigger.collected) continue;
            if (this.ballTriggerCollision(ball, trigger)) {
                trigger.collected = true;
                events.push({ type: 'trigger', body: trigger });
            }
        }

        // Kırılabilir platformları güncelle
        for (const ground of this.groundBodies) {
            if (ground.isBreakable && ground.breakTimer >= 0) {
                ground.breakTimer -= delta;
                if (ground.breakTimer <= 0) {
                    ground.broken = true;
                    if (ground.mesh) {
                        ground.mesh.visible = false;
                        // DÜZELTME: Geometry ve material dispose edilsin (bellek sızıntısı önleme)
                        if (!ground._disposed) {
                            ground._disposed = true;
                        }
                    }
                    events.push({ type: 'platform_break', body: ground });
                } else {
                    if (ground.mesh) {
                        ground.mesh.position.x = ground.pos.x + (Math.random() - 0.5) * 0.1;
                        ground.mesh.position.z = ground.pos.z + (Math.random() - 0.5) * 0.1;
                    }
                }
            }
        }

        // DÜZELTME: Düşme eşiği — level bazlı dinamik hesap
        // Level 3'te platformlar y:10'da, bu yüzden sabit -20 yetersizdi
        let lowestPlatformY = 0;
        for (const ground of this.groundBodies) {
            if (!ground.broken && ground.pos.y < lowestPlatformY) {
                lowestPlatformY = ground.pos.y;
            }
        }
        const fallThreshold = lowestPlatformY - 15;
        if (ball.pos.y < fallThreshold) {
            events.push({ type: 'fall' });
        }

        return events;
    },

    reset() {
        this.bodies = [];
        this.groundBodies = [];
        this.triggerBodies = [];
        this.ballBody = null;
    }
};
