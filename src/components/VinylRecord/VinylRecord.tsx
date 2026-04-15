import styles from './VinylRecord.module.css';
import { Song } from '../../types';

interface VinylRecordProps {
  song: Song | null;
  isPlaying: boolean;
  size?: number;
}

/** Spinning vinyl disc with SVG grooves and neon glow ring. */
export function VinylRecord({ song, isPlaying, size = 220 }: VinylRecordProps) {
  const r = size / 2;

  // Build concentric groove rings
  const grooves = Array.from({ length: 10 }, (_, i) => {
    const radius = r * 0.95 - i * (r * 0.055);
    return radius;
  });

  return (
    <div className={styles.wrapper} style={{ width: size, height: size }}>
      <div className={`${styles.glowRing} ${isPlaying ? styles.playing : ''}`} />

      <div
        className={`${styles.disc} ${isPlaying ? styles.spinning : ''}`}
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer disc */}
          <circle cx={r} cy={r} r={r} fill="#0d0d14" />

          {/* Groove rings */}
          {grooves.map((radius, i) => (
            <circle
              key={i}
              cx={r}
              cy={r}
              r={radius}
              fill="none"
              stroke={i % 3 === 0 ? '#2a2a3e' : '#1e1e2e'}
              strokeWidth={i % 3 === 0 ? 1.5 : 0.8}
              opacity={0.7 - i * 0.04}
            />
          ))}

          {/* Iridescent sheen band */}
          <circle
            cx={r}
            cy={r}
            r={r * 0.72}
            fill="none"
            stroke="url(#iridescent)"
            strokeWidth={r * 0.18}
            opacity={0.25}
          />

          {/* Center label background */}
          <circle cx={r} cy={r} r={r * 0.28} fill="#1a0a2e" />
          <circle
            cx={r}
            cy={r}
            r={r * 0.28}
            fill="none"
            stroke="rgba(124,58,237,0.5)"
            strokeWidth={1.5}
          />

          {/* Radial label lines */}
          {Array.from({ length: 8 }, (_, i) => {
            const angle = (i * 45 * Math.PI) / 180;
            const x1 = r + Math.cos(angle) * r * 0.18;
            const y1 = r + Math.sin(angle) * r * 0.18;
            const x2 = r + Math.cos(angle) * r * 0.26;
            const y2 = r + Math.sin(angle) * r * 0.26;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="rgba(124,58,237,0.4)"
                strokeWidth={0.8}
              />
            );
          })}

          {/* Center hole */}
          <circle cx={r} cy={r} r={r * 0.04} fill="#0a0a0f" />

          <defs>
            <linearGradient id="iridescent" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.6" />
              <stop offset="33%" stopColor="#06b6d4" stopOpacity="0.6" />
              <stop offset="66%" stopColor="#ec4899" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.6" />
            </linearGradient>
          </defs>
        </svg>

        {/* Shimmer overlay */}
        <div className={styles.shimmer} />

        {/* Center label text */}
        <div className={styles.centerLabel}>
          <div className={styles.centerHole} />
          {song ? (
            <>
              <span className={styles.labelText}>{song.title}</span>
              <span className={styles.labelArtist}>{song.artist}</span>
            </>
          ) : (
            <span className={styles.labelText}>NO TRACK</span>
          )}
        </div>
      </div>
    </div>
  );
}
