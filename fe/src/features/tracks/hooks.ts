import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tracksApi } from './api';
import type { Track } from '../../types/database';

export const TRACKS_QUERY_KEY = ['tracks'] as const;

export function useTracks() {
  return useQuery({
    queryKey: TRACKS_QUERY_KEY,
    queryFn: tracksApi.getAll,
  });
}

export function useDeleteTrack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, storagePath }: { id: string; storagePath: string }) =>
      tracksApi.delete(id, storagePath),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRACKS_QUERY_KEY });
    },
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tracksApi.toggleFavorite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRACKS_QUERY_KEY });
    },
  });
}

export function useUpdateTrack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, title, artist }: { id: string; title: string; artist: string | null }) =>
      tracksApi.update(id, title, artist),
    onSuccess: (updated: Track) => {
      queryClient.setQueryData<Track[]>(TRACKS_QUERY_KEY, (old) =>
        old ? old.map((t) => (t.id === updated.id ? updated : t)) : old,
      );
    },
  });
}

