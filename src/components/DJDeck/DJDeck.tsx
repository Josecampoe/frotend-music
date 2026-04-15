import styles from './DJDeck.module.css';
import { VinylRecord } from '../VinylRecord/VinylRecord';
import { ControlPanel } from '../ControlPanel/ControlPanel';
import { usePlayerContext } from '../../context/PlayerContext';
import { usePlayer } from '../../hooks/usePlayer';

export function DJDeck() {
  const { currentSong, bpm } = usePlayerContext();
  const { isPlaying } = usePlayer();

  return (
    <div className={styles.deck}>
      {/* Album art glow backdrop */}
      {currentSong?.coverUrl && (
        <div
          className={styles.artGlow}
          style={{ backgroundImage: `url(${currentSong.coverUrl})` }}
        />
      )}

      <div className={styles.inner}>
        {/* Vinyl + album art */}
        <div className={styles.vinylSection}>
          <VinylRecord
            song={currentSong}
            isPlaying={isPlaying && !!currentSong}
            size={240}
          />
        </div>

        {/* Song info */}
        <div className={styles.songInfo}>
          {currentSong ? (
            <>
              <p className={styles.songTitle}>{currentSong.title}</p>
              <p className={styles.songArtist}>{currentSong.artist}</p>
              <p className={styles.songMeta}>
                {currentSong.album && <span>{currentSong.album}</span>}
                {currentSong.album && currentSong.genre && <span className={styles.dot}>·</span>}
                {currentSong.genre && <span>{currentSong.genre}</span>}
                {currentSong.duration && <span className={styles.dot}>·</span>}
                <span>{currentSong.duration}</span>
              </p>
            </>
          ) : (
            <>
              <p className={styles.songTitle} style={{ opacity: 0.3 }}>Sin canción</p>
              <p className={styles.songArtist} style={{ opacity: 0.3 }}>Agrega canciones al playlist</p>
            </>
          )}

          {/* BPM badge */}
          <div className={styles.bpmBadge}>
            <span className={styles.bpmValue}>{bpm}</span>
            <span className={styles.bpmLabel}>BPM</span>
          </div>
        </div>

        {/* Preview badge */}
        {currentSong?.previewUrl && (
          <div className={styles.previewBadge}>
            🎵 Preview iTunes 30s
          </div>
        )}
      </div>

      <ControlPanel />
    </div>
  );
}
