import { SongPreset } from "../types";

export const PRESET_SONGS: SongPreset[] = [
  {
    id: "ecos-andromeda",
    title: "Ecos Cósmicos de Andrómeda",
    duration: 90, // 1m 30s
    genre: "Space Ambient / Drone, 60 BPM",
    poeticPrompt: "Un viaje interestelar solitario, nebulosas de hidrógeno rojo, el eco de civilizaciones extintas flotando en la gravedad.",
    syntheticSeedFreq: 110, // A2 note for deep soundscapes
    storyIdea: "Una sonda solitaria capta transmisiones de luz de una galaxia muerta. Los subtítulos narran la asimilación de la nostalgia artificial en la inmensidad estelar.",
  },
  {
    id: "susurros-abedules",
    title: "Susurros entre los Abedules",
    duration: 120, // 2m 00s
    genre: "Neo-classical / Melancólico, 52 BPM",
    poeticPrompt: "Hojas muertas cayendo sobre un río helado, la transición del otoño al invierno, recuerdos mudos de la infancia.",
    syntheticSeedFreq: 130.81, // C3 note for warm melancholic pads
    storyIdea: "Un anciano regresa al último bosque de su infancia. Conforme caen los copos, revive en su mente la última conversación silenciada por el viento.",
  },
  {
    id: "vuelo-icaro",
    title: "El Ascenso Ciego de Ícaro",
    duration: 150, // 2m 30s
    genre: "Orquestal Minimalista / Industrial, 72 BPM",
    poeticPrompt: "La ascensión incontrolable, calor insoportable en las alas de cera, mirar directamente al sol eterno con devoción mística.",
    syntheticSeedFreq: 98, // G2 note for high tension
    storyIdea: "La obsesión de un tejedor de alas mecánicas. Subtítulos abstractos sobre la fundición del metal, los hilos de oro quemados y la gloriosa caída al abismo azul.",
  },
  {
    id: "lluvia-kyoto",
    title: "Lluvia de Monzón sobre Kioto",
    duration: 180, // 3m 00s
    genre: "Oriental Folk / Lo-Fi Zen, 48 BPM",
    poeticPrompt: "Jardines de musgo empapados de agua pura, el olor de la tierra mojada después de un calor sofocante, el sonido de campanas distantes.",
    syntheticSeedFreq: 146.83, // D3 note for calm zen focus
    storyIdea: "Un monje en silencio contempla las gotas deslizándose en una linterna del jardín. Cada gota representa el nacimiento de un universo transitorio."
  }
];

// Web Audio API Procedural Synthesizer to play ethereal, mystical ambient sounds
export class RealtimeAmbientSynth {
  private ctx: AudioContext | null = null;
  private oscillators: OscillatorNode[] = [];
  private gains: GainNode[] = [];
  private filter: BiquadFilterNode | null = null;
  private masterGain: GainNode | null = null;
  private dynamicInterval: any = null;

  constructor() {}

  public start(baseFreq: number) {
    this.stop(); // Stop any existing audio

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      
      // Low pass filter with nice sweep
      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = "lowpass";
      this.filter.frequency.setValueAtTime(400, this.ctx.currentTime);
      this.filter.Q.setValueAtTime(3, this.ctx.currentTime);

      this.filter.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      // Create a rich minor 7th chord or mystical suspension chord over multiple octaves
      // Harmonics based on the base frequency: 1x (Root), 1.5x (Perfect 5th), 1.2x (Minor 3rd), 1.8x (Colossal 7th)
      const ratios = [0.5, 1.0, 1.2, 1.5, 1.8, 2.0, 3.0];
      
      ratios.forEach((ratio, idx) => {
        if (!this.ctx || !this.filter) return;

        const osc = this.ctx.createOscillator();
        // Give variation: sine, triangle, sawtooth for rich textures
        osc.type = idx % 2 === 0 ? "triangle" : "sine";
        osc.frequency.setValueAtTime(baseFreq * ratio, this.ctx.currentTime);

        const g = this.ctx.createGain();
        // Each higherharmonic gets much softer as standard acoustic physics
        const targetVol = (0.15 / ratios.length) * (1 / (ratio * 0.8));
        g.gain.setValueAtTime(0.001, this.ctx.currentTime);
        g.gain.linearRampToValueAtTime(targetVol, this.ctx.currentTime + 3.0); // Slow fade-in

        // Connect
        osc.connect(g);
        g.connect(this.filter);
        osc.start();

        this.oscillators.push(osc);
        this.gains.push(g);
      });

      // Slowly open the master volume to prevent clipping clicks
      this.masterGain.gain.linearRampToValueAtTime(0.8, this.ctx.currentTime + 2.5);

      // Introduce a slow filter sweep LFO in real-time
      let angle = 0;
      this.dynamicInterval = setInterval(() => {
        if (!this.ctx || !this.filter) return;
        // Sweep filter between 200Hz and 900Hz every 15 seconds
        const currentFreq = 500 + Math.sin(angle) * 280;
        this.filter.frequency.linearRampToValueAtTime(currentFreq, this.ctx.currentTime + 0.15);
        angle += 0.05;
      }, 150);

    } catch (e) {
      console.error("No se pudo inicializar RealtimeAmbientSynth:", e);
    }
  }

  public stop() {
    if (this.dynamicInterval) {
      clearInterval(this.dynamicInterval);
      this.dynamicInterval = null;
    }

    try {
      this.gains.forEach((g, idx) => {
        if (this.ctx) {
          g.gain.cancelScheduledValues(this.ctx.currentTime);
          g.gain.setValueAtTime(g.gain.value, this.ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.2); // Smooth fade-out clickless
        }
      });

      if (this.masterGain && this.ctx) {
        this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.masterGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.5);
      }

      setTimeout(() => {
        this.oscillators.forEach(osc => {
          try {
            osc.stop();
          } catch(err) {}
        });
        if (this.ctx && this.ctx.state !== "closed") {
          this.ctx.close();
        }
        this.oscillators = [];
        this.gains = [];
        this.ctx = null;
        this.filter = null;
        this.masterGain = null;
      }, 1600);
      
    } catch (err) {
      console.warn("Error dunate parada de RealtimeAmbientSynth:", err);
    }
  }

  public isPlaying(): boolean {
    return this.ctx !== null && this.ctx.state === "running";
  }
}
