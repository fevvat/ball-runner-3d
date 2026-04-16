// ===== AUDIO SYSTEM =====
// Web Audio API ile procedural ses efektleri + ses kontrolü

const AudioSystem = {
    ctx: null,
    masterGain: null,
    musicGain: null,
    sfxGain: null,
    initialized: false,
    musicPlaying: false,
    musicNodes: [],

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.5;
            this.masterGain.connect(this.ctx.destination);

            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.value = 0.3;
            this.musicGain.connect(this.masterGain);

            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.value = 0.6;
            this.sfxGain.connect(this.masterGain);

            this.initialized = true;
        } catch (e) {
            console.warn('Audio not available:', e);
        }
    },

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    // Ses seviyesi kontrolü (YENI)
    setMasterVolume(val) {
        if (this.masterGain) this.masterGain.gain.value = val;
    },
    setMusicVolume(val) {
        if (this.musicGain) this.musicGain.gain.value = val;
    },
    setSfxVolume(val) {
        if (this.sfxGain) this.sfxGain.gain.value = val;
    },

    setPaused(isPaused) {
        if (!this.initialized || !this.ctx) return;
        const now = this.ctx.currentTime;

        if (isPaused) {
            if (this.musicGain) this.musicGain.gain.linearRampToValueAtTime(Math.min(this.musicGain.gain.value, 0.08), now + 0.12);
            if (this.sfxGain) this.sfxGain.gain.linearRampToValueAtTime(Math.min(this.sfxGain.gain.value, 0.18), now + 0.12);
            if (this._rollGain) this._rollGain.gain.linearRampToValueAtTime(0.001, now + 0.08);
            return;
        }

        const musicTarget = (typeof Game !== 'undefined' && Game.musicEnabled) ? 0.3 : 0;
        const sfxTarget = (typeof Game !== 'undefined' && Game.soundEnabled) ? 0.6 : 0;
        if (this.musicGain) this.musicGain.gain.linearRampToValueAtTime(musicTarget, now + 0.15);
        if (this.sfxGain) this.sfxGain.gain.linearRampToValueAtTime(sfxTarget, now + 0.15);
    },

    playTone(freq, duration, type = 'sine', gainVal = 0.3) {
        if (!this.initialized) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    },

    playNoise(duration, gainVal = 0.1) {
        if (!this.initialized) return;
        const bufferSize = Math.floor(this.ctx.sampleRate * duration);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        source.start();
    },

    playCoinCollect() {
        this.playTone(880, 0.1, 'sine', 0.2);
        setTimeout(() => this.playTone(1175, 0.15, 'sine', 0.2), 50);
        setTimeout(() => this.playTone(1760, 0.2, 'sine', 0.15), 100);
    },

    playPowerUp() {
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.2, 'sine', 0.2), i * 60);
        });
    },

    playHit() {
        this.playNoise(0.2, 0.35);
        this.playTone(120, 0.25, 'sawtooth', 0.2);
        setTimeout(() => this.playTone(80, 0.15, 'square', 0.1), 50);
    },

    playJump() {
        if (!this.initialized) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(250, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    },

    playBreak() {
        this.playNoise(0.35, 0.3);
        this.playTone(180, 0.15, 'square', 0.12);
        setTimeout(() => this.playTone(90, 0.25, 'square', 0.1), 80);
        setTimeout(() => this.playNoise(0.15, 0.15), 120);
    },

    playBounce() {
        if (!this.initialized) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(900, this.ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    },

    playFall() {
        if (!this.initialized) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 1.0);
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.0);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 1.0);
    },

    playLaser() {
        if (!this.initialized) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 800;
        filter.Q.value = 5;
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    },

    playCheckpoint() {
        // Yeni: checkpoint sesi
        if (!this.initialized) return;
        const notes = [523, 659, 784];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.18, 'sine', 0.15), i * 80);
        });
    },

    playGameOver() {
        const notes = [440, 370, 330, 262];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.5, 'sine', 0.2), i * 250);
        });
    },

    playLevelComplete() {
        const notes = [523, 659, 784, 1047, 784, 1047, 1319, 1568];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.3, 'sine', 0.2), i * 100);
        });
    },

    playCombo(level) {
        const baseFreq = 440 + level * 110;
        this.playTone(baseFreq, 0.12, 'sine', 0.15);
        setTimeout(() => this.playTone(baseFreq * 1.5, 0.1, 'sine', 0.12), 40);
        if (level >= 5) {
            setTimeout(() => this.playTone(baseFreq * 2, 0.08, 'sine', 0.1), 80);
        }
    },

    startMusic(theme) {
        if (!this.initialized || this.musicPlaying) return;
        this.musicPlaying = true;

        const scales = {
            forest: [262, 294, 330, 349, 392, 440, 494, 523],
            space:  [262, 311, 330, 392, 415, 523, 622, 660],
            lava:   [262, 277, 330, 349, 415, 440, 523, 554]
        };
        const scale = scales[theme] || scales.forest;

        let noteIndex = 0;
        const patterns = [0, 2, 4, 5, 4, 2, 3, 1];

        const playNote = () => {
            if (!this.musicPlaying) return;
            const patIdx = patterns[noteIndex % patterns.length];
            const note = scale[patIdx % scale.length];
            const octaveShift = Math.random() > 0.7 ? 2 : 1;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = Math.random() > 0.5 ? 'sine' : 'triangle';
            osc.frequency.value = note * octaveShift;
            gain.gain.setValueAtTime(0.07, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.9);
            osc.connect(gain);
            gain.connect(this.musicGain);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.9);

            noteIndex++;
            const delay = 250 + (noteIndex % 2 === 0 ? 100 : 200);
            this._musicTimer = setTimeout(playNote, delay);
        };

        const bass = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bass.type = 'sine';
        bass.frequency.value = theme === 'lava' ? 55 : theme === 'space' ? 65 : 73;
        bassGain.gain.value = 0.06;
        bass.connect(bassGain);
        bassGain.connect(this.musicGain);
        bass.start();
        this._bassDrone = bass;
        this._bassDroneGain = bassGain;

        playNote();
    },

    stopMusic() {
        this.musicPlaying = false;
        if (this._musicTimer) clearTimeout(this._musicTimer);

        if (this._bassDrone && this._bassDroneGain) {
            try {
                this._bassDroneGain.gain.setValueAtTime(this._bassDroneGain.gain.value, this.ctx.currentTime);
                this._bassDroneGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
                setTimeout(() => {
                    try { this._bassDrone.stop(); } catch(e) {}
                    this._bassDrone = null;
                    this._bassDroneGain = null;
                }, 600);
            } catch(e) {
                try { this._bassDrone.stop(); } catch(e2) {}
            }
        }
        this.musicNodes = [];
    },

    startRollSound() {
        if (!this.initialized || this._rollOsc) return;
        this._rollOsc = this.ctx.createOscillator();
        this._rollGain = this.ctx.createGain();
        this._rollFilter = this.ctx.createBiquadFilter();
        this._rollOsc.type = 'sawtooth';
        this._rollOsc.frequency.value = 60;
        this._rollFilter.type = 'lowpass';
        this._rollFilter.frequency.value = 200;
        this._rollGain.gain.value = 0;
        this._rollOsc.connect(this._rollFilter);
        this._rollFilter.connect(this._rollGain);
        this._rollGain.connect(this.sfxGain);
        this._rollOsc.start();
    },

    updateRollSound(speed) {
        if (!this._rollOsc) return;
        const vol = Math.min(speed * 0.015, 0.07);
        this._rollGain.gain.value = vol;
        this._rollFilter.frequency.value = 100 + speed * 12;
        this._rollOsc.frequency.value = 40 + speed * 3;
    },

    stopRollSound() {
        if (this._rollOsc) {
            try { this._rollOsc.stop(); } catch(e) {}
            this._rollOsc = null;
        }
    }
};
