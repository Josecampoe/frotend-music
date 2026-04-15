import styles from './DJDeck.module.css';
import { VinylRecord } from '../VinylRecord/VinylRecord';
import { ControlPanel } from '../ControlPanel/ControlPanel';
import { YouTubePlayer } from '../YouTubePlayer/YouTubePlayer';
import { usePlayerContext } from '../../context/PlayerContext';
import { usePlayer } from '../../hooks/usePlayer';
import { playlistService } from '../../services/playlist.service';

export function DJDeck() {
  const { currentSong, bpm, setIsPlaying, setCurrentSong, volume, isRepeat } = usePlayerContext();
  const { isPlaying: playerIsPlaying } = usePlayer();
  const isYT = !!currentSong?.youtubeId;

  const handleYTEnded = () => {
    if (isRepeat) return; // YT player will loop via its own controls
    const next = playlistService.navigateNext();
    if (next) { setCurrentSong(next); setIsPlaying(true); }
    else setIsPlaying(false);
  };

  return (
    <div className={styles.deck}>
      {/* Album art glow backdrop */}
      {currentSong?.coverUrl && !isYT && (
        <div
          className={styles.artGlow}
          style={{ backgroundImage: `url(${currentSong.coverUrl})` }}
        />
      )}

      <div className={styles.inner}>
        {isYT && currentSong?.youtubeId ? (
          /* ── YouTube mode ── */
          <div className={styles.ytSection}>
            <YouTubePlayer
              videoId={currentSong.youtubeId}
              isPlaying={playerIsPlaying}
              volume={volume}
              onEnded={handleYTEnded}
              onReady={() => {}}
            />
            <div className={styles.ytBadge}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#ff0000">
                <path d="M21.8 8s-.2-1.4-.8-2c-.8-.8-1.6-.8-2-.9C16.2 5 12 5 12 5s-4.2 0-7 .1c-.4.1-1.2.1-2 .9-.6.6-.8 2-.8 2S2 9.6 2 11.2v1.5c0 1.6.2 3.2.2 3.2s.2 1.4.8 2c.8.8 1.8.8 2.2.8C6.8 19 12 19 12 19s4.2 0 7-.2c.4-.1 1.2-.1 2-.9.6-.6.8-2 .8-2s.2-1.6.2-3.2v-1.5C22 9.6 21.8 8 21.8 8zM9.7 14.5V9l5.4 2.8-5.4 2.7z"/>
              </svg>
              YouTube — canción completa
            </div>
          </div>
        ) : (
          /* ── Vinyl mode ── */
          <>
            <div className={styles.vinylSection}>
              <VinylRecord
                song={currentSong}
                isPlaying={playerIsPlaying && !!currentSong}
                size={240}
              />
            </div>

            {currentSong?.previewUrl && (
              <div className={styles.previewBadge}>🎵 Preview iTunes 30s</div>
            )}
          </>
        )}

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
                {currentSong.duration && <><span className={styles.dot}>·</span><span>{currentSong.duration}</span></>}
              </p>
            </>
          ) : (
            <>
              <p className={styles.songTitle} style={{ opacity: 0.3 }}>Sin canción</p>
              <p className={styles.songArtist} style={{ opacity: 0.3 }}>Agrega canciones al playlist</p>
            </>
          )}
          <div className={styles.bpmBadge}>
            <span className={styles.bpmValue}>{bpm}</span>
            <span className={styles.bpmLabel}>BPM</span>
          </div>
        </div>
      </div>

      <ControlPanel />
    </div>
  );
}
