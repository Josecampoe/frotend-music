import { useEffect, useRef } from 'react';
import styles from './YouTubePlayer.module.css';

interface YouTubePlayerProps {
  videoId: string;
  isPlaying: boolean;
  volume: number; // 0–100
  onEnded: () => void;
  onReady: () => void;
}

declare global {
  interface Window {
    YT: {
      Player: new (el: HTMLElement, opts: object) => YTPlayer;
      PlayerState: { ENDED: number; PLAYING: number; PAUSED: number };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  setVolume(v: number): void;
  destroy(): void;
  getPlayerState(): number;
}

// Load the YouTube IFrame API script once
let apiLoaded = false;
let apiReady = false;
const readyCallbacks: (() => void)[] = [];

function loadYTApi(): Promise<void> {
  return new Promise((resolve) => {
    if (apiReady) { resolve(); return; }
    readyCallbacks.push(resolve);
    if (apiLoaded) return;
    apiLoaded = true;

    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(script);

    window.onYouTubeIframeAPIReady = () => {
      apiReady = true;
      readyCallbacks.forEach((cb) => cb());
      readyCallbacks.length = 0;
    };
  });
}

export function YouTubePlayer({ videoId, isPlaying, volume, onEnded, onReady }: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const readyRef = useRef(false);

  // Initialize player
  useEffect(() => {
    let destroyed = false;

    loadYTApi().then(() => {
      if (destroyed || !containerRef.current) return;

      // Destroy previous player if any
      playerRef.current?.destroy();
      readyRef.current = false;

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          enablejsapi: 1,
        },
        events: {
          onReady: (e: { target: YTPlayer }) => {
            if (destroyed) return;
            readyRef.current = true;
            e.target.setVolume(volume);
            onReady();
            if (isPlaying) e.target.playVideo();
          },
          onStateChange: (e: { data: number }) => {
            if (e.data === window.YT.PlayerState.ENDED) onEnded();
          },
        },
      });
    });

    return () => {
      destroyed = true;
      playerRef.current?.destroy();
      playerRef.current = null;
      readyRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  // Sync play/pause
  useEffect(() => {
    if (!readyRef.current || !playerRef.current) return;
    if (isPlaying) playerRef.current.playVideo();
    else playerRef.current.pauseVideo();
  }, [isPlaying]);

  // Sync volume
  useEffect(() => {
    if (!readyRef.current || !playerRef.current) return;
    playerRef.current.setVolume(volume);
  }, [volume]);

  return (
    <div className={styles.wrapper}>
      <div ref={containerRef} className={styles.iframe} />
    </div>
  );
}

/** Utility: extract YouTube video ID from any YouTube URL format */
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/, // bare ID
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

/** Fetch video title/channel from YouTube oEmbed (no API key needed) */
export async function fetchYouTubeMeta(videoId: string): Promise<{ title: string; author: string } | null> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return { title: data.title ?? '', author: data.author_name ?? '' };
  } catch {
    return null;
  }
}
