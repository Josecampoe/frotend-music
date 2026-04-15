/**
 * local-audio.service.ts
 * Reads audio files from the user's device.
 * - Extracts duration via HTMLAudioElement
 * - Parses title/artist from filename ("Artist - Title.mp3")
 * - Creates an object URL for playback (valid for the session)
 */
import { Song } from '../types';

const AUDIO_EXTS = /\.(mp3|m4a|aac|ogg|flac|wav|opus|wma)$/i;

/** Parse "Artist - Title" or just "Title" from a filename. */
function parseName(filename: string): { title: string; artist: string } {
  const base = filename.replace(AUDIO_EXTS, '').trim();
  const sep = base.indexOf(' - ');
  if (sep !== -1) {
    return {
      artist: base.slice(0, sep).trim(),
      title: base.slice(sep + 3).trim(),
    };
  }
  return { title: base, artist: 'Desconocido' };
}

/** Get audio duration in seconds via HTMLAudioElement. */
function getDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    const url = URL.createObjectURL(file);
    audio.src = url;
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(isFinite(audio.duration) ? audio.duration : 0);
    };
    audio.onerror = () => { URL.revokeObjectURL(url); resolve(0); };
  });
}

/** Format seconds to MM:SS */
function secToMMSS(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export interface LocalTrack {
  file: File;
  title: string;
  artist: string;
  duration: string;
  objectUrl: string; // for playback — valid this session only
}

/** Process a list of File objects into LocalTrack metadata. */
export async function processFiles(
  files: File[],
  onProgress?: (done: number, total: number) => void
): Promise<LocalTrack[]> {
  const audio = files.filter((f) => AUDIO_EXTS.test(f.name));
  const results: LocalTrack[] = [];

  for (let i = 0; i < audio.length; i++) {
    const file = audio[i];
    const { title, artist } = parseName(file.name);
    const duration = await getDuration(file);
    const objectUrl = URL.createObjectURL(file);
    results.push({ file, title, artist, duration: secToMMSS(duration), objectUrl });
    onProgress?.(i + 1, audio.length);
  }

  return results;
}

/** Convert a LocalTrack to a Song (without id — playlist service assigns it). */
export function localTrackToSong(track: LocalTrack): Omit<Song, 'id'> {
  return {
    title: track.title,
    artist: track.artist,
    album: '',
    duration: track.duration,
    genre: '',
    previewUrl: track.objectUrl, // plays the actual file
  };
}
