/** iTunes Search API — no auth required, CORS-friendly from browser. */

export interface ItunesTrack {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName: string;
  trackTimeMillis: number;
  primaryGenreName: string;
  artworkUrl100: string;
  previewUrl: string; // 30-second AAC preview
}

interface ItunesSearchResponse {
  resultCount: number;
  results: ItunesTrack[];
}

/** Format milliseconds to MM:SS */
export function msToMMSS(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

/** Search iTunes for songs matching the query. Returns up to `limit` results. */
export async function searchItunes(query: string, limit = 8): Promise<ItunesTrack[]> {
  if (!query.trim()) return [];
  const params = new URLSearchParams({
    term: query,
    entity: 'song',
    limit: String(limit),
    media: 'music',
  });
  const res = await fetch(`https://itunes.apple.com/search?${params}`);
  if (!res.ok) throw new Error('iTunes search failed');
  const data: ItunesSearchResponse = await res.json();
  // Only return tracks that have a preview URL
  return data.results.filter((t) => t.previewUrl);
}
