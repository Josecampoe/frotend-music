import { useCallback } from 'react';
import { usePlayerContext } from '../context/PlayerContext';
import { playlistService } from '../services/playlist.service';
import { Song } from '../types';

/** usePlaylist — CRUD operations using local state + localStorage. */
export function usePlaylist() {
  const { songs, setSongs, currentSong, setCurrentSong, loading, setLoading, addToast } =
    usePlayerContext();

  const fetchAllSongs = useCallback(() => {
    setLoading(true);
    try {
      const all = playlistService.getAllSongs();
      const current = playlistService.getCurrentSong();
      setSongs(all);
      setCurrentSong(current);
    } finally {
      setLoading(false);
    }
  }, [setSongs, setCurrentSong, setLoading]);

  const addSong = useCallback(
    async (dto: Omit<Song, 'id'>) => {
      const newSong = playlistService.addSong(dto);
      const all = playlistService.getAllSongs();
      setSongs(all);
      // Auto-select if first song
      if (all.length === 1) setCurrentSong(newSong);
      addToast(`"${dto.title}" agregada al playlist`, 'success');
    },
    [setSongs, setCurrentSong, addToast]
  );

  const removeSong = useCallback(
    (id: string) => {
      const song = songs.find((s) => s.id === id);
      playlistService.removeSong(id);
      const all = playlistService.getAllSongs();
      setSongs(all);
      const current = playlistService.getCurrentSong();
      setCurrentSong(current);
      addToast(`"${song?.title ?? 'Canción'}" eliminada`, 'info');
    },
    [songs, setSongs, setCurrentSong, addToast]
  );

  const selectSong = useCallback(
    (song: Song) => {
      const selected = playlistService.setCurrentById(song.id);
      if (selected) setCurrentSong(selected);
    },
    [setCurrentSong]
  );

  return { songs, currentSong, loading, fetchAllSongs, addSong, removeSong, selectSong };
}
