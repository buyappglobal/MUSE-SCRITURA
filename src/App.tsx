import React, { useState, useEffect, useRef } from "react";
import { SubtitleBlock, SongPreset, GenerationResult } from "./types";
import { PRESET_SONGS, RealtimeAmbientSynth } from "./data/presets";
import { parseSRT, compileSRT, formatSecondsToTimestamp } from "./utils/srtParser";
import { PresentationScreen } from "./components/PresentationScreen";
import { SrtEditor } from "./components/SrtEditor";
import { 
  Sparkles, 
  Upload, 
  Music, 
  Clock, 
  Compass, 
  AlertCircle, 
  FileAudio, 
  X, 
  Database,
  Film,
  Dribbble,
  Radio,
  Palette
} from "lucide-react";

// Pre-load default initial dataset based on the first preset "Ecos Cósmicos de Andrómeda"
const INITIAL_PRESET = PRESET_SONGS[0];
const INITIAL_SRT = `1
00:00:00,000 --> 00:00:09,000
Un latido lejano vibra en el espectro del vacío sideral.

2
00:00:09,000 --> 00:00:18,000
Las frecuencias del hidrógeno revelan las primeras coordenadas mudas.

3
00:00:18,000 --> 00:00:28,000
Navegamos a través de nubes frías de polvo y recuerdos artificiales.

4
00:00:28,000 --> 00:00:39,000
Ninguna voz responde desde los cañones oscuros de Andrómeda.

5
00:00:39,000 --> 00:00:50,000
La luz de una estrella cansada se refracta sobre las alas de titanio.

6
00:00:50,050 --> 00:01:02,000
Nuestra huella en el tiempo no es más que una onda que se desvanece...

7
00:01:02,000 --> 00:01:14,000
El silencio final se traga el murmullo de los últimos osciladores.

8
00:01:14,000 --> 00:01:30,000
Flotamos libres... disueltos en la inmensidad del infinito azul.`;

const LOADING_MESSAGES = [
  "Sintonizando el espectro armónico de la vibración musical...",
  "Invocando la voz literaria del guionista interior...",
  "Analizando contrastes emocionales, silencios y contrastes acústicos...",
  "Componiendo metáforas visuales de alta carga mística...",
  "Distribuyendo bloques temporales con precisión cinemática...",
  "Tejiendo narrativa y sonido en un formato SRT simétrico e íntegro...",
  "Puliendo las transiciones sensoriales del guion..."
];

