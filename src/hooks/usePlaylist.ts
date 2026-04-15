import { useCallback } from 'react';
import { usePlayerContext } from '../context/PlayerContext';
import { playlistService } from '../services/playlist.service';
import { CreateSongDTO } from '../types';

/**
 * usePlaylist — CRUD operations for the playlist.
 */
export function usePlaylist() {
  const { songs, setSongs, currentSong, setCurrentSong, loading, setLoading, addToast } =
    usePlayerContext();

  const fetchAllSongs = useCallback(async () => {
    setLoading(true);
    try {
      const [songsRes, currentRes] = await Promise.all([
        playlistService.getAllSongs(),
        playlistService.getCurrentSong(),
      ]);
      if (songsRes.success) setSongs(songsRes.data);
      if (currentRes.success) setCurrentSong(currentRes.data);
    } catch {
      addToast('Error al cargar el playlist', 'error');
    } finally {
      setLoading(false);
    }
  }, [setSongs, setCurrentSong, setLoading, addToast]);

  const addSong = useCallback(
    async (dto: CreateSongDTO) => {
      try {
        const res = await playlistService.addSong(dto);
        if (res.success) {
          await fetchAllSongs();
          addToast(`"${dto.title}" agregada al playlist`, 'success');
        }
      } catch {
        addToast('Error al agregar la canción', 'error');
      }
    },
    [fetchAllSongs, addToast]
  );

  const removeSong = useCallback(
    async (id: string) => {
      const song = songs.find((s) => s.id === id);
      try {
        const res = await playlistService.removeSong(id);
        if (res.success) {
          await fetchAllSongs();
          addToast(`"${song?.title ?? 'Canción'}" eliminada`, 'info');
        }
      } catch {
        addToast('Error al eliminar la canción', 'error');
      }
    },
    [songs, fetchAllSongs, addToast]
  );

  return { songs, currentSong, loading, fetchAllSongs, addSong, removeSong };
}
