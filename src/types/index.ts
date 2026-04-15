/** Core song shape — mirrors the backend Song entity. */
export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string; // MM:SS format
  genre: string;
  coverUrl?: string;
}

/** Payload for creating a new song. */
export interface CreateSongDTO {
  title: string;
  artist: string;
  album?: string;
  duration: string; // MM:SS
  genre: string;
  position: Position;
}

/** Generic API response wrapper. */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

/** Position in the doubly linked list. */
export type Position = 'first' | 'last' | number;
