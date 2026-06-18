export interface SubtitleBlock {
  id: number;
  startTime: number; // in seconds
  endTime: number; // in seconds
  startTimeStr: string; // "HH:MM:SS,mmm"
  endTimeStr: string; // "HH:MM:SS,mmm"
  text: string;
  imageUrl?: string;
  imagePrompt?: string;
  isGeneratingImg?: boolean;
}

export interface SongPreset {
  id: string;
  title: string;
  duration: number; // in seconds
  genre: string;
  poeticPrompt: string;
  syntheticSeedFreq: number; // frequency base for our procedural cosmic synthesizer
  storyIdea: string;
}

export interface GenerationResult {
  title: string;
  storySummary: string;
  interpretation: string;
  srt: string;
}
