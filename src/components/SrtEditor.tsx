import React, { useState, useEffect } from "react";
import { SubtitleBlock } from "../types";
import { compileSRT, parseSRT, formatSecondsToTimestamp, parseTimestampToSeconds } from "../utils/srtParser";
import { Copy, Download, Edit3, Eye, Code, Plus, Trash2, Check, RefreshCw, FileText } from "lucide-react";

interface SrtEditorProps {
  initialSrt: string;
  storySummary?: string;
  interpretation?: string;
  onChangeSRT: (newSrt: string) => void;
  subtitleBlocks: SubtitleBlock[];
  currentTime: number;
  onSeek: (time: number) => void;
  onUpdateBlock: (updatedBlock: SubtitleBlock) => void;
  onAddBlock: () => void;
  onDeleteBlock: (id: number) => void;
}

export const SrtEditor: React.FC<SrtEditorProps> = ({
  initialSrt,
  storySummary,
  interpretation,
  onChangeSRT,
  subtitleBlocks,
  currentTime,
  onSeek,
  onUpdateBlock,
  onAddBlock,
  onDeleteBlock
}) => {
  const [activeTab, setActiveTab] = useState<"blocks" | "raw" | "story">("blocks");
  const [copied, setCopied] = useState(false);
  const [rawText, setRawText] = useState(initialSrt);

  // Sync internal rawText state with parent initialSrt changes
  useEffect(() => {
    setRawText(initialSrt);
  }, [initialSrt]);

  // Handle raw text edit changes
  const handleRawTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setRawText(val);
    onChangeSRT(val);
  };

  // Copy SRT content to clipboard
  const handleCopy = () => {
    const srtCompiled = compileSRT(subtitleBlocks);
    navigator.clipboard.writeText(srtCompiled).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Download SRT file
  const handleDownloadSrt = () => {
    const srtCompiled = compileSRT(subtitleBlocks);
    const blob = new Blob([srtCompiled], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `guion_sintetizado.srt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download Poetic Story Guide file
  const handleDownloadStory = () => {
    const docContent = `GUION CINEMATOGRÁFICO Y DIRECCIÓN POÉTICA EN SRT
=================================================

SINOPSIS VISUAL / HISTORIA DETRÁS DEL TEMA:
------------------------------------------
${storySummary || "Sin sinopsis generada."}

ATMÓSFERA Y RITMO EMOCIONAL DETECTADO:
--------------------------------------
${interpretation || "Sin interpretación analizada."}

SINFONÍA DE SUBTÍTULOS (FORMATO SRT):
------------------------------------
${compileSRT(subtitleBlocks)}
`;
    const blob = new Blob([docContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `libro_guion_vision.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Safe individual block change updates
  const handleBlockChange = (block: SubtitleBlock, key: keyof SubtitleBlock, value: any) => {
    const updated = { ...block, [key]: value };

    // Recalculate duration numbers if timestamp string is edited manually
    if (key === "startTimeStr") {
      updated.startTime = parseTimestampToSeconds(value);
    } else if (key === "endTimeStr") {
      updated.endTime = parseTimestampToSeconds(value);
    }

    onUpdateBlock(updated);
  };

  return (
    <div className="flex flex-col bg-immersive-panel/95 border border-immersive-border rounded-2xl overflow-hidden h-[600px] shadow-2xl backdrop-blur-xl">
      
      {/* Editor top tabs header */}
      <div className="bg-[#0c0a10] border-b border-immersive-border px-4 pt-3 flex flex-wrap justify-between items-end gap-3 z-10">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab("blocks")}
            className={`px-4 py-2 text-xs font-mono font-medium border-t-2 transition cursor-pointer select-none rounded-t-lg flex items-center gap-1.5 ${
              activeTab === "blocks"
                ? "bg-immersive-panel text-white border-immersive-accent"
                : "border-transparent text-[#94a3b8] hover:text-white"
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Líneas del Tiempo ({subtitleBlocks.length})</span>
          </button>
          
          <button
            onClick={() => setActiveTab("raw")}
            className={`px-4 py-2 text-xs font-mono font-medium border-t-2 transition cursor-pointer select-none rounded-t-lg flex items-center gap-1.5 ${
              activeTab === "raw"
                ? "bg-immersive-panel text-white border-immersive-accent"
                : "border-transparent text-[#94a3b8] hover:text-white"
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Código SRT Puro</span>
          </button>

          <button
            onClick={() => setActiveTab("story")}
            className={`px-4 py-2 text-xs font-mono font-medium border-t-2 transition cursor-pointer select-none rounded-t-lg flex items-center gap-1.5 ${
              activeTab === "story"
                ? "bg-immersive-panel text-white border-immersive-accent"
                : "border-transparent text-[#94a3b8] hover:text-white"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Voz de Guionista</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 pb-2">
          <button
            onClick={handleCopy}
            className="px-2.5 py-1.5 bg-immersive-glass hover:bg-immersive-accent/15 border border-immersive-border active:scale-95 text-xs text-[#94a3b8] hover:text-white rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer font-mono"
            title="Copiar código SRT al portapapeles"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar SRT</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadSrt}
            className="px-2.5 py-1.5 bg-immersive-accent/15 hover:bg-immersive-accent text-white active:scale-95 text-xs rounded-lg border border-immersive-accent/30 transition inline-flex items-center gap-1.5 cursor-pointer font-mono"
            title="Descargar archivo .srt"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar .srt</span>
          </button>
        </div>
      </div>

      {/* Panels Body */}
      <div className="flex-1 overflow-y-auto bg-immersive-panel/40 p-4 relative z-10 w-full">
        
        {/* Tab: BLOCK BY BLOCK EDITOR */}
        {activeTab === "blocks" && (
          <div className="space-y-3 w-full">
            <div className="flex items-center justify-between text-[11px] text-[#94a3b8] tracking-wider font-mono pb-1 border-b border-immersive-border">
              <span>LISTA CORONOLÓGICA DE ESCENAS</span>
              <span>Haz clic en una escena para sincronizar la música con ella</span>
            </div>

            {subtitleBlocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-[#94a3b8] space-y-2">
                <FileText className="w-12 h-12 stroke-1 text-slate-600 animate-pulse" />
                <p className="text-sm font-serif italic text-slate-400">La línea de tiempo está vacía.</p>
                <p className="text-xs">Sube un archivo de audio o usa un preset para poder estructurarlo con IA.</p>
              </div>
            ) : (
              <div className="space-y-2 w-full">
                {subtitleBlocks.map((block) => {
                  const isCurrent = currentTime >= block.startTime && currentTime <= block.endTime;
                  return (
                    <div
                      key={block.id}
                      onClick={() => onSeek(block.startTime)}
                      className={`p-3 border rounded-xl transition-all duration-300 text-left relative flex flex-col md:flex-row gap-3 items-start md:items-center justify-between cursor-pointer group ${
                        isCurrent
                          ? "bg-immersive-accent/15 border-immersive-accent/70 shadow-lg shadow-immersive-accent/10 text-white"
                          : "bg-immersive-glass/60 border-immersive-border hover:border-immersive-accent/40 text-[#94a3b8] hover:text-white"
                      }`}
                    >
                      {/* Left: ID & Timeline */}
                      <div className="flex items-center gap-3 w-full md:w-auto">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] select-none ${
                          isCurrent 
                            ? "bg-immersive-accent text-white font-bold" 
                            : "bg-immersive-bg border border-immersive-border text-[#94a3b8]"
                        }`}>
                          {block.id}
                        </span>

                        <div className="flex flex-col space-y-0.5">
                          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                            Intervalo de Escena
                          </span>
                          <div className="flex items-center gap-1.5 text-xs font-mono">
                            <input
                              type="text"
                              value={block.startTimeStr}
                              onClick={(e) => e.stopPropagation()} // don't trigger parent seek
                              onChange={(e) => handleBlockChange(block, "startTimeStr", e.target.value)}
                              className="bg-immersive-bg/90 border border-immersive-border rounded-lg px-2 py-1 text-slate-300 w-24 text-center text-[11px] focus:border-immersive-accent focus:outline-none"
                            />
                            <span className="text-slate-500">→</span>
                            <input
                              type="text"
                              value={block.endTimeStr}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => handleBlockChange(block, "endTimeStr", e.target.value)}
                              className="bg-immersive-bg/90 border border-immersive-border rounded-lg px-2 py-1 text-slate-300 w-24 text-center text-[11px] focus:border-immersive-accent focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Center: Interactive Text Input */}
                      <div className="flex-1 w-full md:w-auto" onClick={(e) => e.stopPropagation()}>
                        <textarea
                          rows={2}
                          value={block.text}
                          onChange={(e) => handleBlockChange(block, "text", e.target.value)}
                          placeholder="Escribe el verso lírico cinematográfico..."
                          className="w-full bg-immersive-bg/50 hover:bg-immersive-bg/85 border border-immersive-border focus:border-immersive-accent focus:bg-immersive-bg text-white placeholder-slate-600 rounded-xl p-2.5 text-xs leading-relaxed focus:outline-none transition-all resize-none font-sans"
                        />
                      </div>

                      {/* Right Actions: Delete */}
                      <div 
                        className="flex md:flex-col items-center gap-2 self-stretch md:self-auto justify-end"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => onDeleteBlock(block.id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-immersive-bg border border-transparent hover:border-red-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar escena"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Active Indicator bar */}
                      {isCurrent && (
                        <span className="absolute left-0 top-0 bottom-0 w-1 bg-immersive-accent rounded-l-md"></span>
                      )}
                    </div>
                  );
                })}

                {/* Add new sequence row */}
                <button
                  onClick={onAddBlock}
                  className="w-full border border-dashed border-immersive-border hover:bg-immersive-glass hover:border-immersive-accent/50 hover:text-white p-3.5 rounded-xl text-xs font-mono text-[#94a3b8] cursor-pointer flex items-center justify-center gap-2 transition-all duration-300"
                >
                  <Plus className="w-4 h-4 text-immersive-accent" />
                  <span>Añadir Nuevo Bloque de Escena</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab: CODE editor */}
        {activeTab === "raw" && (
          <div className="flex flex-col h-full space-y-3">
            <div className="flex items-center justify-between text-[11px] text-[#94a3b8] font-mono">
              <span>CÓDIGO SRT EDITABLE DIRECTO (SUBRIP FORMAT)</span>
              <span>Los cambios se procesan y compilan en tiempo real para la pantalla</span>
            </div>
            
            <textarea
              value={rawText}
              onChange={handleRawTextChange}
              placeholder="1\n00:00:00,000 --> 00:00:05,000\nVerso de demostración"
              className="flex-1 w-full bg-[#040306] border border-immersive-border rounded-2xl p-4 font-mono text-[11px] md:text-sm leading-relaxed text-[#e2e8f0] focus:outline-none focus:border-immersive-accent focus:ring-1 focus:ring-immersive-accent/20 resize-none min-h-[400px]"
            />
          </div>
        )}

        {/* Tab: STORY & INTERPRETATION VOICE */}
        {activeTab === "story" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center text-xs text-[#94a3b8] font-mono pb-2 border-b border-immersive-border">
              <span>CUADERNO DE ENFOQUE CREATIVO</span>
              <button 
                onClick={handleDownloadStory}
                className="text-immersive-accent flex items-center gap-1 hover:underline cursor-pointer font-bold animate-pulse"
              >
                <Download className="w-3 h-3" />
                <span>Exportar Manifiesto Cinematográfico</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Box 1: Story Synopsis */}
              <div className="bg-immersive-bg/40 border border-immersive-border rounded-2xl p-5 space-y-3">
                <h4 className="font-cinzel text-sm text-amber-400 font-semibold tracking-wide flex items-center gap-2 border-b border-immersive-border pb-2">
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                  Perspectiva y Visión Visual
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed font-serif whitespace-pre-wrap">
                  {storySummary || "Aún no se ha realizado un análisis. Escribe el título, sube una pista y presiona 'Generar Guion SRT con IA' para revelar el manifiesto subyacente."}
                </p>
              </div>

              {/* Box 2: Music Interpretation */}
              <div className="bg-immersive-bg/40 border border-immersive-border rounded-2xl p-5 space-y-3">
                <h4 className="font-cinzel text-sm text-immersive-accent font-semibold tracking-wide flex items-center gap-2 border-b border-immersive-border pb-2">
                  <span className="w-1.5 h-1.5 bg-immersive-accent rounded-full"></span>
                  Análisis del Ritmo Emocional
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed font-serif whitespace-pre-wrap">
                  {interpretation || "Inicia la generación para permitir que la inteligencia artificial analice los vicios tonales, silencios y contrastes armónicos de la melodía."}
                </p>
              </div>
            </div>

            {/* Quote of the developer filmmaker */}
            <div className="text-center p-4 bg-immersive-bg/20 border border-immersive-border rounded-2xl">
              <p className="text-xs text-slate-400 font-serif italic">
                "La música instrumental no está vacía de palabras; es un océano de palabras que no caben en los labios cotidianos."
              </p>
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mt-1 block">
                — Guía del Creador Sensorial
              </span>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
