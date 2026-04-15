import { useEffect, useRef, useCallback } from 'react';
import { PlayerProvider, usePlayerContext } from './context/PlayerContext';
import { PlayerPage } from './pages/PlayerPage/PlayerPage';
import { ToastContainer } from './components/Toast/Toast';
import { playlistService } from './services/playlist.service';
import { djMixEngine } from './services/dj-mix.service';
import './styles/globals.css';

/**
 * AudioEngine — handles all audio playback.
 * In normal mode: simple HTMLAudioElement.
 * In DJ mode: Web Audio API crossfade engine.
 */
function AudioEngine() {
  const {
    currentSong, isPlaying, setIsPlaying,
    volume, isRepeat, isDJMode,
    setCurrentSong, addToast,
  } = usePlayerContext();

  // Normal mode audio element
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Track whether we're currently in a DJ crossfade
  const mixingRef = useRef(false);
  const prevSongIdRef = useRef<string | null>(null);

  // ── Normal mode setup ────────────────────────────────────────────────────
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.preload = 'none';
    return () => {
      audioRef.current?.pause();
      djMixEngine.destroy();
    };
  }, []);

  // Sync volume to both engines
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
    djMixEngine.setMasterVolume(volume / 100);
  }, [volume]);

  // ── Song change handler ──────────────────────────────────────────────────
  useEffect(() => {
    // YouTube songs are handled by the YouTubePlayer iframe — skip audio engine
    if (currentSong?.youtubeId) {
      audioRef.current?.pause();
      return;
    }
    if (!currentSong?.previewUrl) return;
    const isNewSong = currentSong.id !== prevSongIdRef.current;
    prevSongIdRef.current = currentSong.id;

    if (!isNewSong) return;

    if (isDJMode && isPlaying && !mixingRef.current) {
      // DJ mode: crossfade to new song
      mixingRef.current = true;
      djMixEngine.init();
      djMixEngine.resume().then(() => {
        djMixEngine.crossfadeTo(currentSong.previewUrl!, (newAudio) => {
          // After crossfade, the new audio is already playing inside the engine
          // We just need to track its end
          newAudio.onended = () => handleTrackEnd();
          mixingRef.current = false;
        });
      });
    } else if (!isDJMode) {
      // Normal mode
      const audio = audioRef.current!;
      audio.pause();
      audio.src = currentSong.previewUrl;
      audio.load();
      if (isPlaying) {
        audio.play().catch(() => setIsPlaying(false));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSong?.id]);

  // ── Play/pause sync (normal mode) ────────────────────────────────────────
  useEffect(() => {
    if (isDJMode) return;
    if (currentSong?.youtubeId) return; // YouTube iframe handles this
    const audio = audioRef.current;
    if (!audio || !currentSong?.previewUrl) return;

    if (isPlaying) {
      if (audio.src !== currentSong.previewUrl) {
        audio.src = currentSong.previewUrl;
        audio.load();
      }
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [isPlaying, isDJMode, currentSong?.previewUrl, setIsPlaying]);

  // ── DJ mode: load first song when activated ──────────────────────────────
  useEffect(() => {
    if (!isDJMode || !currentSong?.previewUrl) return;
    // Stop normal audio
    audioRef.current?.pause();
    djMixEngine.init();
    const deckA = djMixEngine.loadDeckA(currentSong.previewUrl);
    if (isPlaying) {
      djMixEngine.resume().then(() => {
        deckA.play().catch(() => {});
        deckA.onended = () => handleTrackEnd();
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDJMode]);

  // ── Track end handler ────────────────────────────────────────────────────
  const handleTrackEnd = useCallback(() => {
    if (isRepeat) {
      if (isDJMode) {
        const a = djMixEngine.deckAAudio;
        if (a) { a.currentTime = 0; a.play().catch(() => {}); }
      } else {
        const audio = audioRef.current;
        if (audio) { audio.currentTime = 0; audio.play().catch(() => setIsPlaying(false)); }
      }
      return;
    }
    const next = playlistService.navigateNext();
    if (next) {
      setCurrentSong(next);
      setIsPlaying(true);
      if (isDJMode) {
        addToast(`🎛️ Mezclando → ${next.title}`, 'info');
      }
    } else {
      setIsPlaying(false);
    }
  }, [isRepeat, isDJMode, setCurrentSong, setIsPlaying, addToast]);

  // ── Normal mode: track end ───────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => { if (!isDJMode) handleTrackEnd(); };
    audio.addEventListener('ended', onEnded);
    return () => audio.removeEventListener('ended', onEnded);
  }, [isDJMode, handleTrackEnd]);

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
