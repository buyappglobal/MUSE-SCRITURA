import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Set up JSON body sizes to support base64 audio uploads (max 50MB)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Lazy initializer for GoogleGenAI to prevent crashing if the key is not defined at boot
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("El secreto GEMINI_API_KEY no está configurado en el panel Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Endpoint to generate subtitles (SRT) from song title and duration (optional audio)
app.post("/api/generate-srt", async (req, res) => {
  try {
    const { title, duration, audioBase64, audioMimeType, poeticPrompt } = req.body;

    if (!title) {
      return res.status(400).json({ error: "El título de la canción es requerido." });
    }

    const durationSeconds = parseInt(duration, 10);
    if (!durationSeconds || durationSeconds <= 0) {
      return res.status(400).json({ error: "La duración de la canción debe ser un número positivo de segundos." });
    }

    const ai = getAiClient();

    // Prepare contents array for Gemini
    const contents: any[] = [];

    // If an audio file is uploaded, send it as a multimodal part to Gemini!
    if (audioBase64 && audioMimeType) {
      // Validate that it looks like base64
      const cleanBase64 = audioBase64.replace(/^data:audio\/\w+;base64,/, "");
      contents.push({
        inlineData: {
          data: cleanBase64,
          mimeType: audioMimeType,
        },
      });
    }

    // Add instructions and prompt
    contents.push({
      text: `Título de la pieza musical: "${title}"
Duración total: ${durationSeconds} segundos.
Atmósfera o pista poética: "${poeticPrompt || "Libre, mística y abstracta"}"

Por favor, como guionista y experto musical, analiza la pieza (si hay audio adjunto, escúchala y captura su ritmo emocional; si no lo hay, infiérenlo del título) y escribe un guion poético de subtítulos en formato SRT válido.
Los subtítulos deben distribuirse de manera equitativa a lo largo de toda la canción (desde el segundo 0 hasta el segundo ${durationSeconds}). Cada bloque de subtítulo debe durar entre 5 y 8 segundos, cubriendo la totalidad del tiempo sin dejar vacíos prolongados.
El texto debe ser poético, místico, evocador de imágenes abstractas, ideal para una película cinemática sensorial de autor.

Genera tu respuesta en formato JSON estructurado con el siguiente esquema:
- "title": El título de la pieza.
- "storySummary": Un breve resumen poético de la historia visual sugerida (1 o 2 párrafos).
- "interpretation": Una reflexión sobre el ritmo musical y los matices emocionales asociados.
- "srt": Los subtítulos formateados estrictamente en formato de subtítulo SRT SubRip válido. Asegúrate de incluir los números secuenciales, los timestamps correctos en formato "HH:MM:SS,mmm --> HH:MM:SS,mmm", y el texto correspondiente.

Ejemplo de formato SRT esperado en la clave "srt":
1
00:00:00,000 --> 00:00:06,000
El silencio inicial se rompe con una luz tenue.

2
00:00:06,000 --> 00:00:12,000
Las primeras notas flotan en el vacío de la memoria...`
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: "Eres un director de cine artístico y un profundo guionista de poesía visual. Generas subtítulos líricos y místicos para música instrumental, creando un viaje sensorial. Distribuyes los bloques de tiempo de forma equilibrada y uniforme. Te comunicas en español.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "El título de la canción instrumental"
            },
            storySummary: {
              type: Type.STRING,
              description: "Resumen literario de la visión cinematográfica detrás del guion"
            },
            interpretation: {
              type: Type.STRING,
              description: "Análisis de la atmósfera emocional y rítmica"
            },
            srt: {
              type: Type.STRING,
              description: "Subtítulos en formato SRT SubRip clásico válidos, distribuidos equitativamente hasta la duración total de la canción."
            }
          },
          required: ["title", "storySummary", "interpretation", "srt"]
        }
      }
    });

    const textResponse = response.text;
    if (!textResponse) {
      throw new Error("No se pudo obtener una respuesta válida del modelo de IA.");
    }

    const data = JSON.parse(textResponse);
    return res.json(data);

  } catch (error: any) {
    console.error("Error al generar guion SRT:", error);
    return res.status(500).json({
      error: error.message || "Error interno del servidor al procesar la solicitud con Gemini."
    });
  }
});

// Configure Vite or production static file serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development mode with Vite Dev Server Middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server middleware loaded.");
  } else {
    // Production mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log(`Serving static files from production folder: ${distPath}`);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully started on http://0.0.0.0:${PORT}`);
  });
}

startServer();
