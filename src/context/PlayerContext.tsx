import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { Song } from '../types';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface PlayerContextValue {
  // Playlist state
  songs: Song[];
  setSongs: (songs: Song[]) => void;
  currentSong: Song | null;
  setCurrentSong: (song: Song | null) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;

  // Playback state
  isPlaying: boolean;
  setIsPlaying: (v: boolean) => void;
  volume: number;
  setVolume: (v: number) => void;
  isShuffle: boolean;
  setIsShuffle: (v: boolean) => void;
  isRepeat: boolean;
  setIsRepeat: (v: boolean) => void;

  // Toast notifications
  toasts: Toast[];
  addToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: number) => void;

  // BPM (simulated)
  bpm: number;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(75);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [bpm] = useState(() => Math.floor(Math.random() * 60) + 80); // 80–140
  const toastCounter = useRef(0);

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = ++toastCounter.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        songs,
        setSongs,
        currentSong,
        setCurrentSong,
        loading,
        setLoading,
        isPlaying,
        setIsPlaying,
        volume,
        setVolume,
        isShuffle,
        setIsShuffle,
        isRepeat,
        setIsRepeat,
        toasts,
        addToast,
        removeToast,
        bpm,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayerContext(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayerContext must be used inside PlayerProvider');
  return ctx;
}
