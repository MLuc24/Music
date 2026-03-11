export interface LyricLine {
  time: number; // seconds
  text: string;
}

export interface LyricsData {
  lines: LyricLine[];    // populated when synced (LRC) lyrics available
  plain: string | null;  // fallback plain text
  isSynced: boolean;
}
