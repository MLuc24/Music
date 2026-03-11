import { useEffect } from 'react';
import { usePlayerStore } from './playerStore';

const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

/**
 * Global keyboard shortcuts for the player.
 * Must be called once (in App.tsx) after useAudioSync.
 *
 * Shortcuts:
 *   0-9          → seek to 0%–90% of track
 *   Space / K    → play / pause
 *   ← / →        → seek ±5s
 *   Shift+← / →  → seek ±30s
 *   ↑ / ↓        → volume ±5%
 *   M            → toggle mute
 *   L            → toggle loop
 *   < / >        → decrease / increase playback speed
 *   F            → toggle full-screen modal
 *   Esc          → close modal
 */
export function usePlayerKeyboard(seek: (time: number) => void): void {
  const {
    isPlaying, currentTime, duration, volume, isLooping,
    playbackRate, isModalOpen, currentTrack,
    setIsPlaying, setVolume, setIsLooping, setPlaybackRate, setIsModalOpen,
  } = usePlayerStore();

  useEffect(() => {
    if (!currentTrack) return;

    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      switch (e.key) {
        case ' ':
        case 'k':
        case 'K':
          e.preventDefault();
          setIsPlaying(!isPlaying);
          break;

        case '0': case '1': case '2': case '3': case '4':
        case '5': case '6': case '7': case '8': case '9':
          e.preventDefault();
          seek((duration * Number(e.key)) / 10);
          break;

        case 'ArrowLeft':
          e.preventDefault();
          seek(Math.max(0, currentTime - (e.shiftKey ? 30 : 5)));
          break;

        case 'ArrowRight':
          e.preventDefault();
          seek(Math.min(duration, currentTime + (e.shiftKey ? 30 : 5)));
          break;

        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(1, Math.round((volume + 0.05) * 100) / 100));
          break;

        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(0, Math.round((volume - 0.05) * 100) / 100));
          break;

        case 'm':
        case 'M':
          setVolume(volume > 0 ? 0 : 0.8);
          break;

        case 'l':
        case 'L':
          setIsLooping(!isLooping);
          break;

        case '>':
          e.preventDefault();
          {
            const idx = RATES.indexOf(playbackRate);
            if (idx < RATES.length - 1) setPlaybackRate(RATES[idx + 1]);
          }
          break;

        case '<':
          e.preventDefault();
          {
            const idx = RATES.indexOf(playbackRate);
            if (idx > 0) setPlaybackRate(RATES[idx - 1]);
          }
          break;

        case 'f':
        case 'F':
          setIsModalOpen(!isModalOpen);
          break;

        case 'Escape':
          if (isModalOpen) setIsModalOpen(false);
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [
    isPlaying, currentTime, duration, volume, isLooping,
    playbackRate, isModalOpen, currentTrack, seek,
    setIsPlaying, setVolume, setIsLooping, setPlaybackRate, setIsModalOpen,
  ]);
}