export default function App() {
  // Configuración de colores de énfasis dinámicos
  const ACCENT_COLORS = [
    { id: "violet", name: "Violeta Cósmico", rgb: "139, 92, 246" },
    { id: "emerald", name: "Verde Esmeralda", rgb: "16, 185, 129" },
    { id: "cyan", name: "Azul Sideral", rgb: "6, 182, 212" },
    { id: "amber", name: "Ámbar Místico", rgb: "245, 158, 11" },
    { id: "rose", name: "Rosa Aurora", rgb: "244, 63, 94" },
  ];

  const [accentId, setAccentId] = useState(() => {
    return localStorage.getItem("muse-accent-color") || "violet";
  });

  const activeAccent = ACCENT_COLORS.find(c => c.id === accentId) || ACCENT_COLORS[0];

  useEffect(() => {
    localStorage.setItem("muse-accent-color", accentId);
    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty("--accent-rgb", activeAccent.rgb);
    }
  }, [accentId, activeAccent]);

  // Inputs States
  const [title, setTitle] = useState(INITIAL_PRESET.title);
  const [duration, setDuration] = useState(INITIAL_PRESET.duration); // in seconds
  const [mins, setMins] = useState(1);
  const [secs, setSecs] = useState(30);
  const [poeticPrompt, setPoeticPrompt] = useState(INITIAL_PRESET.poeticPrompt);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(INITIAL_PRESET.id);

  // Audio Files States
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [audioMimeType, setAudioMimeType] = useState<string | null>(null);

  // Generated Content States
  const [srtContent, setSrtContent] = useState(INITIAL_SRT);
  const [compiledBlocks, setCompiledBlocks] = useState<SubtitleBlock[]>([]);
  const [storySummary, setStorySummary] = useState(INITIAL_PRESET.storyIdea);
  const [interpretation, setInterpretation] = useState(
    "El tono es hipnótico, denso e inmóvil. El sintetizador de fonón cósmico induce un estado de introspección profunda mediante el latido rítmico de sus acordes menores."
  );

  // Player Playback States
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // App Flow status states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loaderMsgIdx, setLoaderMsgIdx] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // References
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ambientSynthRef = useRef<RealtimeAmbientSynth | null>(null);

  // Parse initial default SRT upon boot
  useEffect(() => {
    setCompiledBlocks(parseSRT(INITIAL_SRT));
    ambientSynthRef.current = new RealtimeAmbientSynth();
    return () => {
      if (ambientSynthRef.current) {
        ambientSynthRef.current.stop();
      }
    };
  }, []);

  // Update total duration numbers when mins or secs input blocks are changed
  const handleTimeNumsChange = (newMins: number, newSecs: number) => {
    setMins(newMins);
    setSecs(newSecs);
    const totalSecs = (newMins * 60) + newSecs;
    setDuration(totalSecs);
    setSelectedPresetId(null); // Clear active preset since they customized timing
  };

  // Keep mins/secs inputs in sync when total duration changes (e.g. from file upload or presets)
  useEffect(() => {
    const m = Math.floor(duration / 60);
    const s = duration % 60;
    setMins(m);
    setSecs(s);
  }, [duration]);

  // Handle Preset Choices
  const selectPreset = (preset: SongPreset) => {
    setTitle(preset.title);
    setDuration(preset.duration);
    setPoeticPrompt(preset.poeticPrompt);
    setSelectedPresetId(preset.id);
    setStorySummary(preset.storyIdea);
    setInterpretation("Infiere una atmósfera inspirada por el entorno '" + preset.title + "' bajo el ritmo '" + preset.genre + "'.");
    
    // Clear custom uploaded audio
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioFile(null);
    setAudioUrl(null);
    setAudioBase64(null);
    setAudioMimeType(null);

    // Stop playback and reset timers
    handleStopPlayback();

    // Create a beautifully distributed local mock SRT block set on the fly for the selected duration
    const blocksCount = Math.max(5, Math.floor(preset.duration / 15));
    const step = preset.duration / blocksCount;
    const generatedSrtBlocks: SubtitleBlock[] = [];
    
    for (let i = 0; i < blocksCount; i++) {
      const bStart = i * step;
      const bEnd = Math.min((i + 1) * step - 2, preset.duration);
      const bId = i + 1;
      
      generatedSrtBlocks.push({
        id: bId,
        startTime: bStart,
        endTime: bEnd,
        startTimeStr: formatSecondsToTimestamp(bStart),
        endTimeStr: formatSecondsToTimestamp(bEnd),
        text: `Escena poética #${bId} inspirada en ${preset.title}.`
      });
    }

    const defaultCompiled = compileSRT(generatedSrtBlocks);
    setSrtContent(defaultCompiled);
    setCompiledBlocks(generatedSrtBlocks);
  };

  // Cycling Cinematic Loading Messages
  useEffect(() => {
    let interval: any = null;
    if (isAnalyzing) {
      interval = setInterval(() => {
        setLoaderMsgIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 3500);
    } else {
      setLoaderMsgIdx(0);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  // Unified Playback head loop (for procedural synth)
  useEffect(() => {
    let timer: any = null;
    if (isPlaying && !audioUrl) {
      timer = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            handleStopPlayback();
            return duration;
          }
          return Number((prev + 0.1).toFixed(1));
        });
      }, 100);
    }
    return () => clearInterval(timer);
  }, [isPlaying, audioUrl, duration]);

  // File drag & drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processAudioFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processAudioFile(e.target.files[0]);
    }
  };

  // Audio File Preloader & reader
  const processAudioFile = (file: File) => {
    if (!file.type.startsWith("audio/")) {
      setErrorMessage("Por favor, sube un archivo de formato de audio válido (.mp3, .wav, .ogg, etc.)");
      return;
    }

    setErrorMessage(null);
    handleStopPlayback();

    const url = URL.createObjectURL(file);
    setAudioFile(file);
    setAudioUrl(url);
    setAudioMimeType(file.type);
    setSelectedPresetId(null); // Deselect templates

    // Parse song real metadata duration in browser
    const testAudio = new Audio(url);
    testAudio.addEventListener("loadedmetadata", () => {
      const realDur = Math.round(testAudio.duration);
      if (realDur > 0) {
        setDuration(realDur);
      }
    });

    // Auto update Title based on file clean name
    const cleanTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
    setTitle(cleanTitle);

    // Read to base64 so Gemini can listen to it
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (reader.result) {
        setAudioBase64(reader.result as string);
      }
    };
  };

  // Remove the currently uploaded file
  const removeUploadedAudio = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioFile(null);
    setAudioUrl(null);
    setAudioBase64(null);
    setAudioMimeType(null);
    handleStopPlayback();
    
    // Load Andromeda standard preset as fallback
    selectPreset(PRESET_SONGS[0]);
  };

  // Playback Control Triggers
  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (audioUrl && audioRef.current) {
        audioRef.current.pause();
      } else if (ambientSynthRef.current) {
        ambientSynthRef.current.stop();
      }
    } else {
      setIsPlaying(true);
      if (audioUrl && audioRef.current) {
        audioRef.current.play().catch((err) => {
          console.warn("Audio Context playback failed, state is blocked:", err);
          setIsPlaying(false);
        });
      } else {
        // Run procedural synthesis based on seed freq of active preset or average 110Hz
        const activePreset = PRESET_SONGS.find((p) => p.id === selectedPresetId);
        const seedFreq = activePreset ? activePreset.syntheticSeedFreq : 110;
        if (ambientSynthRef.current) {
          ambientSynthRef.current.start(seedFreq);
        }
      }
    }
  };

  const handleStopPlayback = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (ambientSynthRef.current) {
      ambientSynthRef.current.stop();
    }
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
    if (audioUrl && audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  // HTML5 audio elements hooks
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleAudioEnded = () => {
    handleStopPlayback();
  };

  // Subtitle Blocks updates triggered by Child Editor
  const handleSrtTextEdited = (newSrt: string) => {
    setSrtContent(newSrt);
    try {
      const parsed = parseSRT(newSrt);
      if (parsed.length > 0) {
        setCompiledBlocks(parsed);
      }
    } catch (err) {
      console.warn("Syntax warning while reading raw text input:", err);
    }
  };

  const handleUpdateBlockInTimeline = (updated: SubtitleBlock) => {
    const updatedList = compiledBlocks.map((b) => b.id === updated.id ? updated : b);
    setCompiledBlocks(updatedList);
    setSrtContent(compileSRT(updatedList));
  };

  const handleAddBlockToTimeline = () => {
    const last = compiledBlocks[compiledBlocks.length - 1];
    const nStart = last ? last.endTime : 0;
    const nEnd = Math.min(nStart + 6, duration);

    const newBlk: SubtitleBlock = {
      id: compiledBlocks.length + 1,
      startTime: nStart,
      endTime: nEnd,
      startTimeStr: formatSecondsToTimestamp(nStart),
      endTimeStr: formatSecondsToTimestamp(nEnd),
      text: "Nueva poesía cinemática para el vacío..."
    };

    const updatedList = [...compiledBlocks, newBlk];
    setCompiledBlocks(updatedList);
    setSrtContent(compileSRT(updatedList));
  };

  const handleDeleteBlockInTimeline = (id: number) => {
    const filtered = compiledBlocks
      .filter((b) => b.id !== id)
      .map((b, idx) => ({ ...b, id: idx + 1 })); // Remap sequential index IDs
    
    setCompiledBlocks(filtered);
    setSrtContent(compileSRT(filtered));
  };

  // TRIGGER THE FULL-STACK GEMINI CALL WITH THE API KEY ENCRYPTED ON THE SERVER SIDE
  const triggerGeminiSrtGeneration = async () => {
    if (!title.trim()) {
      setErrorMessage("Por favor, introduce un título para la pieza de referencia.");
      return;
    }
    if (duration <= 0) {
      setErrorMessage("Para generar subtítulos, la pieza debe tener una duración real de segundos.");
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);
    handleStopPlayback();

    try {
      const res = await fetch("/api/generate-srt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title,
          duration: duration,
          audioBase64: audioBase64,
          audioMimeType: audioMimeType,
          poeticPrompt: poeticPrompt
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ocurrió un error inesperado al procesar el guion.");
      }

      const generatedResult: GenerationResult = data;
      
      // Update global states on success!
      setTitle(generatedResult.title || title);
      setSrtContent(generatedResult.srt);
      setStorySummary(generatedResult.storySummary);
      setInterpretation(generatedResult.interpretation);

      // Parse the output string SRT directly into active playback blocks
      const parsedBlocks = parseSRT(generatedResult.srt);
      setCompiledBlocks(parsedBlocks);

    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err.message || 
        "Hubo una desconexión al intentar contactar con la inteligencia artificial en el backend."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-immersive-bg text-slate-100 flex flex-col selection:bg-immersive-accent/30 selection:text-white relative overflow-x-hidden"
      style={{
        "--accent-rgb": activeAccent.rgb
      } as React.CSSProperties}
    >
      
      {/* Immersive UI ambient glowing orbs */}
      <div className="atmosphere"></div>

      {/* Hidden HTML5 Audio Element for custom physical file playbacks */}
      <audio
        ref={audioRef}
        src={audioUrl || undefined}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleAudioEnded}
        className="hidden shadow-none pointer-events-none"
      />

      {/* Decorative top gradient row representing color bands */}
      <div className="h-1 w-full bg-linear-to-r from-immersive-accent/50 via-immersive-accent/20 to-transparent"></div>

      {/* Hero Header bar */}
      <header className="border-b border-immersive-border bg-immersive-bg/85 backdrop-blur-xl px-6 py-5 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-immersive-accent flex items-center justify-center shadow-lg shadow-immersive-accent/20 transition-all duration-300 select-none">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col text-left">
              <h1 className="font-cinzel text-lg md:text-xl font-black tracking-[0.2em] text-white uppercase">
                MUSE // SCRIPTURA
              </h1>
              <p className="text-[10px] text-slate-400 font-mono tracking-wider">
                SCRIPTWRITER & MUSIC ARCHIVIST • CINESCRIBE SRT
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Color Accent Dropdown Selector */}
            <div className="flex items-center gap-2 bg-immersive-glass border border-immersive-border px-3 py-1.5 rounded-xl text-xs font-mono transition-all duration-300">
              <Palette className="w-3.5 h-3.5 text-immersive-accent animate-pulse" />
              <span className="text-[10px] text-slate-400 uppercase tracking-widest hidden sm:inline">Tono de Énfasis:</span>
              <select
                value={accentId}
                onChange={(e) => setAccentId(e.target.value)}
                className="bg-transparent text-white border-none focus:outline-none focus:ring-0 text-xs font-semibold select-none cursor-pointer pr-1 transition-colors"
                title="Personalizar color del tema"
              >
                {ACCENT_COLORS.map((col) => (
                  <option key={col.id} value={col.id} className="bg-[#0f0a15] text-white font-sans text-xs">
                    {col.name}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-[10px] font-mono bg-immersive-glass text-cyan-400 border border-immersive-border px-2.5 py-1.5 rounded-xl flex items-center gap-1.5">
              <Radio className="w-3 h-3 animate-ping text-cyan-400" />
              <span>MOTOR GEMINI 3.5 FLASH</span>
            </span>
            <span className="text-[10px] font-mono bg-immersive-glass text-immersive-accent border border-immersive-border px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all duration-300">
              <Database className="w-3 h-3 text-immersive-accent" />
              <span>SÍNTESIS SEGURA SERVER-SIDE</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* LEFT COLUMN: Input setup dashboard (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          
          {/* Preset panel */}
          <div className="bg-immersive-panel/90 border border-immersive-border rounded-2xl p-5 space-y-4 backdrop-blur-xl shadow-2xl">
            <h3 className="text-xs uppercase tracking-widest text-[#94a3b8] font-mono flex items-center gap-2">
              <Compass className="w-4 h-4 text-immersive-accent" />
              <span>1. Elegir Atmósfera Predefinida</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {PRESET_SONGS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => selectPreset(preset)}
                  className={`p-3.5 rounded-xl border text-left flex flex-col justify-between h-28 cursor-pointer transition-all duration-300 relative overflow-hidden group ${
                    selectedPresetId === preset.id
                      ? "bg-immersive-accent/15 border-immersive-accent text-white shadow-xl shadow-immersive-accent/10"
                      : "bg-immersive-glass border-immersive-border text-[#94a3b8] hover:border-immersive-accent/50 hover:text-white"
                  }`}
                >
                  <div className="space-y-1 z-10">
                    <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">
                      {preset.genre.split(",")[0]}
                    </span>
                    <h4 className="font-cinzel text-xs font-semibold leading-tight line-clamp-2">
                      {preset.title}
                    </h4>
                  </div>
                  <div className="flex justify-between items-center w-full mt-2 font-mono text-[10px] text-slate-500 z-10">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {Math.floor(preset.duration / 60)}:{(preset.duration % 60).toString().padStart(2, "0")}s
                    </span>
                    <span className="group-hover:text-immersive-accent transition-colors">Cargar</span>
                  </div>

                  {selectedPresetId === preset.id && (
                    <span className="absolute top-0 right-0 w-12 h-12 bg-immersive-accent/20 rotate-45 translate-x-6 -translate-y-6 flex items-end justify-center pb-2 z-0">
                      <Music className="w-3 h-3 text-immersive-accent -rotate-45" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Details input section */}
          <div className="bg-immersive-panel/90 border border-immersive-border rounded-2xl p-5 space-y-4 backdrop-blur-xl shadow-2xl">
            <h3 className="text-xs uppercase tracking-widest text-[#94a3b8] font-mono flex items-center gap-2">
              <Music className="w-4 h-4 text-immersive-accent" />
              <span>2. Parámetros de la Canción</span>
            </h3>

            <div className="space-y-4">
              {/* Title input */}
              <div className="space-y-1.5 text-left">
                <label className="text-[11px] uppercase tracking-wider text-slate-500 font-mono">
                  Título de la Canción Instrumental
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setSelectedPresetId(null); // Clear active preset template
                  }}
                  placeholder="ej. El fin de la gravedad"
                  className="w-full bg-immersive-bg/50 border border-immersive-border focus:border-immersive-accent rounded-xl py-2.5 px-3.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-immersive-accent/30 transition placeholder-slate-600"
                />
              </div>

              {/* Time inputs */}
              <div className="space-y-1.5 text-left">
                <label className="text-[11px] uppercase tracking-wider text-slate-500 font-mono">
                  Duración Total de la Pista
                </label>
                <div className="grid grid-cols-2 gap-3 items-center">
                  <div className="flex items-center space-x-2 bg-immersive-bg/50 border border-immersive-border rounded-xl px-3 py-2.5 focus-within:border-immersive-accent transition">
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={mins}
                      onChange={(e) => handleTimeNumsChange(parseInt(e.target.value, 10) || 0, secs)}
                      className="bg-transparent focus:outline-none text-white font-mono text-center w-full text-sm"
                    />
                    <span className="text-[10px] font-mono text-slate-600">MIN</span>
                  </div>

                  <div className="flex items-center space-x-2 bg-immersive-bg/50 border border-immersive-border rounded-xl px-3 py-2.5 focus-within:border-immersive-accent transition">
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={secs}
                      onChange={(e) => handleTimeNumsChange(mins, parseInt(e.target.value, 10) || 0)}
                      className="bg-transparent focus:outline-none text-white font-mono text-center w-full text-sm"
                    />
                    <span className="text-[10px] font-mono text-slate-600">SEG</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reference Audio Upload Section */}
          <div className="bg-immersive-panel/90 border border-immersive-border rounded-2xl p-5 space-y-4 backdrop-blur-xl shadow-2xl">
            <h3 className="text-xs uppercase tracking-widest text-[#94a3b8] font-mono flex items-center gap-2">
              <Upload className="w-4 h-4 text-immersive-accent" />
              <span>3. Cargar Audio de Referencia (Opcional)</span>
            </h3>

            {audioFile ? (
              <div className="p-4 bg-immersive-bg/80 border border-immersive-border rounded-xl flex items-center justify-between text-left relative overflow-hidden group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-immersive-accent/10 rounded-lg flex items-center justify-center border border-immersive-accent/20">
                    <FileAudio className="w-4 h-4 text-immersive-accent" />
                  </div>
                  <div className="flex flex-col truncate max-w-[200px] md:max-w-[240px]">
                    <span className="text-xs font-medium text-slate-200 truncate">{audioFile.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {(audioFile.size / (1024 * 1024)).toFixed(2)} MB • {formatSecondsToTimestamp(duration).split(",")[0]}
                    </span>
                  </div>
                </div>

                <button
                  onClick={removeUploadedAudio}
                  className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-immersive-bg transition cursor-pointer"
                  title="Eliminar archivo e inicializar presets"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 relative select-none ${
                  dragActive
                    ? "border-immersive-accent bg-immersive-accent/10"
                    : "border-immersive-border hover:border-immersive-accent/50 bg-immersive-bg/30"
                }`}
              >
                <input
                  type="file"
                  id="music-uploader"
                  accept="audio/*"
                  onChange={handleFileInput}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                <Upload className="w-8 h-8 text-slate-500 mb-2 animate-bounce" />
                <p className="text-xs font-medium text-slate-300">Arrastra tu canción aquí</p>
                <p className="text-[10px] text-slate-500 mt-1">O haz clic para explorar tu dispositivo (MP3, WAV, OGG, etc.)</p>
                <div className="bg-immersive-bg border border-immersive-border text-[9px] font-mono py-1 px-2.5 rounded-full mt-3 text-immersive-accent">
                  SÍNTESIS DURA EN TIEMPO REAL
                </div>
              </div>
            )}
          </div>

          {/* Poetic Guidance Direction Prompt */}
          <div className="bg-immersive-panel/90 border border-immersive-border rounded-2xl p-5 space-y-4 backdrop-blur-xl shadow-2xl">
            <div className="text-left">
              <label className="text-[11px] uppercase tracking-wider text-slate-500 font-mono block mb-1.5">
                4. Atmósfera y Directriz Poética (Opcional)
              </label>
              <textarea
                rows={3}
                value={poeticPrompt}
                onChange={(e) => {
                  setPoeticPrompt(e.target.value);
                  setSelectedPresetId(null);
                }}
                placeholder="ej. Nostalgia helada, un viaje por la estepa siberiana, copos de nieve cayendo sobre campanarios vacíos."
                className="w-full bg-immersive-bg/50 border border-immersive-border focus:border-immersive-accent rounded-xl p-3 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-immersive-accent/30 transition placeholder-slate-600 resize-none font-sans"
              />
            </div>
          </div>

          {/* Master trigger button */}
          <div className="space-y-3">
            <button
              onClick={triggerGeminiSrtGeneration}
              disabled={isAnalyzing || !title.trim() || duration <= 0}
              className={`w-full py-4 px-6 rounded-xl font-cinzel text-sm font-bold tracking-wider uppercase transition-all duration-300 relative overflow-hidden flex items-center justify-center gap-2 border select-none group cursor-pointer ${
                isAnalyzing
                  ? "bg-[#1f1635] border-immersive-border text-slate-500 cursor-not-allowed"
                  : "bg-immersive-accent hover:bg-opacity-90 hover:scale-[1.01] text-white border-immersive-accent/20 shadow-xl shadow-immersive-accent/20 active:scale-98"
              }`}
            >
              <Sparkles className={`w-4 h-4 ${isAnalyzing ? "animate-spin text-slate-500" : "text-amber-400 fill-amber-400 group-hover:scale-125 transition"}`} />
              <span>{isAnalyzing ? "Componiendo Guion..." : "Generar Guion SRT con IA"}</span>
            </button>

            {/* Error alerts if any */}
            {errorMessage && (
              <div className="p-3.5 bg-red-950/20 border border-red-900/30 text-red-400 rounded-xl flex items-start gap-3 text-xs leading-normal text-left">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold block uppercase tracking-wide text-[10px]">Error de Configuración</span>
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Output display projection and editors (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          
          {/* Loading View overlay when Gemini is generating */}
          {isAnalyzing ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-immersive-panel/90 border border-immersive-border rounded-2xl p-12 min-h-[500px] backdrop-blur-xl shadow-2xl">
              
              {/* Spinner animation */}
              <div className="relative w-24 h-24 mb-8">
                <div className="absolute inset-0 rounded-full border-4 border-dashed border-immersive-accent/20 animate-spin"></div>
                <div className="absolute inset-2 rounded-full border-4 border-dashed border-cyan-500/20 animate-spin [animation-direction:reverse]"></div>
                <div className="absolute inset-4 rounded-full border-4 border-immersive-accent border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Film className="w-6 h-6 text-immersive-accent animate-pulse" />
                </div>
              </div>

              {/* Taglines */}
              <div className="max-w-md space-y-3.5 text-center">
                <h4 className="font-cinzel text-lg font-bold tracking-widest text-[#94a3b8] uppercase animate-pulse">
                  PROYECTANDO VISIÓN POÉTICA
                </h4>
                
                {/* Dynamically active loading text card */}
                <div className="p-3 bg-immersive-bg/60 border border-immersive-border rounded-xl h-18 flex items-center justify-center">
                  <p key={loaderMsgIdx} className="text-xs text-slate-300 font-serif italic leading-relaxed">
                    "{LOADING_MESSAGES[loaderMsgIdx]}"
                  </p>
                </div>
                
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                  Modelo: Gemini 3.5 Flash • Duración: {duration}s
                </p>
              </div>

            </div>
          ) : (
            <>
              {/* Simulated projection screen */}
              <PresentationScreen
                title={title}
                genre={selectedPresetId ? PRESET_SONGS.find(p => p.id === selectedPresetId)?.genre : "GÉNERO AUDIO PERSONALIZADO"}
                currentTime={currentTime}
                duration={duration}
                isPlaying={isPlaying}
                onTogglePlay={handleTogglePlay}
                onSeek={handleSeek}
                subtitleBlocks={compiledBlocks}
              />

              {/* Interactive block and raw code tabs editors */}
              <SrtEditor
                initialSrt={srtContent}
                storySummary={storySummary}
                interpretation={interpretation}
                onChangeSRT={handleSrtTextEdited}
                subtitleBlocks={compiledBlocks}
                currentTime={currentTime}
                onSeek={handleSeek}
                onUpdateBlock={handleUpdateBlockInTimeline}
                onAddBlock={handleAddBlockToTimeline}
                onDeleteBlock={handleDeleteBlockInTimeline}
              />
            </>
          )}

        </div>

      </main>

      {/* Cinematic decorative footer */}
      <footer className="border-t border-immersive-border bg-immersive-bg/90 py-8 px-6 text-center mt-auto font-mono text-xs text-[#94a3b8] z-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-serif italic text-white/60">
            "La poesía visual sintonizada con el infinito sonoro."
          </p>
          <p className="text-[10px] uppercase tracking-wider">
            © {new Date().getFullYear()} MUSE // SCRIPTURA • PLATAFORMA DE DIRECCIÓN SENSORIAL
          </p>
        </div>
      </footer>
    </div>
  );
}
