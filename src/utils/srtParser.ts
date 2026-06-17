import { SubtitleBlock } from "../types";

// Convers "HH:MM:SS,mmm" or "HH:MM:SS.mmm" into numeric seconds
export function parseTimestampToSeconds(timeStr: string): number {
  if (!timeStr) return 0;
  // Replace dot with comma to normalize millisecond separator
  const normalized = timeStr.trim().replace(".", ",");
  const parts = normalized.split(":");
  if (parts.length < 3) return 0;

  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  
  const secondsParts = parts[2].split(",");
  const seconds = parseInt(secondsParts[0], 10) || 0;
  const milliseconds = parseInt(secondsParts[1], 10) || 0;

  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
}

// Converts numeric seconds into "HH:MM:SS,mmm"
export function formatSecondsToTimestamp(seconds: number): string {
  const hr = Math.floor(seconds / 3600);
  const min = Math.floor((seconds % 3600) / 60);
  const sec = Math.floor(seconds % 60);
  const ms = Math.round((seconds - Math.floor(seconds)) * 1000);

  const hrStr = String(hr).padStart(2, "0");
  const minStr = String(min).padStart(2, "0");
  const secStr = String(sec).padStart(2, "0");
  const msStr = String(ms).padStart(3, "0");

  return `${hrStr}:${minStr}:${secStr},${msStr}`;
}

// Parses a complete raw SRT string into individual subtitle blocks
export function parseSRT(srtContent: string): SubtitleBlock[] {
  if (!srtContent) return [];

  const blocks: SubtitleBlock[] = [];
  // Normalize carriage returns and split by multiple line breaks
  const rawSections = srtContent.trim().replace(/\r\n/g, "\n").split(/\n\s*\n/);

  for (const section of rawSections) {
    if (!section.trim()) continue;

    const lines = section.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) continue;

    // Detect line with the time arrow "-->"
    const timeIndex = lines.findIndex(l => l.includes("-->"));
    if (timeIndex === -1) continue;

    // The line with timestamp
    const timestampLine = lines[timeIndex];
    // Split on "-->"
    const timestampParts = timestampLine.split("-->").map(t => t.trim());
    if (timestampParts.length < 2) continue;

    const startTimeStr = timestampParts[0];
    const endTimeStr = timestampParts[1];

    const startTime = parseTimestampToSeconds(startTimeStr);
    const endTime = parseTimestampToSeconds(endTimeStr);

    // Everything before the timestamp is typically the index ID. Usually line at [timeIndex - 1]
    let id = blocks.length + 1;
    if (timeIndex > 0) {
      const parsedId = parseInt(lines[timeIndex - 1], 10);
      if (!isNaN(parsedId)) {
        id = parsedId;
      }
    }

    // Everything after the timestamp is the subtitle subtitle text
    const textLines = lines.slice(timeIndex + 1);
    const text = textLines.join("\n");

    blocks.push({
      id,
      startTime,
      endTime,
      startTimeStr,
      endTimeStr,
      text
    });
  }

  // Sort blocks chronologically
  return blocks.sort((a, b) => a.startTime - b.startTime);
}

// Compiles an array of SubtitleBlock objects back to a standard clean SRT string
export function compileSRT(blocks: SubtitleBlock[]): string {
  return blocks
    .map((block, index) => {
      const blockId = index + 1;
      return `${blockId}\n${block.startTimeStr} --> ${block.endTimeStr}\n${block.text}`;
    })
    .join("\n\n");
}
