import { useRef, useCallback, useState, useEffect } from 'react';
import styles from './ControlPanel.module.css';
import { usePlayer } from '../../hooks/usePlayer';
import { usePlayerContext } from '../../context/PlayerContext';

const BASE_HEIGHTS = [18, 32, 24, 40, 16, 36, 28, 42, 20, 34, 26, 38];

export function ControlPanel() {
  const {
    isPlaying, togglePlay,
    navigateNext, navigatePrev,
    volume, setVolume,
    isShuffle, toggleShuffle,
    isRepeat, toggleRepeat,
  } = usePlayer();
  const { currentSong, songs } = usePlayerContext();

  // Animated EQ heights
  const [eqHeights, setEqHeights] = useState(BASE_HEIGHTS);
  useEffect(() => {
    if (!isPlaying) { setEqHeights(BASE_HEIGHTS.map(() => 4)); return; }
    const id = setInterval(() => {
      setEqHeights(BASE_HEIGHTS.map((h) => Math.max(4, h + (Math.random() - 0.5) * 18)));
    }, 120);
    return () => clearInterval(id);
  }, [isPlaying]);

  // Progress simulation (0–1) for preview
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!isPlaying) return;
    setProgress(0);
    const start = Date.now();
    const total = 30000; // 30s preview
    const id = setInterval(() => {
      const p = Math.min((Date.now() - start) / total, 1);
      setProgress(p);
      if (p >= 1) clearInterval(id);
    }, 200);
    return () => clearInterval(id);
  }, [isPlaying, currentSong?.id]);

  // Volume knob drag
  const dragStart = useRef<{ y: number; vol: number } | null>(null);
  const onKnobMouseDown = useCallback((e: React.MouseEvent) => {
    dragStart.current = { y: e.clientY, vol: volume };
    const onMove = (ev: MouseEvent) => {
      if (!dragStart.current) return;
      const delta = (dragStart.current.y - ev.clientY) * 0.8;
      setVolume(Math.round(Math.min(100, Math.max(0, dragStart.current.vol + delta))));
    };
    const onUp = () => {
      dragStart.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [volume, setVolume]);

  const knobRotation = -135 + (volume / 100) * 270;
  const hasSongs = songs.length > 0;

  return (
    <div className={styles.panel} role="group" aria-label="Panel de control">

      {/* EQ visualizer */}
      <div className={styles.eqSection} aria-hidden="true">
        {eqHeights.map((h, i) => (
          <div
            key={i}
            className={styles.eqBar}
            style={{
              height: `${h}px`,
              background: h > 35
                ? 'linear-gradient(to top, #ef4444, #f97316)'
                : h > 22
                ? 'linear-gradient(to top, #eab308, #22c55e)'
                : 'linear-gradient(to top, #22c55e, #06b6d4)',
              transition: 'height 0.1s ease',
            }}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className={styles.progressWrapper}>
        <span className={styles.progressTime}>0:00</span>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progress * 100}%` }} />
          <div className={styles.progressThumb} style={{ left: `${progress * 100}%` }} />
        </div>
        <span className={styles.progressTime}>
          {currentSong?.duration ?? '0:00'}
        </span>
      </div>

      {/* Transport controls */}
      <div className={styles.transport}>
        <button
          className={`${styles.btn} ${styles.btnPrev}`}
          onClick={navigatePrev}
          disabled={!hasSongs}
          aria-label="Anterior"
          title="Anterior"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/>
          </svg>
        </button>

        <button
          className={`${styles.btn} ${styles.btnPlay} ${isPlaying ? styles.playing : ''}`}
          onClick={togglePlay}
          disabled={!hasSongs}
          aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
        >
          {isPlaying ? (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          ) : (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </button>

        <button
          className={`${styles.btn} ${styles.btnNext}`}
          onClick={navigateNext}
          disabled={!hasSongs}
          aria-label="Siguiente"
          title="Siguiente"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 18l8.5-6L6 6v12zm2.5-6 5.5 3.9V8.1L8.5 12zM16 6h2v12h-2z"/>
          </svg>
        </button>
      </div>

      {/* Secondary controls */}
      <div className={styles.secondary}>
        {/* Shuffle */}
        <button
          className={`${styles.iconBtn} ${isShuffle ? styles.active : ''}`}
          onClick={toggleShuffle}
          aria-label="Mezclar"
          title="Mezclar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10.59 9.17 5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
          </svg>
        </button>

        {/* Repeat */}
        <button
          className={`${styles.iconBtn} ${isRepeat ? styles.active : ''}`}
          onClick={toggleRepeat}
          aria-label="Repetir"
          title="Repetir"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
          </svg>
        </button>

        {/* Volume knob */}
        <div className={styles.volumeSection}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--color-text-muted)">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
          </svg>
          <div
            className={styles.volumeKnob}
            onMouseDown={onKnobMouseDown}
            role="slider"
            aria-label="Volumen"
            aria-valuenow={volume}
            aria-valuemin={0}
            aria-valuemax={100}
            tabIndex={0}
          >
            <div className={styles.knobOuter}>
              <div
                className={styles.knobDot}
                style={{ transform: `translateX(-50%) rotate(${knobRotation}deg)` }}
              />
            </div>
          </div>
          <span className={styles.volumeValue}>{volume}%</span>
        </div>
      </div>
    </div>
  );
}
