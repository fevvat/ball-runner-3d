// ===== UI SYSTEM =====
// Menü, skor, leaderboard yönetimi + ses toggle butonları

const UI = {
    selectedLevel: 1,
    playerName: 'Oyuncu',

    _scoreEl: null,
    _distEl: null,
    _livesEl: null,

    init() {
        this._scoreEl = document.getElementById('hud-score');
        this._distEl = document.getElementById('hud-distance');
        this._livesEl = document.getElementById('hud-lives');
        this._setupMenuEvents();
        this._setupLeaderboard();
    },

    _setupMenuEvents() {
        const levelBtns = document.querySelectorAll('.level-btn');
        levelBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                levelBtns.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.selectedLevel = parseInt(btn.dataset.level);
            });
        });
        levelBtns[0].classList.add('selected');

        document.getElementById('play-btn').addEventListener('click', () => {
            const nameInput = document.getElementById('player-name');
            this.playerName = nameInput.value.trim() || 'Oyuncu';
            this.hideMenu();
            Game.start(this.selectedLevel);
        });

        document.getElementById('player-name').addEventListener('keydown', (e) => {
            if (e.code === 'Enter') {
                document.getElementById('play-btn').click();
            }
        });

        document.getElementById('show-leaderboard').addEventListener('click', () => {
            this.showLeaderboard();
        });
        document.getElementById('close-leaderboard').addEventListener('click', () => {
            this.hideLeaderboard();
        });

        const mobilePauseBtn = document.getElementById('mobile-pause');
        if (mobilePauseBtn) {
            mobilePauseBtn.addEventListener('click', () => {
                if (Game.state === 'playing') Game.pause();
                else if (Game.state === 'paused') Game.resume();
            });
        }

        document.getElementById('resume-btn').addEventListener('click', () => {
            Game.resume();
        });
        document.getElementById('restart-btn').addEventListener('click', () => {
            Game.restart();
        });
        document.getElementById('quit-btn').addEventListener('click', () => {
            Game.quit();
        });

        // Ses toggle butonları (pause menüsünde)
        const soundBtn = document.getElementById('toggle-sound-btn');
        const musicBtn = document.getElementById('toggle-music-btn');
        if (soundBtn) {
            soundBtn.addEventListener('click', () => {
                const on = Game.toggleSound();
                soundBtn.textContent = on ? '🔊 Ses: Açık' : '🔇 Ses: Kapalı';
            });
        }
        if (musicBtn) {
            musicBtn.addEventListener('click', () => {
                const on = Game.toggleMusic();
                musicBtn.textContent = on ? '🎵 Müzik: Açık' : '🎵 Müzik: Kapalı';
            });
        }

        document.getElementById('play-again-btn').addEventListener('click', () => {
            Game.restart();
        });
        document.getElementById('gameover-menu-btn').addEventListener('click', () => {
            Game.quit();
        });

        document.getElementById('next-level-btn').addEventListener('click', () => {
            // DÜZELTME: Level 3 tamamlandıysa "Tekrar Oyna" gibi davran
            if (this.selectedLevel >= 3) {
                Game.restart();
            } else {
                const nextLevel = this.selectedLevel + 1;
                this.selectedLevel = nextLevel;
                Game.start(nextLevel);
            }
        });
        document.getElementById('lc-menu-btn').addEventListener('click', () => {
            Game.quit();
        });

        document.querySelectorAll('.lb-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.renderLeaderboard(tab.dataset.level);
            });
        });

        window.addEventListener('keydown', (e) => {
            if (e.code === 'Escape') {
                if (Game.state === 'playing') {
                    Game.pause();
                } else if (Game.state === 'paused') {
                    Game.resume();
                }
                const lb = document.getElementById('leaderboard-modal');
                if (lb.style.display !== 'none') {
                    this.hideLeaderboard();
                }
            }
        });
    },

    _setupLeaderboard() {
        if (!localStorage.getItem('ballrunner_leaderboard')) {
            localStorage.setItem('ballrunner_leaderboard', JSON.stringify([]));
        }
    },

    showMenu() {
        this._fadeIn('main-menu', 'flex');
        document.getElementById('hud').style.display = 'none';
        document.getElementById('pause-menu').style.display = 'none';
        document.getElementById('gameover-screen').style.display = 'none';
        document.getElementById('level-complete').style.display = 'none';
        const mobile = document.getElementById('mobile-controls');
        if (mobile) mobile.style.display = 'none';
    },

    hideMenu() {
        this._fadeOut('main-menu');
    },

    showHUD() {
        document.getElementById('hud').style.display = 'block';
        document.getElementById('hud-powerup').style.display = 'none';
        document.getElementById('hud-combo').style.display = 'none';
        const mobile = document.getElementById('mobile-controls');
        if (mobile) mobile.style.display = Controls.isMobile ? 'block' : 'none';
    },

    hideHUD() {
        document.getElementById('hud').style.display = 'none';
        const mobile = document.getElementById('mobile-controls');
        if (mobile) mobile.style.display = 'none';
    },

    updateScore(score) {
        if (this._scoreEl) this._scoreEl.textContent = Math.floor(score);
    },

    updateDistance(distance) {
        if (this._distEl) this._distEl.textContent = Math.floor(distance);
    },

    updateLives(lives) {
        if (!this._livesEl) return;
        let hearts = '';
        for (let i = 0; i < 3; i++) {
            if (i < lives) {
                hearts += '<span class="heart-icon alive">❤️</span>';
            } else {
                hearts += '<span class="heart-icon dead">🖤</span>';
            }
        }
        this._livesEl.innerHTML = hearts;

        if (lives < 3) {
            const deadHearts = this._livesEl.querySelectorAll('.heart-icon.dead');
            if (deadHearts.length > 0) {
                const last = deadHearts[deadHearts.length - 1];
                last.style.animation = 'heart-break 0.5s ease-out';
            }
        }
    },

    showCombo(multiplier) {
        const el = document.getElementById('hud-combo');
        const valEl = document.getElementById('combo-value');
        valEl.textContent = multiplier;
        el.style.display = 'block';

        if (multiplier >= 8) {
            el.style.background = 'linear-gradient(135deg, #ff0000, #ff6600)';
            el.style.webkitBackgroundClip = 'text';
        } else if (multiplier >= 5) {
            el.style.background = 'linear-gradient(135deg, #ff6600, #ffd93d)';
            el.style.webkitBackgroundClip = 'text';
        } else {
            el.style.background = 'linear-gradient(135deg, #ff6b6b, #ffd93d)';
            el.style.webkitBackgroundClip = 'text';
        }

        clearTimeout(this._comboTimeout);
        this._comboTimeout = setTimeout(() => {
            el.style.display = 'none';
        }, 2500);
    },

    // YENI: Combo gizle
    hideCombo() {
        const el = document.getElementById('hud-combo');
        if (el) el.style.display = 'none';
        clearTimeout(this._comboTimeout);
    },

    showCheckpoint(text = '✓ Checkpoint') {
        const el = document.getElementById('hud-checkpoint');
        const textEl = document.getElementById('checkpoint-text');
        if (!el || !textEl) return;

        textEl.textContent = text;
        el.style.display = 'block';
        el.style.animation = 'none';
        void el.offsetWidth;
        el.style.animation = 'checkpoint-pop 2s ease-out forwards';

        clearTimeout(this._checkpointTimeout);
        this._checkpointTimeout = setTimeout(() => {
            el.style.display = 'none';
        }, 1900);
    },

    showScorePopup(text, x, y, color = '#ffd93d') {
        const popup = document.createElement('div');
        popup.className = 'score-popup';
        popup.textContent = text;
        popup.style.left = `${Math.max(10, Math.min(window.innerWidth - 100, x))}px`;
        popup.style.top = `${Math.max(10, Math.min(window.innerHeight - 40, y))}px`;
        popup.style.color = color;
        document.body.appendChild(popup);
        setTimeout(() => popup.remove(), 1000);
    },

    showPause() {
        document.getElementById('pause-menu').style.display = 'block';
        const mobile = document.getElementById('mobile-controls');
        if (mobile) mobile.style.display = 'none';
    },

    hidePause() {
        document.getElementById('pause-menu').style.display = 'none';
        const mobile = document.getElementById('mobile-controls');
        if (mobile && Controls.isMobile && Game.state === 'playing') {
            mobile.style.display = 'block';
        }
    },

    showGameOver(stats) {
        document.getElementById('gameover-screen').style.display = 'block';

        this._animateNumber('final-score', 0, Math.floor(stats.score), 1000);
        document.getElementById('final-distance').textContent = `${Math.floor(stats.distance)}m`;
        document.getElementById('final-combo').textContent = `x${stats.maxCombo}`;
        document.getElementById('final-coins').textContent = stats.coins;

        const rank = this.addToLeaderboard(stats);
        const rankEl = document.getElementById('gameover-rank');
        if (rank <= 10) {
            rankEl.style.display = 'block';
            document.getElementById('rank-number').textContent = rank;
        } else {
            rankEl.style.display = 'none';
        }
    },

    hideGameOver() {
        document.getElementById('gameover-screen').style.display = 'none';
    },

    showLevelComplete(stats) {
        document.getElementById('level-complete').style.display = 'block';

        this._animateNumber('lc-score', 0, Math.floor(stats.score), 800);
        setTimeout(() => {
            this._animateNumber('lc-time-bonus', 0, Math.floor(stats.timeBonus), 600, '+');
        }, 400);
        setTimeout(() => {
            this._animateNumber('lc-total', 0, Math.floor(stats.score + stats.timeBonus), 800);
        }, 800);

        const nextBtn = document.getElementById('next-level-btn');
        // DÜZELTME: Level 3 bittikten sonra "Tekrar Oyna" göster
        nextBtn.textContent = this.selectedLevel >= 3 ? 'Tekrar Oyna' : 'Sonraki Level';

        this.addToLeaderboard({ ...stats, score: stats.score + stats.timeBonus });
    },

    hideLevelComplete() {
        document.getElementById('level-complete').style.display = 'none';
    },

    _animateNumber(elementId, from, to, duration, prefix = '') {
        const el = document.getElementById(elementId);
        if (!el) return;
        const start = performance.now();
        const animate = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            const current = Math.floor(from + (to - from) * eased);
            el.textContent = prefix + current.toLocaleString();
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    },

    _fadeIn(id, display = 'block') {
        const el = document.getElementById(id);
        el.style.opacity = '0';
        el.style.display = display;
        el.style.transition = 'opacity 0.3s ease';
        requestAnimationFrame(() => {
            el.style.opacity = '1';
        });
    },

    _fadeOut(id) {
        const el = document.getElementById(id);
        el.style.transition = 'opacity 0.3s ease';
        el.style.opacity = '0';
        setTimeout(() => {
            el.style.display = 'none';
            el.style.opacity = '1';
        }, 300);
    },

    addToLeaderboard(stats) {
        const entries = JSON.parse(localStorage.getItem('ballrunner_leaderboard') || '[]');
        const entry = {
            name: this.playerName,
            score: Math.floor(stats.score),
            level: this.selectedLevel,
            distance: Math.floor(stats.distance),
            date: Date.now()
        };
        entries.push(entry);
        entries.sort((a, b) => b.score - a.score);
        if (entries.length > 100) entries.length = 100;
        localStorage.setItem('ballrunner_leaderboard', JSON.stringify(entries));
        return entries.findIndex(e => e === entry) + 1;
    },

    showLeaderboard() {
        document.getElementById('leaderboard-modal').style.display = 'block';
        this.renderLeaderboard('all');
    },

    hideLeaderboard() {
        document.getElementById('leaderboard-modal').style.display = 'none';
    },

    renderLeaderboard(levelFilter) {
        const entries = JSON.parse(localStorage.getItem('ballrunner_leaderboard') || '[]');
        let filtered = entries;
        if (levelFilter !== 'all') {
            filtered = entries.filter(e => e.level === parseInt(levelFilter));
        }

        const list = document.getElementById('leaderboard-list');
        if (filtered.length === 0) {
            list.innerHTML = '<p style="color: rgba(255,255,255,0.4); padding: 30px;">Henüz kayıt yok</p>';
            return;
        }

        const levelNames = { 1: 'Orman', 2: 'Uzay', 3: 'Lav' };
        const medals = ['🥇', '🥈', '🥉'];
        list.innerHTML = filtered.slice(0, 10).map((entry, i) => `
            <div class="lb-entry" style="animation-delay: ${i * 0.05}s">
                <div class="lb-rank">${i < 3 ? medals[i] : i + 1}</div>
                <div class="lb-name">${this._escapeHtml(entry.name)}</div>
                <div class="lb-level">${levelNames[entry.level] || '?'}</div>
                <div class="lb-score">${entry.score.toLocaleString()}</div>
            </div>
        `).join('');
    },

    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};
