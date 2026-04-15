/** Core song shape. */
export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;   // MM:SS format
  genre: string;
  coverUrl?: string;  // Album artwork from iTunes
  previewUrl?: string; // iTunes 30-second preview
}

/** Position in the playlist when adding. */
export type Position = 'first' | 'last' | number;
