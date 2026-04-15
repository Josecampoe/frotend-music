import { useCallback } from 'react';
import { usePlayerContext } from '../context/PlayerContext';
import { playlistService } from '../services/playlist.service';

/**
 * usePlayer — playback controls: play/pause, next, prev, volume, shuffle, repeat.
 */
export function usePlayer() {
  const {
    isPlaying,
    setIsPlaying,
    volume,
    setVolume,
    isShuffle,
    setIsShuffle,
    isRepeat,
    setIsRepeat,
    setCurrentSong,
    setSongs,
    addToast,
  } = usePlayerContext();

  const togglePlay = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying, setIsPlaying]);

  const navigateNext = useCallback(async () => {
    try {
      const res = await playlistService.navigateNext();
      if (res.success) {
        setCurrentSong(res.data);
      }
    } catch {
      addToast('Error al avanzar la canción', 'error');
    }
  }, [setCurrentSong, addToast]);

  const navigatePrev = useCallback(async () => {
    try {
      const res = await playlistService.navigatePrev();
      if (res.success) {
        setCurrentSong(res.data);
      }
    } catch {
      addToast('Error al retroceder la canción', 'error');
    }
  }, [setCurrentSong, addToast]);

  const toggleShuffle = useCallback(async () => {
    if (!isShuffle) {
      try {
        const res = await playlistService.shufflePlaylist();
        if (res.success) {
          setSongs(res.data);
          addToast('Playlist mezclada', 'success');
        }
      } catch {
        addToast('Error al mezclar', 'error');
      }
    }
    setIsShuffle(!isShuffle);
  }, [isShuffle, setIsShuffle, setSongs, addToast]);

  const toggleRepeat = useCallback(() => {
    setIsRepeat(!isRepeat);
  }, [isRepeat, setIsRepeat]);

  return {
    isPlaying,
    togglePlay,
    navigateNext,
    navigatePrev,
    volume,
    setVolume,
    isShuffle,
    toggleShuffle,
    isRepeat,
    toggleRepeat,
  };
}
