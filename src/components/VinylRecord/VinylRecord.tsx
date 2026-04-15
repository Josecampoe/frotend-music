import styles from './VinylRecord.module.css';
import { Song } from '../../types';

interface VinylRecordProps {
  song: Song | null;
  isPlaying: boolean;
  size?: number;
}

export function VinylRecord({ song, isPlaying, size = 240 }: VinylRecordProps) {
  const r = size / 2;
  const grooves = Array.from({ length: 12 }, (_, i) => r * 0.96 - i * (r * 0.05));

  return (
    <div className={styles.wrapper} style={{ width: size, height: size }}>
      {/* Outer glow ring */}
      <div className={`${styles.glowRing} ${isPlaying ? styles.playing : ''}`} />

      {/* Disc */}
      <div
        className={`${styles.disc} ${isPlaying ? styles.spinning : ''}`}
        style={{ width: size, height: size }}
      >
        {/* Album art as background if available */}
        {song?.coverUrl && (
          <div
            className={styles.albumArt}
            style={{ backgroundImage: `url(${song.coverUrl})` }}
          />
        )}

        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          xmlns="http://www.w3.org/2000/svg"
          className={styles.svg}
        >
          <defs>
            <linearGradient id="iridescent" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="#7c3aed" stopOpacity="0.7" />
              <stop offset="33%"  stopColor="#06b6d4" stopOpacity="0.7" />
              <stop offset="66%"  stopColor="#ec4899" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.7" />
            </linearGradient>
            <radialGradient id="discGrad" cx="40%" cy="35%">
              <stop offset="0%"   stopColor="#1e1e3a" />
              <stop offset="100%" stopColor="#0a0a14" />
            </radialGradient>
            <mask id="labelMask">
              <rect width={size} height={size} fill="white" />
              <circle cx={r} cy={r} r={r * 0.3} fill="black" />
            </mask>
          </defs>

          {/* Base disc */}
          <circle cx={r} cy={r} r={r} fill="url(#discGrad)" />

          {/* Groove rings */}
          {grooves.map((radius, i) => (
            <circle
              key={i}
              cx={r} cy={r} r={radius}
              fill="none"
              stroke={i % 4 === 0 ? '#2e2e4e' : '#1a1a2e'}
              strokeWidth={i % 4 === 0 ? 1.5 : 0.7}
              opacity={0.8 - i * 0.03}
            />
          ))}

          {/* Iridescent sheen */}
          <circle
            cx={r} cy={r} r={r * 0.7}
            fill="none"
            stroke="url(#iridescent)"
            strokeWidth={r * 0.22}
            opacity={0.2}
            mask="url(#labelMask)"
          />

          {/* Center label area */}
          <circle cx={r} cy={r} r={r * 0.3} fill={song?.coverUrl ? 'rgba(0,0,0,0.6)' : '#1a0a2e'} />
          <circle cx={r} cy={r} r={r * 0.3} fill="none" stroke="rgba(124,58,237,0.5)" strokeWidth={1.5} />

          {/* Radial spokes on label */}
          {Array.from({ length: 8 }, (_, i) => {
            const angle = (i * 45 * Math.PI) / 180;
            return (
              <line
                key={i}
                x1={r + Math.cos(angle) * r * 0.18}
                y1={r + Math.sin(angle) * r * 0.18}
                x2={r + Math.cos(angle) * r * 0.28}
                y2={r + Math.sin(angle) * r * 0.28}
                stroke="rgba(124,58,237,0.35)"
                strokeWidth={0.8}
              />
            );
          })}

          {/* Center hole */}
          <circle cx={r} cy={r} r={r * 0.045} fill="#050508" />
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
            <span className={styles.labelText} style={{ opacity: 0.4 }}>NO TRACK</span>
          )}
        </div>
      </div>

      {/* Playing indicator pulse */}
      {isPlaying && <div className={styles.playPulse} />}
    </div>
  );
}
