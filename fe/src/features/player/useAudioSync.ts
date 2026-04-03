import { useCallback, useEffect, useRef } from 'react';
import { usePlayerStore } from './playerStore';
import { logAppError } from '../../lib/logger';

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
  const playNextFromQueue = usePlayerStore((state) => state.playNextFromQueue);

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.preload = 'metadata';

    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

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

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !streamUrl) return;

    if (isPlaying) {
      audio.play().catch((error) => {
        logAppError('audio', 'Audio playback failed', error);
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, setIsPlaying, streamUrl]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.loop = isLooping;
  }, [isLooping]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      void playNextFromQueue();
    };
    const onError = () => {
      logAppError('audio', 'Audio element error', audio.error);
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
  }, [playNextFromQueue, setCurrentTime, setDuration, setIsPlaying]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  }, []);

  return { seek };
}
