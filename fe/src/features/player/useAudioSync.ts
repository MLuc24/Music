import { useCallback, useEffect, useRef } from 'react';
import { usePlayerStore } from './playerStore';

/** Syncs the HTML audio element with the player Zustand store.
 *  Must be called exactly ONCE — in App.tsx — and seek passed down as prop. */
export function useAudioSync() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamUrl = usePlayerStore((state) => state.streamUrl);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const volume = usePlayerStore((state) => state.volume);
  const isLooping = usePlayerStore((state) => state.isLooping);
  const playbackRate = usePlayerStore((state) => state.playbackRate);
  const setCurrentTime = usePlayerStore((state) => state.setCurrentTime);
  const setDuration = usePlayerStore((state) => state.setDuration);
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying);

  // Initialize audio element once
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.preload = 'metadata';
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  // Sync stream URL
  useEffect(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;

    if (!streamUrl) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      setCurrentTime(0);
      setDuration(0);
      return;
    }

    if (audio.src !== streamUrl) {
      audio.src = streamUrl;
      audio.load();
    }
  }, [streamUrl, setCurrentTime, setDuration]);

  // Sync play/pause
  useEffect(() => {
    if (!audioRef.current || !streamUrl) return;
    if (isPlaying) {
      audioRef.current.play().catch((error) => {
        console.error('Audio playback failed:', error);
        setIsPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, streamUrl, setIsPlaying]);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // Sync loop
  useEffect(() => {
    if (audioRef.current) audioRef.current.loop = isLooping;
  }, [isLooping]);

  // Sync playback rate
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  // Register audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration || 0);
    const onEnded = () => setIsPlaying(false);
    const onError = () => {
      console.error('Audio element error:', audio.error);
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, [setCurrentTime, setDuration, setIsPlaying]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) audioRef.current.currentTime = time;
  }, []);

  return { seek };
}
