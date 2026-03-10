import { useEffect, useRef } from 'react';
import { usePlayerStore } from './playerStore';

/** Syncs the HTML audio element with the player Zustand store */
export function useAudioSync() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { streamUrl, isPlaying, volume, setCurrentTime, setDuration, setIsPlaying } =
    usePlayerStore();

  // Initialize audio element once
  useEffect(() => {
    audioRef.current = new Audio();

    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  // Sync stream URL
  useEffect(() => {
    if (!audioRef.current) return;
    if (streamUrl) {
      audioRef.current.src = streamUrl;
      audioRef.current.load();
    }
  }, [streamUrl]);

  // Sync play/pause
  useEffect(() => {
    if (!audioRef.current || !streamUrl) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => setIsPlaying(false));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, streamUrl, setIsPlaying]);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // Register audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration || 0);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
    };
  }, [setCurrentTime, setDuration, setIsPlaying]);

  const seek = (time: number) => {
    if (audioRef.current) audioRef.current.currentTime = time;
  };

  return { seek };
}
