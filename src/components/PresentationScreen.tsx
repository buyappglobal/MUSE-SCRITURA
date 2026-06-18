import React, { useRef, useMemo, useState, useEffect } from "react";
import { SubtitleBlock } from "../types";
import { formatSecondsToTimestamp } from "../utils/srtParser";
import { Play, Pause, SkipBack, Music, Volume2, Mic, MicOff, Sliders, VolumeX } from "lucide-react";

interface PresentationScreenProps {
  title: string;
  genre?: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  subtitleBlocks: SubtitleBlock[];
}

export const PresentationScreen: React.FC<PresentationScreenProps> = ({
  title,
  genre,
  currentTime,
  duration,
  isPlaying,
  onTogglePlay,
  onSeek,
  subtitleBlocks,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Text-To-Speech states
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(() => {
    return localStorage.getItem("muse-speech-enabled") === "true";
  });
  const [selectedVoiceName, setSelectedVoiceName] = useState(() => {
    return localStorage.getItem("muse-speech-voice") || "";
  });
  const [speechRate, setSpeechRate] = useState(() => {
    return parseFloat(localStorage.getItem("muse-speech-rate") || "1.0");
  });
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const synth = typeof window !== "undefined" ? window.speechSynthesis : null;

  // Track speech preference changes
  useEffect(() => {
    localStorage.setItem("muse-speech-enabled", String(isSpeechEnabled));
  }, [isSpeechEnabled]);

  useEffect(() => {
    localStorage.setItem("muse-speech-voice", selectedVoiceName);
  }, [selectedVoiceName]);

  useEffect(() => {
    localStorage.setItem("muse-speech-rate", String(speechRate));
  }, [speechRate]);

  // Load and subscribe browser voice lists
  useEffect(() => {
    if (!synth) return;
    
    const updateVoices = () => {
      const allVoices = synth.getVoices();
      // Filter primarily for Spanish voices or return all if none found
      const esVoices = allVoices.filter(v => v.lang.toLowerCase().includes("es"));
      setVoices(esVoices.length > 0 ? esVoices : allVoices);
    };

    updateVoices();
    synth.onvoiceschanged = updateVoices;
    
    return () => {
      synth.onvoiceschanged = null;
    };
  }, [synth]);

  // Perform active block narration loop
  useEffect(() => {
    if (!synth) return;

    // Instantly cancel any ongoing speech
    synth.cancel();

    if (isPlaying && isSpeechEnabled && activeBlock && activeBlock.text) {
      // Remove staging commands / actions inside brackets or parenthesis for a pristine voiceover
      const narrationText = activeBlock.text
        .replace(/\[.*?\]/g, "")
        .replace(/\(.*?\)/g, "")
        .trim();

      if (narrationText) {
        const utterance = new SpeechSynthesisUtterance(narrationText);
        
        // Match chosen voice or pick default Spanish voice
        const availableVoices = synth.getVoices();
        let targetVoice = availableVoices.find(v => v.name === selectedVoiceName);
        
        if (!targetVoice) {
          // Fallback to first Spanish voice
          targetVoice = availableVoices.find(v => v.lang.toLowerCase().includes("es"));
        }
        
        if (targetVoice) {
          utterance.voice = targetVoice;
        }
        
        utterance.rate = speechRate;
        utterance.pitch = 1.0;
        
        synth.speak(utterance);
      }
    }

    return () => {
      if (synth) {
        synth.cancel();
      }
    };
  }, [currentTime, isPlaying, isSpeechEnabled]);

  // Determine the subtitle block currently active
  const activeBlock = useMemo(() => {
    return subtitleBlocks.find(
      (b) => currentTime >= b.startTime && currentTime <= b.endTime
    );
  }, [subtitleBlocks, currentTime]);

  // Handle click on timeline to seek
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || duration <= 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const targetTime = Math.min(Math.max(percentage * duration, 0), duration);
    onSeek(targetTime);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex flex-col w-full bg-immersive-panel/95 border border-immersive-border rounded-2xl overflow-hidden shadow-2xl relative backdrop-blur-xl">
      
      {/* Cinematic Frame */}
      <div className="bg-immersive-bg/90 border-b border-immersive-border px-4 py-2.5 flex items-center justify-between text-xs font-mono text-[#94a3b8]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></span>
          <span className="uppercase tracking-wider">SALA DE PROYECCIÓN DE GUION</span>
        </div>
        <div className="flex items-center gap-2">
          <Music className="w-3.5 h-3.5 text-immersive-accent" />
          <span className="truncate max-w-[200px] font-semibold text-white">{title || "Sin título"}</span>
        </div>
        <div className="text-immersive-accent font-semibold tracking-wider">
          {formatSecondsToTimestamp(currentTime).split(",")[0]} / {formatSecondsToTimestamp(duration).split(",")[0]}
        </div>
      </div>

      {/* Actual Projection Board */}
      <div className="aspect-[16/9] w-full bg-[#040306] relative flex flex-col justify-between p-6 overflow-hidden group select-none">
        
        {/* Procedural Cosmic Background (Nebula dust stars) using CSS */}
        <div className="absolute inset-0 bg-radial-gradient from-immersive-accent/10 via-immersive-bg/95 to-black pointer-events-none z-0"></div>
        
        {/* Subtle moving light effect */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-immersive-accent/10 blur-[120px] rounded-full animate-pulse z-0 pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/5 blur-[120px] rounded-full animate-pulse z-0 pointer-events-none"></div>

        {/* Cinematic Grid Watermark */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.04)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0"></div>

        {/* Ambient Top Shadow / Metadata overlay */}
        <div className="z-10 text-center pointer-events-none">
          <span className="text-[10px] tracking-[0.25em] font-mono text-[#94a3b8] uppercase">
            {genre || "MÚSICA INSTRUMENTAL SENSORIAL"}
          </span>
        </div>

        {/* Active Subtitle Text Screen */}
        <div className="z-10 flex-1 flex items-center justify-center text-center px-8 relative">
          <div 
            key={activeBlock ? activeBlock.id : "silence"}
            className="transition-all duration-700 ease-out transform scale-100 filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] max-w-2xl"
          >
            {activeBlock ? (
              <p className="font-cinzel text-lg md:text-2xl xl:text-3xl font-medium tracking-wide text-white leading-relaxed text-shadow-lg">
                "{activeBlock.text}"
              </p>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-2 opacity-30">
                <span className="w-1.5 h-1.5 rounded-full bg-immersive-accent animate-ping"></span>
                <p className="font-serif italic text-sm text-slate-400">
                  [ El silencio evoca la música... ]
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Hover / Play Quick Controls overlay */}
        <div className="absolute inset-x-0 bottom-0 top-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20">
          <button 
            id="play-overlay-btn"
            onClick={onTogglePlay}
            className="w-14 h-14 bg-white/10 hover:bg-white/20 hover:scale-105 border border-white/20 active:scale-95 transition-all outline-none rounded-full flex items-center justify-center text-white cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-white" />
            ) : (
              <Play className="w-6 h-6 fill-white translate-x-0.5" />
            )}
          </button>
        </div>

        {/* Bottom Time Indicator Overlay */}
        <div className="z-10 flex justify-between items-end font-mono text-[10px] text-slate-500 pointer-events-none">
          <div className="text-left">
            <div>BLOQUE ACTIVO: {activeBlock ? `#${activeBlock.id}` : "Ninguno"}</div>
            <div>TIEMPOS: {activeBlock ? `${activeBlock.startTimeStr.split(",")[0]} -> ${activeBlock.endTimeStr.split(",")[0]}` : "00:00:00"}</div>
          </div>
          <div className="text-right">
            <div>SINFONÍA VISUAL SRT</div>
            <div>VERSIÓN 1.0</div>
          </div>
        </div>
      </div>

      {/* Scrubbable Cinematic Timeline Track */}
      <div 
        ref={containerRef}
        onClick={handleTimelineClick}
        className="h-3 w-full bg-immersive-bg border-t border-immersive-border cursor-pointer relative group/timeline"
      >
        {/* Background tracker */}
        <div className="absolute inset-0 bg-white/5 group-hover/timeline:bg-white/10 transition-colors"></div>
        
        {/* Hover Cue Preview (subtitles timeline highlights) */}
        {subtitleBlocks.map((block) => {
          const startPct = duration > 0 ? (block.startTime / duration) * 100 : 0;
          const endPct = duration > 0 ? (block.endTime / duration) * 100 : 0;
          const widthPct = endPct - startPct;
          return (
            <div
              key={block.id}
              className="absolute top-0 bottom-0 bg-immersive-accent/15 border-r border-immersive-border pointer-events-none"
              style={{ left: `${startPct}%`, width: `${widthPct}%` }}
              title={block.text}
            />
          );
        })}

        {/* Played progress fill */}
        <div 
          className="absolute top-0 bottom-0 bg-immersive-accent z-10 transition-all duration-100"
          style={{ width: `${progressPercent}%` }}
        ></div>

        {/* Scrub handle indicator */}
        <div 
          className="absolute w-3 h-3 bg-white rounded-full z-20 border border-slate-900 -top-0 hover:scale-125 transition-transform"
          style={{ left: `calc(${progressPercent}% - 6px)` }}
        ></div>
      </div>

      {/* Subtitles Audio Controls Panel */}
      <div className="bg-immersive-bg/75 px-6 py-4 border-t border-immersive-border flex flex-col lg:flex-row items-center justify-between gap-4 z-10">
        
        {/* Playback Buttons */}
        <div className="flex items-center gap-3">
          <button
            id="seek-start-btn"
            onClick={() => onSeek(0)}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-immersive-glass border border-transparent hover:border-immersive-border transition active:scale-95 cursor-pointer"
            title="Reiniciar reproducción"
          >
            <SkipBack className="w-5 h-5" />
          </button>
          
          <button
            id="toggle-playback-btn"
            onClick={onTogglePlay}
            className="px-5 py-2.5 bg-immersive-accent hover:bg-opacity-90 text-white rounded-full font-medium shadow-md shadow-immersive-accent/20 flex items-center justify-center gap-2 active:scale-98 transition cursor-pointer text-sm"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-white" />
                <span>Pausar Música</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Escuchar & Proyectar</span>
              </>
            )}
          </button>
        </div>

        {/* Narrative Voiceover Controls */}
        <div className="flex flex-wrap items-center gap-3 bg-immersive-glass/40 border border-immersive-border/60 rounded-2xl px-4 py-2.5 text-xs">
          {/* Narrator activate button */}
          <button
            onClick={() => setIsSpeechEnabled(!isSpeechEnabled)}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-mono text-[11px] transition-all duration-300 select-none cursor-pointer ${
              isSpeechEnabled
                ? "bg-immersive-accent/15 border-immersive-accent/40 text-white shadow-lg shadow-immersive-accent/10"
                : "bg-transparent border-immersive-border text-[#94a3b8] hover:text-white"
            }`}
            title={isSpeechEnabled ? "Desactivar Narración de Voz" : "Activar Narración de Voz"}
          >
            {isSpeechEnabled ? (
              <>
                <Mic className="w-3.5 h-3.5 text-immersive-accent animate-pulse" />
                <span className="font-semibold text-white">NARRACIÓN ACTIVA</span>
              </>
            ) : (
              <>
                <MicOff className="w-3.5 h-3.5 text-slate-500" />
                <span>NARRACIÓN DETENIDA</span>
              </>
            )}
          </button>

          {isSpeechEnabled && (
            <div className="flex flex-wrap items-center gap-2.5 transition">
              {/* Voice selector */}
              {voices.length > 0 && (
                <div className="flex items-center gap-1 bg-immersive-bg/50 border border-immersive-border px-2.5 py-1 rounded-xl">
                  <select
                    value={selectedVoiceName}
                    onChange={(e) => setSelectedVoiceName(e.target.value)}
                    className="bg-transparent text-white border-none focus:outline-none focus:ring-0 text-[10px] max-w-[125px] font-medium cursor-pointer"
                    title="Voz del narrador"
                  >
                    <option value="" className="bg-[#0f0a15] text-[#94a3b8]">Voz por defecto (ES)</option>
                    {voices.map((v) => (
                      <option key={v.name} value={v.name} className="bg-[#0f0a15] text-white">
                        {v.name.replace("Microsoft", "").replace("Google", "").trim()} ({v.lang})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Rate speed selector */}
              <div className="flex items-center gap-1.5 bg-immersive-bg/50 border border-immersive-border px-2.5 py-1 rounded-xl">
                <Sliders className="w-3 h-3 text-immersive-accent" />
                <select
                  value={speechRate}
                  onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                  className="bg-transparent text-white border-none focus:outline-none focus:ring-0 text-[10px] font-semibold cursor-pointer"
                  title="Velocidad del narrador"
                >
                  <option value="0.75" className="bg-[#0f0a15] text-white">0.75x Lento</option>
                  <option value="1.0" className="bg-[#0f0a15] text-white">1.0x Normal</option>
                  <option value="1.25" className="bg-[#0f0a15] text-white">1.25x Rápido</option>
                  <option value="1.5" className="bg-[#0f0a15] text-white">1.5x Veloz</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Current status info */}
        <div className="text-center lg:text-right font-mono text-xs text-slate-400 flex flex-col lg:items-end justify-center">
          <div className="flex items-center gap-2 justify-center lg:justify-end text-immersive-accent mb-0.5">
            <Volume2 className="w-3.5 h-3.5 text-immersive-accent animate-pulse" />
            <span>{isPlaying ? "Reproduciendo pista sonora mística..." : "Audio en pausa"}</span>
          </div>
          <span className="text-[10px] text-slate-500">
            {duration > 0 
              ? `Progreso de reproducción: ${Math.round(progressPercent)}%` 
              : "Sube un archivo o elige un preset para escuchar"}
          </span>
        </div>

      </div>

    </div>
  );
};
