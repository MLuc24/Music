import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { albumsApi } from './api';

export const ALBUMS_QUERY_KEY = ['albums'] as const;
const albumDetailKey = (id: string) => ['albums', id] as const;

export function useAlbums() {
  return useQuery({
    queryKey: ALBUMS_QUERY_KEY,
    queryFn: albumsApi.getAll,
  });
}

export function useAlbumDetail(id: string) {
  return useQuery({
    queryKey: albumDetailKey(id),
    queryFn: () => albumsApi.getDetail(id),
    enabled: !!id,
  });
}

export function useCreateAlbum() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, description }: { name: string; description?: string }) =>
      albumsApi.create(name, description),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ALBUMS_QUERY_KEY }),
  });
}

export function useUpdateAlbum() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name, description }: { id: string; name: string; description?: string }) =>
      albumsApi.update(id, name, description),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ALBUMS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: albumDetailKey(id) });
    },
  });
}

export function useDeleteAlbum() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => albumsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ALBUMS_QUERY_KEY }),
  });
}

export function useAddTrackToAlbum() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ albumId, trackId }: { albumId: string; trackId: string }) =>
      albumsApi.addTrack(albumId, trackId),
    onSuccess: (_data, { albumId }) => {
      queryClient.invalidateQueries({ queryKey: ALBUMS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: albumDetailKey(albumId) });
    },
  });
}

export function useRemoveTrackFromAlbum() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ albumId, trackId }: { albumId: string; trackId: string }) =>
      albumsApi.removeTrack(albumId, trackId),
    onSuccess: (_data, { albumId }) => {
      queryClient.invalidateQueries({ queryKey: ALBUMS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: albumDetailKey(albumId) });
    },
  });
}
