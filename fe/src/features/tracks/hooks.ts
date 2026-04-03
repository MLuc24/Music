import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tracksApi } from './api';
import type { Track, TrackQuery } from '../../types/database';

export const TRACKS_QUERY_KEY = ['tracks'] as const;
export const LIBRARY_SUMMARY_QUERY_KEY = ['library-summary'] as const;

export function useTracks(query?: TrackQuery) {
  return useQuery({
    queryKey: [...TRACKS_QUERY_KEY, query ?? {}],
    queryFn: () => tracksApi.getAll(query),
  });
}

export function useLibrarySummary() {
  return useQuery({
    queryKey: LIBRARY_SUMMARY_QUERY_KEY,
    queryFn: tracksApi.getSummary,
  });
}

export function useDeleteTrack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tracksApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRACKS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: LIBRARY_SUMMARY_QUERY_KEY });
    },
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tracksApi.toggleFavorite(id),
    onSuccess: (updated: Track) => {
      queryClient.setQueriesData<Track[]>({ queryKey: TRACKS_QUERY_KEY }, (old) =>
        old ? old.map((track) => (track.id === updated.id ? updated : track)) : old,
      );
      queryClient.invalidateQueries({ queryKey: LIBRARY_SUMMARY_QUERY_KEY });
    },
  });
}

export function useUpdateTrack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, title, artist }: { id: string; title: string; artist: string | null }) =>
      tracksApi.update(id, title, artist),
    onSuccess: (updated: Track) => {
      queryClient.setQueriesData<Track[]>({ queryKey: TRACKS_QUERY_KEY }, (old) =>
        old ? old.map((t) => (t.id === updated.id ? updated : t)) : old,
      );
      queryClient.invalidateQueries({ queryKey: LIBRARY_SUMMARY_QUERY_KEY });
    },
  });
}

