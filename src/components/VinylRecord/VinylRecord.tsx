import styles from './VinylRecord.module.css';
import { Song } from '../../types';

interface VinylRecordProps {
  song: Song | null;
  isPlaying: boolean;
  size?: number;
}

export function VinylRecord({ song, isPlaying, size = 260 }: VinylRecordProps) {
  const r = size / 2;
  const grooves = Array.from({ length: 14 }, (_, i) => r * 0.97 - i * (r * 0.048));

  return (
    <div className={styles.wrapper} style={{ width: size, height: size }}>

      {/* Multi-ring pulse when playing */}
      {isPlaying && (
        <>
          <div className={styles.pulseRing1} />
          <div className={styles.pulseRing2} />
          <div className={styles.pulseRing3} />
        </>
      )}

      {/* Outer glow */}
      <div className={`${styles.glowRing} ${isPlaying ? styles.glowActive : ''}`} />

      {/* Disc */}
      <div
        className={`${styles.disc} ${isPlaying ? styles.spinning : styles.idle}`}
        style={{ width: size, height: size }}
      >
        {/* Album art layer */}
        {song?.coverUrl && (
          <div
            className={styles.albumArt}
            style={{ backgroundImage: `url(${song.coverUrl})` }}
          />
        )}

        <svg
          width={size} height={size}
          viewBox={`0 0 ${size} ${size}`}
          xmlns="http://www.w3.org/2000/svg"
          className={styles.svg}
        >
          <defs>
            {/* Vinyl gradient — dark with subtle color */}
            <radialGradient id="discGrad" cx="38%" cy="32%">
              <stop offset="0%"   stopColor="#2d1b69" />
              <stop offset="40%"  stopColor="#1a0a3e" />
              <stop offset="100%" stopColor="#0d0720" />
            </radialGradient>

            {/* Iridescent rainbow sheen */}
            <linearGradient id="rainbow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="#f472b6" stopOpacity="0.8" />
              <stop offset="20%"  stopColor="#a78bfa" stopOpacity="0.8" />
              <stop offset="40%"  stopColor="#60a5fa" stopOpacity="0.8" />
              <stop offset="60%"  stopColor="#34d399" stopOpacity="0.8" />
              <stop offset="80%"  stopColor="#fbbf24" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#f472b6" stopOpacity="0.8" />
            </linearGradient>

            {/* Label gradient */}
            <radialGradient id="labelGrad" cx="50%" cy="50%">
              <stop offset="0%"   stopColor="#7c3aed" />
              <stop offset="60%"  stopColor="#5b21b6" />
              <stop offset="100%" stopColor="#3b0764" />
            </radialGradient>

            <mask id="grooveMask">
              <rect width={size} height={size} fill="white" />
              <circle cx={r} cy={r} r={r * 0.32} fill="black" />
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
              stroke={i % 3 === 0 ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)'}
              strokeWidth={i % 3 === 0 ? 1.2 : 0.6}
            />
          ))}

          {/* Rainbow iridescent band */}
          <circle
            cx={r} cy={r} r={r * 0.68}
            fill="none"
            stroke="url(#rainbow)"
            strokeWidth={r * 0.24}
            opacity={0.18}
            mask="url(#grooveMask)"
          />

          {/* Highlight arc — top-left shine */}
          <path
            d={`M ${r - r * 0.6} ${r - r * 0.5} A ${r * 0.75} ${r * 0.75} 0 0 1 ${r + r * 0.4} ${r - r * 0.6}`}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={r * 0.15}
            strokeLinecap="round"
          />

          {/* Center label */}
          <circle cx={r} cy={r} r={r * 0.32} fill="url(#labelGrad)" />
          <circle cx={r} cy={r} r={r * 0.32} fill="none" stroke="rgba(167,139,250,0.6)" strokeWidth={1.5} />

          {/* Label decorative rings */}
          <circle cx={r} cy={r} r={r * 0.28} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={0.8} />
          <circle cx={r} cy={r} r={r * 0.22} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={0.6} />

          {/* Radial spokes */}
          {Array.from({ length: 12 }, (_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            return (
              <line
                key={i}
                x1={r + Math.cos(angle) * r * 0.17}
                y1={r + Math.sin(angle) * r * 0.17}
                x2={r + Math.cos(angle) * r * 0.29}
                y2={r + Math.sin(angle) * r * 0.29}
                stroke="rgba(167,139,250,0.3)"
                strokeWidth={0.7}
              />
            );
          })}

          {/* Center hole */}
          <circle cx={r} cy={r} r={r * 0.042} fill="#0d0720" />
          <circle cx={r} cy={r} r={r * 0.042} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={0.8} />
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
            <span className={styles.labelText} style={{ opacity: 0.5 }}>NO TRACK</span>
          )}
        </div>
      </div>

      {/* Tonearm shadow when playing */}
      {isPlaying && <div className={styles.tonearmShadow} />}
    </div>
  );
}
