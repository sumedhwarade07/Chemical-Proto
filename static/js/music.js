/**
 * Ambient Study Music Controller
 * Supports HTML5 Audio with Web Audio API generative ambient synthesizer fallback
 * MANDATE: Never autoplays on first visit. Remembers user choice in localStorage.
 */

class LabMusicController {
  constructor() {
    this.audioElement = document.getElementById('lab-audio-player');
    this.toggleButton = document.getElementById('music-toggle-btn');
    this.buttonText = document.getElementById('music-btn-text');
    this.isPlaying = false;
    this.storageKey = 'detergent_lab_music_enabled';
    this.synthContext = null;
    this.synthGain = null;
    this.oscillators = [];

    this.init();
  }

  init() {
    if (!this.toggleButton) return;

    if (this.audioElement) {
      this.audioElement.volume = 0.25;
    }

    // Check user preference
    const savedState = localStorage.getItem(this.storageKey);

    // If user previously turned it on, bind one-time user interaction to resume
    // (since modern browsers block immediate autoplay without gesture)
    if (savedState === 'true') {
      const resumeOnGesture = () => {
        if (!this.isPlaying && localStorage.getItem(this.storageKey) === 'true') {
          this.play();
        }
        window.removeEventListener('click', resumeOnGesture);
        window.removeEventListener('keydown', resumeOnGesture);
      };
      window.addEventListener('click', resumeOnGesture, { once: true });
      window.addEventListener('keydown', resumeOnGesture, { once: true });
    }

    this.toggleButton.addEventListener('click', () => this.toggle());
  }

  toggle() {
    if (this.isPlaying) {
      this.pause();
      localStorage.setItem(this.storageKey, 'false');
    } else {
      this.play();
      localStorage.setItem(this.storageKey, 'true');
    }
  }

  play() {
    this.isPlaying = true;
    this.toggleButton.classList.add('playing');
    if (this.buttonText) this.buttonText.textContent = 'Mute Audio';

    if (this.audioElement && this.audioElement.src) {
      const playPromise = this.audioElement.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Fallback to generative Web Audio synth
          this.startAmbientSynth();
        });
      }
    } else {
      this.startAmbientSynth();
    }
  }

  pause() {
    this.isPlaying = false;
    this.toggleButton.classList.remove('playing');
    if (this.buttonText) this.buttonText.textContent = 'Study Audio';

    if (this.audioElement) {
      this.audioElement.pause();
    }
    this.stopAmbientSynth();
  }

  startAmbientSynth() {
    // Generate soothing low-frequency laboratory sine tones (432Hz harmonic series)
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      if (!this.synthContext) {
        this.synthContext = new AudioCtx();
      }
      if (this.synthContext.state === 'suspended') {
        this.synthContext.resume();
      }

      this.synthGain = this.synthContext.createGain();
      this.synthGain.gain.setValueAtTime(0.001, this.synthContext.currentTime);
      this.synthGain.gain.exponentialRampToValueAtTime(0.06, this.synthContext.currentTime + 2);
      this.synthGain.connect(this.synthContext.destination);

      // Frequencies for a tranquil atmospheric drone (C major 9 / 432Hz tuning)
      const freqs = [108, 162, 216, 270, 324];
      this.oscillators = freqs.map((f, i) => {
        const osc = this.synthContext.createOscillator();
        const panner = this.synthContext.createStereoPanner ? this.synthContext.createStereoPanner() : null;
        osc.type = i % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(f, this.synthContext.currentTime);

        if (panner) {
          panner.pan.value = (i - 2) * 0.35;
          osc.connect(panner);
          panner.connect(this.synthGain);
        } else {
          osc.connect(this.synthGain);
        }
        osc.start();
        return osc;
      });
    } catch (e) {
      console.warn('Web Audio Ambient Synthesizer unavailable:', e);
    }
  }

  stopAmbientSynth() {
    if (this.synthGain && this.synthContext) {
      try {
        this.synthGain.gain.exponentialRampToValueAtTime(0.0001, this.synthContext.currentTime + 0.5);
        setTimeout(() => {
          this.oscillators.forEach(osc => {
            try { osc.stop(); osc.disconnect(); } catch (err) {}
          });
          this.oscillators = [];
        }, 500);
      } catch (err) {}
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.labMusic = new LabMusicController();
});
