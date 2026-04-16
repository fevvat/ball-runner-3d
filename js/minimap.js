// ===== MINIMAP SYSTEM =====
// 2D minimap gösterimi + checkpoint gösterimi

const Minimap = {
    canvas: null,
    ctx: null,
    scale: 1.2,
    platforms: [],
    totalLength: 100,
    _finishPos: null,
    _checkpoints: [],
    _activeCheckpoints: new Set(),

    init() {
        this.canvas = document.getElementById('minimap');
        this.ctx = this.canvas.getContext('2d');
    },

    setLevel(platforms, totalLength) {
        this.platforms = platforms;
        this.totalLength = totalLength;
        this.scale = this.canvas.height / (totalLength + 20);
        this._activeCheckpoints = new Set();
    },

    setFinishPos(pos) {
        this._finishPos = pos;
    },

    // YENI: Checkpoint listesi kaydet
    setCheckpoints(checkpoints) {
        this._checkpoints = checkpoints || [];
        this._activeCheckpoints = new Set();
    },

    // YENI: Checkpoint aktif işaretle
    activateCheckpoint(idx) {
        this._activeCheckpoints.add(idx);
    },

    update(ballPos, theme) {
        if (!this.ctx) return;
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.clearRect(0, 0, w, h);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, w, h);

        const offsetY = h * 0.7 + ballPos.z * this.scale;
        const offsetX = w / 2;

        // Platformları çiz
        ctx.fillStyle = theme ? `rgba(${this._themeColorRgb()}, 0.5)` : 'rgba(100, 150, 100, 0.5)';
        for (const p of this.platforms) {
            const px = offsetX + (p.x - p.w / 2) * this.scale * 2;
            const py = offsetY + p.z * this.scale;
            const pw = p.w * this.scale * 2;
            const pd = p.d * this.scale;

            if (py < -20 || py > h + 20) continue;

            // Platform tipi renklemesi
            if (p.bounce) {
                ctx.fillStyle = 'rgba(68, 204, 68, 0.6)';
            } else if (p.ice) {
                ctx.fillStyle = 'rgba(136, 204, 255, 0.6)';
            } else if (p.breakable) {
                ctx.fillStyle = 'rgba(170, 102, 51, 0.6)';
            } else {
                ctx.fillStyle = theme ? `rgba(${this._themeColorRgb()}, 0.5)` : 'rgba(100, 150, 100, 0.5)';
            }

            ctx.fillRect(px, py, pw, Math.max(pd, 2));
        }

        // Checkpointleri çiz
        for (let i = 0; i < this._checkpoints.length; i++) {
            const cp = this._checkpoints[i];
            const cy = offsetY + cp.z * this.scale;
            if (cy < -10 || cy > h + 10) continue;

            const isActive = this._activeCheckpoints.has(i);
            ctx.fillStyle = isActive ? '#6bcb77' : 'rgba(107, 203, 119, 0.4)';
            ctx.fillRect(offsetX - 8, cy, 16, 2);

            ctx.fillStyle = isActive ? '#6bcb77' : 'rgba(107, 203, 119, 0.5)';
            ctx.font = '8px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(isActive ? '✓' : '○', offsetX - 10, cy + 2);
        }

        // Bitiş noktası
        if (this._finishPos) {
            const fy = offsetY + this._finishPos.z * this.scale;
            ctx.fillStyle = '#6bcb77';
            ctx.beginPath();
            ctx.arc(offsetX, fy, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('🏁', offsetX, fy - 8);
        }

        // Top pozisyonu
        const bx = offsetX + ballPos.x * this.scale * 2;
        const by = offsetY + ballPos.z * this.scale;

        const gradient = ctx.createRadialGradient(bx, by, 0, bx, by, 8);
        gradient.addColorStop(0, 'rgba(77, 150, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(77, 150, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(bx, by, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#4d96ff';
        ctx.beginPath();
        ctx.arc(bx, by, 3, 0, Math.PI * 2);
        ctx.fill();

        // İlerleme çubuğu
        const progress = Math.min(1, Math.abs(ballPos.z) / this.totalLength);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(2, 2, 4, h - 4);
        ctx.fillStyle = '#4d96ff';
        ctx.fillRect(2, 2, 4, (h - 4) * progress);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.floor(progress * 100)}%`, w / 2, h - 5);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
    },

    _themeColorRgb() {
        const colors = {
            1: '74, 140, 63',
            2: '68, 68, 170',
            3: '85, 85, 85'
        };
        return colors[Levels.currentLevel] || '100, 100, 100';
    }
};
