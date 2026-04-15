import React, { useRef, useCallback } from 'react';
import styles from './ControlPanel.module.css';
import { usePlayer } from '../../hooks/usePlayer';

const EQ_BARS = 7;
const EQ_HEIGHTS = [28, 40, 20, 36, 16, 32, 24]; // px heights per bar
const EQ_COLORS = (height: number) => {
  if (height > 32) return '#ef4444';
  if (height > 22) return '#eab308';
  return '#22c55e';
};

/** Full DJ control panel: transport, volume knob, shuffle, repeat, EQ bars. */
export function ControlPanel() {
  const {
    isPlaying,
    togglePlay,
    navigateNext,
    navigatePrev,
    volume,
    setVolume,
    isShuffle,
    toggleShuffle,
    isRepeat,
    toggleRepeat,
  } = usePlayer();

  // Volume knob drag
  const dragStart = useRef<{ y: number; vol: number } | null>(null);

  const onKnobMouseDown = useCallback(
    (e: React.MouseEvent) => {
      dragStart.current = { y: e.clientY, vol: volume };
      const onMove = (ev: MouseEvent) => {
        if (!dragStart.current) return;
        const delta = (dragStart.current.y - ev.clientY) * 0.8;
        const next = Math.min(100, Math.max(0, dragStart.current.vol + delta));
        setVolume(Math.round(next));
      };
      const onUp = () => {
        dragStart.current = null;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [volume, setVolume]
  );

  // Knob rotation: 0% = -135deg, 100% = 135deg
  const knobRotation = -135 + (volume / 100) * 270;

  return (
    <div className={styles.panel} role="group" aria-label="Panel de control">
      {/* Equalizer bars */}
      <div className={styles.eqSection} aria-hidden="true">
        {Array.from({ length: EQ_BARS }, (_, i) => {
          const h = EQ_HEIGHTS[i];
          return (
            <div
              key={i}
              className={`${styles.eqBar} ${isPlaying ? styles.animating : ''}`}
              style={{
                height: isPlaying ? undefined : '4px',
                background: EQ_COLORS(h),
                animationDelay: `calc(${i} * 0.12s)`,
                ['--bar-height' as string]: `${h}px`,
                ['--i' as string]: i,
              }}
            />
          );
        })}
      </div>

      {/* Transport controls */}
      <div className={styles.transport}>
        <button
          className={`${styles.btn} ${styles.btnPrev}`}
          onClick={navigatePrev}
          aria-label="Canción anterior"
          title="Anterior"
        >
          ◀◀
        </button>

        <button
          className={`${styles.btn} ${styles.btnPlay} ${isPlaying ? styles.playing : ''}`}
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <button
          className={`${styles.btn} ${styles.btnNext}`}
          onClick={navigateNext}
          aria-label="Siguiente canción"
          title="Siguiente"
        >
          ▶▶
        </button>
      </div>

      {/* Secondary controls + volume */}
      <div className={styles.secondary}>
        {/* Shuffle */}
        <button
          className={`${styles.btnIcon} ${isShuffle ? styles.active : ''}`}
          onClick={toggleShuffle}
          aria-label="Mezclar"
          title="Mezclar"
        >
          <span className={isShuffle ? styles.spinIcon : ''}>⇄</span>
        </button>

        {/* Repeat */}
        <button
          className={`${styles.btnIcon} ${isRepeat ? styles.active : ''}`}
          onClick={toggleRepeat}
          aria-label="Repetir"
          title="Repetir"
        >
          ↺
        </button>

        {/* Volume knob */}
        <div className={styles.volumeSection}>
          <span className={styles.volumeLabel}>Vol</span>
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
