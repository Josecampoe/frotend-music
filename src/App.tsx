import { useEffect, useRef } from 'react';
import { PlayerProvider, usePlayerContext } from './context/PlayerContext';
import { PlayerPage } from './pages/PlayerPage/PlayerPage';
import { ToastContainer } from './components/Toast/Toast';
import { playlistService } from './services/playlist.service';
import './styles/globals.css';

/** Manages the HTML Audio element for iTunes preview playback. */
function AudioEngine() {
  const { currentSong, isPlaying, setIsPlaying, volume, isRepeat, setCurrentSong } = usePlayerContext();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.preload = 'none';
    return () => { audioRef.current?.pause(); };
  }, []);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume]);

  // Sync song source — supports both iTunes URLs and local object URLs
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const url = currentSong?.previewUrl ?? '';
    if (audio.src !== url) {
      audio.pause();
      audio.src = url;
      if (url) audio.load();
    }
  }, [currentSong?.previewUrl, currentSong?.id]);

  // Sync play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying && currentSong?.previewUrl) {
      const p = audio.play();
      if (p) p.catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [isPlaying, currentSong?.previewUrl, currentSong?.id, setIsPlaying]);

  // Handle end of track
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => {
      if (isRepeat) {
        audio.currentTime = 0;
        audio.play().catch(() => setIsPlaying(false));
      } else {
        // Auto-advance to next song
        const next = playlistService.navigateNext();
        if (next) {
          setCurrentSong(next);
          setIsPlaying(true);
        } else {
          setIsPlaying(false);
        }
      }
    };
    audio.addEventListener('ended', onEnded);
    return () => audio.removeEventListener('ended', onEnded);
  }, [isRepeat, setIsPlaying, setCurrentSong]);

  return null;
}

function App() {
  return (
    <PlayerProvider>
      <AudioEngine />
      <PlayerPage />
      <ToastContainer />
    </PlayerProvider>
  );
}

export default App;
