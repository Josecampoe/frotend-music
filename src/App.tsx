import { useEffect, useRef } from 'react';
import { PlayerProvider, usePlayerContext } from './context/PlayerContext';
import { PlayerPage } from './pages/PlayerPage/PlayerPage';
import { ToastContainer } from './components/Toast/Toast';
import './styles/globals.css';

/** Manages the HTML Audio element for iTunes preview playback. */
function AudioEngine() {
  const { currentSong, isPlaying, setIsPlaying, volume } = usePlayerContext();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Create audio element once
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.preload = 'none';
    return () => { audioRef.current?.pause(); };
  }, []);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume]);

  // Sync song source when current song changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const url = currentSong?.previewUrl ?? '';
    if (audio.src !== url) {
      audio.pause();
      audio.src = url;
      audio.load();
    }
  }, [currentSong?.previewUrl]);

  // Sync play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying && currentSong?.previewUrl) {
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [isPlaying, currentSong?.previewUrl, setIsPlaying]);

  // Stop when preview ends
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => setIsPlaying(false);
    audio.addEventListener('ended', onEnded);
    return () => audio.removeEventListener('ended', onEnded);
  }, [setIsPlaying]);

  return null;
}

/** Root component — wraps the app in the global PlayerProvider. */
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
