import { useCallback } from 'react';
import { usePlayerContext } from '../context/PlayerContext';
import { playlistService } from '../services/playlist.service';

/** usePlayer — playback controls: play/pause, next, prev, volume, shuffle, repeat. */
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

  const navigateNext = useCallback(() => {
    const next = playlistService.navigateNext();
    setCurrentSong(next);
    if (next) setIsPlaying(true);
  }, [setCurrentSong, setIsPlaying]);

  const navigatePrev = useCallback(() => {
    const prev = playlistService.navigatePrev();
    setCurrentSong(prev);
    if (prev) setIsPlaying(true);
  }, [setCurrentSong, setIsPlaying]);

  const toggleShuffle = useCallback(() => {
    if (!isShuffle) {
      const shuffled = playlistService.shufflePlaylist();
      setSongs(shuffled);
      const current = playlistService.getCurrentSong();
      setCurrentSong(current);
      addToast('Playlist mezclada 🔀', 'success');
    }
    setIsShuffle(!isShuffle);
  }, [isShuffle, setIsShuffle, setSongs, setCurrentSong, addToast]);

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
