import React, { useRef, useMemo, useState, useEffect } from "react";
import { SubtitleBlock } from "../types";
import { formatSecondsToTimestamp } from "../utils/srtParser";
import { Play, Pause, SkipBack, Music, Volume2, Mic, MicOff, Sliders, VolumeX, Eye, EyeOff, Layers, Sparkles, Video } from "lucide-react";

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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Clean mode state to hide all overlay elements to record clean video
  const [isCleanMode, setIsCleanMode] = useState(() => {
    return localStorage.getItem("muse-clean-mode") === "true";
  });

  // Selected dynamic visual canvas background
  const [canvasBg, setCanvasBg] = useState(() => {
    return localStorage.getItem("muse-canvas-bg") || "nebula";
  });

  useEffect(() => {
    localStorage.setItem("muse-clean-mode", String(isCleanMode));
  }, [isCleanMode]);

  useEffect(() => {
    localStorage.setItem("muse-canvas-bg", canvasBg);
  }, [canvasBg]);

  // Video Export (WebM) Recording States and Refs
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<any>(null);
  const animationTimeRef = useRef(0);

  // Procedural Star Particles for Star Drift Background
  const starsRef = useRef<{x: number; y: number; size: number; speed: number; alpha: number}[]>([]);
  if (starsRef.current.length === 0) {
    const arr = [];
    for (let i = 0; i < 150; i++) {
      arr.push({
        x: Math.random() * 1280,
        y: Math.random() * 720,
        size: Math.random() * 2 + 0.4,
        speed: Math.random() * 0.35 + 0.08,
        alpha: Math.random() * 0.8 + 0.2
      });
    }
    starsRef.current = arr;
  }

  // Determine the subtitle block currently active
  const activeBlock = useMemo(() => {
    return subtitleBlocks.find(
      (b) => currentTime >= b.startTime && currentTime <= b.endTime
    );
  }, [subtitleBlocks, currentTime]);

  // Image cache and preloading for high performance cinematic background slideshow
  const imageCacheRef = useRef<Record<string, HTMLImageElement>>({});

  useEffect(() => {
    // Preload current image
    if (activeBlock?.imageUrl) {
      const url = activeBlock.imageUrl;
      if (!imageCacheRef.current[url]) {
        const img = new Image();
        img.crossOrigin = "anonymous"; // permit cross-origin image bytes for secure local canvas exports
        img.src = url;
        img.onload = () => {
          imageCacheRef.current[url] = img;
        };
      }
    }
    // Preload next image if any for seamless transition
    const nextIdx = subtitleBlocks.findIndex(b => b.id === activeBlock?.id);
    if (nextIdx !== -1 && nextIdx + 1 < subtitleBlocks.length) {
      const nextBlock = subtitleBlocks[nextIdx + 1];
      if (nextBlock?.imageUrl && !imageCacheRef.current[nextBlock.imageUrl]) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = nextBlock.imageUrl;
        img.onload = () => {
          imageCacheRef.current[nextBlock.imageUrl!] = img;
        };
      }
    }
  }, [activeBlock, subtitleBlocks]);

  // CANVAS BACKGROUND RENDERING LOOP
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let t = animationTimeRef.current;

    const render = () => {
      t += 0.4;
      animationTimeRef.current = t;

      // Fix resolution strictly to 1280x720 (720p HD) for gorgeous widescreen recording and crisp outputs
      if (canvas.width !== 1280) canvas.width = 1280;
      if (canvas.height !== 720) canvas.height = 720;

      // Clear Canvas
      ctx.clearRect(0, 0, 1280, 720);

      // Check if current active block has a preloaded storyboard image
      let hasImage = false;
      if (activeBlock?.imageUrl) {
        const cachedImg = imageCacheRef.current[activeBlock.imageUrl];
        if (cachedImg && cachedImg.complete) {
          hasImage = true;
          // Scale-fit / fill 16:9 canvas beautifully
          ctx.drawImage(cachedImg, 0, 0, 1280, 720);

          // Render a elegant cinematic radial darken vignette overlay so lyrics stand out beautifully
          const vignette = ctx.createRadialGradient(640, 360, 220, 640, 360, 680);
          vignette.addColorStop(0, "rgba(0, 0, 0, 0.40)");
          vignette.addColorStop(1, "rgba(0, 0, 0, 0.85)");
          ctx.fillStyle = vignette;
          ctx.fillRect(0, 0, 1280, 720);
        }
      }

      // Render standard particle/procedural backgrounds ONLY if there is no active scene image
      if (!hasImage) {
        if (canvasBg === "minimal") {
          ctx.fillStyle = "#010103";
          ctx.fillRect(0, 0, 1280, 720);
        } else if (canvasBg === "nebula") {
          // Deep space cosmic dust
          ctx.fillStyle = "#04030a";
          ctx.fillRect(0, 0, 1280, 720);

          // Fetch CSS active accent color or fallback to purple
          const activeAccentColor = typeof document !== "undefined"
            ? getComputedStyle(document.documentElement).getPropertyValue("--accent-rgb").trim()
            : "139, 92, 246";
          const accentRGB = activeAccentColor || "139, 92, 246";

          // Main nebula radial aura
          const nebulaGrad = ctx.createRadialGradient(
            640 + Math.sin(t * 0.004) * 140,
            360 + Math.cos(t * 0.005) * 80,
            40,
            640 + Math.sin(t * 0.004) * 140,
            360 + Math.cos(t * 0.005) * 80,
            580
          );
          nebulaGrad.addColorStop(0, `rgba(${accentRGB}, 0.20)`);
          nebulaGrad.addColorStop(0.5, "rgba(8, 12, 34, 0.42)");
          nebulaGrad.addColorStop(1, "#030206");
          ctx.fillStyle = nebulaGrad;
          ctx.fillRect(0, 0, 1280, 720);

          // Secondary cyan glowing gaseous cloud
          const secondaryGrad = ctx.createRadialGradient(
            350 + Math.cos(t * 0.003) * 180,
            480 + Math.sin(t * 0.004) * 100,
            10,
            350 + Math.cos(t * 0.003) * 180,
            480 + Math.sin(t * 0.004) * 100,
            360
          );
          secondaryGrad.addColorStop(0, "rgba(6, 182, 212, 0.11)");
          secondaryGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
          ctx.fillStyle = secondaryGrad;
          ctx.fillRect(0, 0, 1280, 720);

          // Cinematic grid watermark
          ctx.strokeStyle = `rgba(${accentRGB}, 0.022)`;
          ctx.lineWidth = 1;
          const gridSize = 40;
          for (let x = 0; x < 1280; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 720);
            ctx.stroke();
          }
          for (let y = 0; y < 720; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(1280, y);
            ctx.stroke();
          }
        } else if (canvasBg === "aurora") {
          // Deep polar arctic background
          ctx.fillStyle = "#020105";
          ctx.fillRect(0, 0, 1280, 720);

          const activeAccentColor = typeof document !== "undefined"
            ? getComputedStyle(document.documentElement).getPropertyValue("--accent-rgb").trim()
            : "139, 92, 246";
          const accentRGB = activeAccentColor || "139, 92, 246";

          // Draw multiple smooth moving aurora vertical/diagonal waves using quadratic sine shapes
          for (let i = 0; i < 3; i++) {
            const bandPhase = t * 0.003 + i * (Math.PI / 3.5);
            ctx.beginPath();
            ctx.moveTo(0, 720);
            
            for (let x = 0; x <= 1280; x += 15) {
              const waveY = 380 + Math.sin(x * 0.0018 + bandPhase) * 110 
                               + Math.cos(x * 0.0035 - bandPhase * 0.4) * 45;
              ctx.lineTo(x, waveY);
            }
            
            ctx.lineTo(1280, 720);
            ctx.closePath();

            const grad = ctx.createLinearGradient(640, 180, 640, 720);
            if (i === 0) {
              grad.addColorStop(0, `rgba(${accentRGB}, 0.14)`);
              grad.addColorStop(0.6, "rgba(10, 25, 60, 0.05)");
              grad.addColorStop(1, "rgba(0,0,0,0)");
            } else if (i === 1) {
              grad.addColorStop(0, "rgba(13, 148, 136, 0.11)"); // Teal
              grad.addColorStop(0.5, "rgba(4, 47, 46, 0.03)");
              grad.addColorStop(1, "rgba(0,0,0,0)");
            } else {
              grad.addColorStop(0, "rgba(109, 40, 217, 0.09)"); // Violet
              grad.addColorStop(1, "rgba(0,0,0,0)");
            }
            ctx.fillStyle = grad;
            ctx.fill();
          }
        } else if (canvasBg === "stars") {
          // Absolute dark space drift
          ctx.fillStyle = "#010003";
          ctx.fillRect(0, 0, 1280, 720);

          // Drift background star particles
          ctx.fillStyle = "#ffffff";
          starsRef.current.forEach(star => {
            star.y -= star.speed;
            star.x -= star.speed * 0.25;
            
            if (star.y < -10) {
              star.y = 730;
              star.x = Math.random() * 1280;
            }
            if (star.x < -10) {
              star.x = 1290;
              star.y = Math.random() * 720;
            }

            // twinkling cycle values
            const twAlpha = star.alpha * (0.55 + Math.sin(t * 0.022 + star.x) * 0.45);
            ctx.globalAlpha = Math.max(0.1, Math.min(1, twAlpha));
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
          });
          ctx.globalAlpha = 1.0; // Reset alpha
        } else if (canvasBg === "pulse") {
          // Centered concentric pulses
          ctx.fillStyle = "#030207";
          ctx.fillRect(0, 0, 1280, 720);

          const activeAccentColor = typeof document !== "undefined"
            ? getComputedStyle(document.documentElement).getPropertyValue("--accent-rgb").trim()
            : "139, 92, 246";
          const accentRGB = activeAccentColor || "139, 92, 246";

          const totalRings = 3;
          for (let i = 0; i < totalRings; i++) {
            const progress = ((t * 0.005 + i * (1 / totalRings)) % 1);
            const radius = 40 + progress * 420;
            const alpha = (1 - progress) * 0.42;

            ctx.strokeStyle = i % 2 === 0
              ? `rgba(${accentRGB}, ${alpha})`
              : `rgba(6, 182, 212, ${alpha * 0.85})`;

            ctx.lineWidth = 1 + (1 - progress) * 2.5;
            ctx.beginPath();
            ctx.arc(640, 360, radius, 0, Math.PI * 2);
            ctx.stroke();

            // crosshair micro lines
            ctx.strokeStyle = `rgba(${accentRGB}, 0.02)";`;
            ctx.beginPath(); ctx.moveTo(640 - radius - 15, 360); ctx.lineTo(640 + radius + 15, 360); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(640, 360 - radius - 15); ctx.lineTo(640, 360 + radius + 15); ctx.stroke();
          }
        }
      }

      // Render current verse/poetry block text directly on canvas (Always drawn to canvas so MediaRecorder captures it cleanly!)
      if (activeBlock && activeBlock.text) {
        ctx.shadowColor = "rgba(0, 0, 0, 0.98)";
        ctx.shadowBlur = 18;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;

        ctx.font = "italic 500 32px 'Cinzel', 'Georgia', 'Times New Roman', serif";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const text = `"${activeBlock.text}"`;
        const words = text.split(" ");
        const wrappedLines: string[] = [];
        let currentLine = "";
        const maxLineWidth = 920;

        for (let n = 0; n < words.length; n++) {
          const testLine = currentLine + words[n] + " ";
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxLineWidth && n > 0) {
            wrappedLines.push(currentLine.trim());
            currentLine = words[n] + " ";
          } else {
            currentLine = testLine;
          }
        }
        wrappedLines.push(currentLine.trim());

        const lineHeight = 46;
        const totalHeight = wrappedLines.length * lineHeight;
        const startY = 360 - (totalHeight / 2) + (lineHeight / 2);

        wrappedLines.forEach((lineStr, index) => {
          ctx.fillText(lineStr, 640, startY + index * lineHeight);
        });

        // Reset shadow values
        ctx.shadowBlur = 0;
        ctx.shadowColor = "transparent";
      } else {
        // Minimal background ambient indicator if silent
        ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
        ctx.shadowBlur = 8;
        ctx.font = "normal tracking-[0.22em] 11px font-mono, monospace";
        ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
        ctx.textAlign = "center";
        ctx.fillText("⊞ SIN SINFONÍA DE VOX — MÚSICA DE FONDO ⊞", 640, 360);
        ctx.shadowBlur = 0;
      }

      // Delicate branding watermark corner overlay (drawn unless in extreme clean mode requested)
      if (!isCleanMode) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
        ctx.font = "10px monospace";
        ctx.textAlign = "left";
        ctx.fillText("MUSE SCRIPTURA // ESTUDIO DE GRABACIÓN", 45, 680);
        ctx.textAlign = "right";
        ctx.fillText("PROYECCIÓN DIGITAL WEBM", 1235, 680);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [canvasBg, activeBlock, isCleanMode]);

  // MediaRecorder canvas WebM export handlers
  const startRecording = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setRecordingSeconds(0);

    // Capture Canvas stream at stable 30fps
    const stream = canvas.captureStream(30);

    // Choose preferred video mimeType standard in browsers
    let mimeTypeOption = "video/webm; codecs=vp9";
    if (typeof MediaRecorder !== "undefined") {
      if (!MediaRecorder.isTypeSupported(mimeTypeOption)) {
        mimeTypeOption = "video/webm; codecs=vp8";
      }
      if (!MediaRecorder.isTypeSupported(mimeTypeOption)) {
        mimeTypeOption = "video/webm";
      }
      if (!MediaRecorder.isTypeSupported(mimeTypeOption)) {
        mimeTypeOption = ""; // Default browser selection
      }
    }

    try {
      const options = mimeTypeOption ? { mimeType: mimeTypeOption } : {};
      const recorder = new MediaRecorder(stream, options);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const downloadUrl = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.style.display = "none";
        anchor.href = downloadUrl;
        
        const cleanTitle = (title || "musica-poetica").toLowerCase().replace(/[^a-z0-9]/g, "-");
        anchor.download = `muse-${cleanTitle}-${canvasBg}.webm`;
        
        document.body.appendChild(anchor);
        anchor.click();

        setTimeout(() => {
          document.body.removeChild(anchor);
          window.URL.revokeObjectURL(downloadUrl);
        }, 150);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

    } catch (error) {
      console.error("No se pudo inicializar la grabación de video: ", error);
      alert("La grabación de video WebM no está disponible o requiere permisos en este navegador.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecording(false);
  };

  // Auto-stop recording if song finishes
  useEffect(() => {
    if (isRecording && currentTime >= duration && duration > 0) {
      stopRecording();
    }
  }, [currentTime, duration, isRecording]);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

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
      
      {/* Cinematic Frame - Hidden in Clean Mode */}
      {!isCleanMode && (
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
      )}

      {/* Actual Projection Board */}
      <div className="aspect-[16/9] w-full bg-[#040306] relative flex flex-col justify-between p-6 overflow-hidden group select-none">
        
        {/* Toggle clean mode floating button (Subtle auto-hiding widget) */}
        <button
          onClick={() => setIsCleanMode(!isCleanMode)}
          className="absolute top-3 right-3 z-30 p-2 bg-black/60 hover:bg-black/90 text-slate-400 hover:text-white rounded-xl border border-white/10 opacity-30 hover:opacity-100 transition-all duration-300 flex items-center gap-1.5 text-[10px] uppercase tracking-wider cursor-pointer"
          title={isCleanMode ? "Mostrar interfaz completa" : "Ocultar interfaz para grabación limpia"}
        >
          {isCleanMode ? (
            <>
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Mostrar Interfaz</span>
            </>
          ) : (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              <span>Modo Limpio</span>
            </>
          )}
        </button>

        {/* Hardware Accelerated Canvas Background Render and Poetry projection engine */}
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 w-full h-full object-cover z-0 rounded-2xl pointer-events-none"
        />

        {/* Ambient Top Shadow / Metadata overlay - Hidden in Clean Mode */}
        {!isCleanMode && (
          <div className="z-10 text-center pointer-events-none transition-all duration-300">
            <span className="text-[10px] tracking-[0.25em] font-mono text-[#94a3b8]/70 uppercase">
              {genre || "MÚSICA INSTRUMENTAL SENSORIAL"}
            </span>
          </div>
        )}

        {/* Active Subtitle Text Screen */}
        <div className="z-10 flex-1 flex items-center justify-center text-center px-8 relative">
          <div 
            key={activeBlock ? activeBlock.id : "silence"}
            className="transition-all duration-700 ease-out transform scale-100 filter drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] max-w-2xl"
          >
            {activeBlock ? (
              <p className={`font-cinzel text-lg md:text-2xl xl:text-3xl font-medium tracking-wide text-white leading-relaxed text-shadow-xl transition-all duration-300 ${isRecording ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
                "{activeBlock.text}"
              </p>
            ) : (
              <div className={`flex flex-col items-center justify-center space-y-2 transition-all duration-300 ${isRecording ? "opacity-0 pointer-events-none" : "opacity-30"}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-immersive-accent animate-ping"></span>
                <p className="font-serif italic text-sm text-slate-400">
                  [ El silencio evoca la música... ]
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Hover / Play Quick Controls overlay - Hidden in Clean Mode */}
        {!isCleanMode && (
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
        )}

        {/* Bottom Time Indicator Overlay - Hidden in Clean Mode */}
        {!isCleanMode && (
          <div className="z-10 flex justify-between items-end font-mono text-[10px] text-slate-500/80 pointer-events-none transition-all duration-300">
            <div className="text-left">
              <div>BLOQUE ACTIVO: {activeBlock ? `#${activeBlock.id}` : "Ninguno"}</div>
              <div>TIEMPOS: {activeBlock ? `${activeBlock.startTimeStr.split(",")[0]} -> ${activeBlock.endTimeStr.split(",")[0]}` : "00:00:00"}</div>
            </div>
            <div className="text-right">
              <div>SINFONÍA VISUAL SRT</div>
              <div>VERSIÓN 1.2</div>
            </div>
          </div>
        )}
      </div>

      {/* Scrubbable Cinematic Timeline Track - Hidden in Clean Mode */}
      {!isCleanMode && (
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
      )}

      {/* Subtitles Audio Controls Panel - Hidden in Clean Mode */}
      {!isCleanMode && (
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
                  <Play className="w-4 h-4 fill-white animate-pulse" />
                  <span>Escuchar & Proyectar</span>
                </>
              )}
            </button>

            {/* Recording & WebM Export button */}
            {isRecording ? (
              <button
                onClick={stopRecording}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full font-semibold flex items-center gap-2 text-xs animate-pulse cursor-pointer shadow-lg shadow-red-600/30 border border-red-500/50"
                title="Detener grabación y guardar video"
              >
                <span className="w-2 h-2 rounded-full bg-white block animate-ping"></span>
                <span>GRABANDO {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, "0")}</span>
              </button>
            ) : (
              <button
                onClick={startRecording}
                className="px-4 py-2.5 bg-immersive-glass hover:bg-[#1a142c] hover:text-rose-400 text-slate-300 border border-immersive-border hover:border-rose-500/50 rounded-full font-medium flex items-center gap-1.5 text-xs cursor-pointer transition-all duration-300"
                title="Grabar y exportar el lienzo con textos integrados en un archivo de video WebM"
              >
                <Video className="w-4 h-4 text-rose-500" />
                <span>Exportar WebM</span>
              </button>
            )}
          </div>

          {/* Visual Canvas Background Selection */}
          <div className="flex items-center gap-2 bg-immersive-glass/40 border border-immersive-border/60 rounded-xl px-3 py-1.5 text-xs font-mono">
            <Layers className="w-3.5 h-3.5 text-immersive-accent" />
            <span className="text-[10px] text-slate-400 uppercase tracking-wider hidden sm:inline">Lienzo:</span>
            <select
              value={canvasBg}
              onChange={(e) => setCanvasBg(e.target.value)}
              className="bg-transparent text-white border-none focus:outline-none focus:ring-0 text-[11px] font-semibold cursor-pointer pr-1 transition-colors"
              title="Seleccionar Lienzo de Fondo de la Proyección"
            >
              <option value="nebula" className="bg-[#0f0a15] text-white">Niebla Cósmica (Pulsos)</option>
              <option value="aurora" className="bg-[#0f0a15] text-white">Aurora Boreal (Polar)</option>
              <option value="stars" className="bg-[#0f0a15] text-white">Lluvia de Estrellas (Drift)</option>
              <option value="pulse" className="bg-[#0f0a15] text-white">Púlsar Rítmico (Ondas)</option>
              <option value="minimal" className="bg-[#0f0a15] text-white">Abismo Negro (Limpio)</option>
            </select>
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
              <span>{isPlaying ? "Reproduciendo pista mística..." : "Audio en pausa"}</span>
            </div>
            <span className="text-[10px] text-slate-500">
              {duration > 0 
                ? `Progreso de reproducción: ${Math.round(progressPercent)}%` 
                : "Sube un archivo o elige un preset para escuchar"}
            </span>
          </div>

        </div>
      )}

    </div>
  );
};
