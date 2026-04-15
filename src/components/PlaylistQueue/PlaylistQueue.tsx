import styles from './PlaylistQueue.module.css';
import { Song } from '../../types';

interface PlaylistQueueProps {
  songs: Song[];
  currentSong: Song | null;
  loading: boolean;
  onRemove: (id: string) => void;
  onSelectSong: (song: Song) => void;
}

export function PlaylistQueue({ songs, currentSong, loading, onRemove, onSelectSong }: PlaylistQueueProps) {
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.skeleton}>
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className={styles.skeletonItem} style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>Playlist</span>
        <span className={styles.count}>{songs.length}</span>
      </div>

      {songs.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🎵</div>
          <p className={styles.emptyTitle}>Tu playlist está vacía</p>
          <p className={styles.emptyHint}>Presiona + para buscar canciones en iTunes</p>
        </div>
      ) : (
        <ul className={styles.list} aria-label="Lista de canciones">
          {songs.map((song, index) => {
            const isActive = song.id === currentSong?.id;
            return (
              <li
                key={song.id}
                className={`${styles.item} ${isActive ? styles.active : ''}`}
                onClick={() => onSelectSong(song)}
                aria-current={isActive ? 'true' : undefined}
              >
                {/* Album art or index */}
                <div className={styles.artWrapper}>
                  {song.coverUrl ? (
                    <img src={song.coverUrl} alt={song.album} className={styles.art} />
                  ) : (
                    <div className={styles.artPlaceholder}>
                      <span className={styles.artIndex}>{index + 1}</span>
                    </div>
                  )}
                  {isActive && (
                    <div className={styles.playingOverlay}>
                      <span className={styles.playingDots}>
                        <span /><span /><span />
                      </span>
                    </div>
                  )}
                </div>

                <div className={styles.songInfo}>
                  <span className={styles.songTitle}>{song.title}</span>
                  <span className={styles.songArtist}>{song.artist}</span>
                </div>

                <div className={styles.right}>
                  <span className={styles.songDuration}>{song.duration}</span>
                  <button
                    className={styles.removeBtn}
                    onClick={(e) => { e.stopPropagation(); onRemove(song.id); }}
                    aria-label={`Eliminar ${song.title}`}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
