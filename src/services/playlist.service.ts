/**
 * playlist.service.ts — 100% frontend, no backend needed.
 * Persists the playlist in localStorage.
 */
import { Song } from '../types';

const STORAGE_KEY = 'dj-playlist';
const CURRENT_KEY = 'dj-current-index';

function load(): Song[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function save(songs: Song[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(songs));
}

function loadCurrentIndex(): number {
  return parseInt(localStorage.getItem(CURRENT_KEY) ?? '0', 10) || 0;
}

function saveCurrentIndex(i: number): void {
  localStorage.setItem(CURRENT_KEY, String(i));
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const playlistService = {
  getAllSongs(): Song[] {
    return load();
  },

  getCurrentSong(): Song | null {
    const songs = load();
    if (!songs.length) return null;
    const idx = Math.min(loadCurrentIndex(), songs.length - 1);
    return songs[idx] ?? null;
  },

  addSong(song: Omit<Song, 'id'>): Song {
    const songs = load();
    const newSong: Song = { ...song, id: crypto.randomUUID() };
    songs.push(newSong);
    save(songs);
    // If first song, set as current
    if (songs.length === 1) saveCurrentIndex(0);
    return newSong;
  },

  removeSong(id: string): void {
    const songs = load();
    const idx = songs.findIndex((s) => s.id === id);
    if (idx === -1) return;
    songs.splice(idx, 1);
    save(songs);
    // Adjust current index
    const cur = loadCurrentIndex();
    if (cur >= songs.length) saveCurrentIndex(Math.max(0, songs.length - 1));
  },

  navigateNext(): Song | null {
    const songs = load();
    if (!songs.length) return null;
    const next = (loadCurrentIndex() + 1) % songs.length;
    saveCurrentIndex(next);
    return songs[next];
  },

  navigatePrev(): Song | null {
    const songs = load();
    if (!songs.length) return null;
    const prev = (loadCurrentIndex() - 1 + songs.length) % songs.length;
    saveCurrentIndex(prev);
    return songs[prev];
  },

  setCurrentById(id: string): Song | null {
    const songs = load();
    const idx = songs.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    saveCurrentIndex(idx);
    return songs[idx];
  },

  shufflePlaylist(): Song[] {
    const songs = load();
    const shuffled = shuffle(songs);
    save(shuffled);
    saveCurrentIndex(0);
    return shuffled;
  },
};
