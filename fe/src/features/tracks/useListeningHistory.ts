const STORAGE_KEY = 'nhac_listen_history';
const MAX_HISTORY = 300;

interface PlayRecord {
  trackId: string;
  count: number;
  lastPlayed: number;
}

type HistoryMap = Record<string, PlayRecord>;

function loadHistory(): HistoryMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as HistoryMap) : {};
  } catch {
    return {};
  }
}

function saveHistory(map: HistoryMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // storage unavailable – ignore
  }
}

export function recordPlay(trackId: string): void {
  const map = loadHistory();
  const existing = map[trackId];
  map[trackId] = {
    trackId,
    count: (existing?.count ?? 0) + 1,
    lastPlayed: Date.now(),
  };
  const entries = Object.values(map);
  if (entries.length > MAX_HISTORY) {
    entries
      .sort((a, b) => a.lastPlayed - b.lastPlayed)
      .slice(0, entries.length - MAX_HISTORY)
      .forEach((r) => delete map[r.trackId]);
  }
  saveHistory(map);
}

export function getTopTrackIds(limit: number): string[] {
  return Object.values(loadHistory())
    .sort((a, b) => b.count - a.count || b.lastPlayed - a.lastPlayed)
    .slice(0, limit)
    .map((r) => r.trackId);
}

export function getPlayCount(trackId: string): number {
  return loadHistory()[trackId]?.count ?? 0;
}
