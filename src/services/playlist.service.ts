import axios, { AxiosError } from 'axios';
import { ApiResponse, CreateSongDTO, Song } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api/v1',
  timeout: 10000,
});

// Response interceptor — log errors
api.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    console.error('[API Error]', err.message, err.response?.data);
    return Promise.reject(err);
  }
);

export const playlistService = {
  getAllSongs: (): Promise<ApiResponse<Song[]>> =>
    api.get<ApiResponse<Song[]>>('/playlist/songs').then((r) => r.data),

  getCurrentSong: (): Promise<ApiResponse<Song | null>> =>
    api.get<ApiResponse<Song | null>>('/playlist/songs/current').then((r) => r.data),

  addSong: (dto: CreateSongDTO): Promise<ApiResponse<Song>> =>
    api.post<ApiResponse<Song>>('/playlist/songs', dto).then((r) => r.data),

  removeSong: (id: string): Promise<ApiResponse<null>> =>
    api.delete<ApiResponse<null>>(`/playlist/songs/${id}`).then((r) => r.data),

  navigateNext: (): Promise<ApiResponse<Song | null>> =>
    api.post<ApiResponse<Song | null>>('/playlist/navigation/next').then((r) => r.data),

  navigatePrev: (): Promise<ApiResponse<Song | null>> =>
    api.post<ApiResponse<Song | null>>('/playlist/navigation/prev').then((r) => r.data),

  shufflePlaylist: (): Promise<ApiResponse<Song[]>> =>
    api.post<ApiResponse<Song[]>>('/playlist/shuffle').then((r) => r.data),
};
