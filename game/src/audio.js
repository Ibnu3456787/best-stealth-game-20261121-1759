// AudioSynth — every sound is synthesized live with WebAudio. No audio files:
// footsteps are short filtered noise bursts panned by where the sound comes
// from relative to the player, the coin is a bright ping, the alarm is a low
// drone with a sting, and a soft hum runs underneath the game. Everything is
// guarded so the game still runs when audio is unavailable (headless tests,
// a browser that blocks autoplay); M toggles mute.
export function createAudio() {
  const api = {
    muted: false,
    context: null,
    master: null,
    hum: null,
  };

  // Build the context lazily, on the first user gesture, so browsers that
  // block autoplay do not refuse it. Safe to call any time; does nothing
  // when WebAudio is missing.
  function ensure() {
    if (api.context) {
      if (api.context.state === 'suspended') api.context.resume().catch(() => {});
      return true;
    }
    try {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return false;
      api.context = new Ctor();
      api.master = api.context.createGain();
      api.master.gain.value = api.muted ? 0 : 0.5;
      api.master.connect(api.context.destination);
      startHum();
      return true;
    } catch {
      return false;
    }
  }

  function startHum() {
    try {
      const ctx = api.context;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 55;
      const gain = ctx.createGain();
      gain.gain.value = 0.035;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.11;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.012;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      osc.connect(gain);
      gain.connect(api.master);
      osc.start();
      lfo.start();
      api.hum = { osc, lfo };
    } catch {
      // The hum is ambience; the game plays fine without it.
    }
  }

  // Pan -1 (far left) to 1 (far right), from the sound's direction relative
  // to the player.
  function panner(pan) {
    const ctx = api.context;
    if (typeof ctx.createStereoPanner === 'function') {
      const node = ctx.createStereoPanner();
      node.pan.value = Math.max(-1, Math.min(1, pan));
      node.connect(api.master);
      return node;
    }
    return api.master;
  }

  function noiseBurst(duration, filterFreq, volume, pan) {
    if (!ensure()) return;
    try {
      const ctx = api.context;
      const len = Math.max(1, Math.floor(ctx.sampleRate * duration));
      const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = filterFreq;
      const gain = ctx.createGain();
      gain.gain.value = volume;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(panner(pan));
      source.start();
    } catch {
      // A missed footstep never stops the game.
    }
  }

  function tone(freq, duration, type, volume, pan, slideTo) {
    if (!ensure()) return;
    try {
      const ctx = api.context;
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + duration);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(panner(pan));
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // A missed ping never stops the game.
    }
  }

  api.ensure = ensure;
  api.footstep = (pan) => noiseBurst(0.07, 900, 0.16, pan);
  api.guardStep = (pan) => noiseBurst(0.06, 500, 0.1, pan);
  api.coin = () => {
    tone(1568, 0.28, 'sine', 0.22, 0);
    tone(2093, 0.2, 'sine', 0.12, 0);
  };
  api.page = () => tone(880, 0.12, 'triangle', 0.16, 0);
  api.alarm = () => {
    tone(220, 0.7, 'sawtooth', 0.2, 0, 110);
    tone(440, 0.5, 'square', 0.08, 0, 330);
  };
  api.click = () => tone(660, 0.06, 'triangle', 0.12, 0);
  api.clear = () => {
    tone(523, 0.14, 'triangle', 0.16, 0);
    setTimeout(() => tone(784, 0.2, 'triangle', 0.16, 0), 130);
  };
  api.caught = () => tone(196, 0.5, 'sawtooth', 0.2, 0, 98);
  api.setMuted = (muted) => {
    api.muted = muted;
    if (api.master) api.master.gain.value = muted ? 0 : 0.5;
  };
  return api;
}

// A silent stand-in with the same methods, for headless tests and for any
// caller that runs without a browser.
export function createSilentAudio() {
  const noop = () => {};
  return {
    muted: false,
    ensure: () => false,
    footstep: noop,
    guardStep: noop,
    coin: noop,
    page: noop,
    alarm: noop,
    click: noop,
    clear: noop,
    caught: noop,
    setMuted: noop,
  };
}
