import React from 'react';
import styles from './PlaylistQueue.module.css';
import { Song } from '../../types';

interface PlaylistQueueProps {
  songs: Song[];
  currentSong: Song | null;
  loading: boolean;
  onRemove: (id: string) => void;
  onSelectSong: (song: Song) => void;
}

/** Scrollable playlist queue with glass-morphism cards. */
export function PlaylistQueue({
  songs,
  currentSong,
  loading,
  onRemove,
  onSelectSong,
}: PlaylistQueueProps) {
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
        <span className={styles.title}>Cola de reproducción</span>
        <span className={styles.count}>{songs.length}</span>
      </div>

      {songs.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>🎵</span>
          <span className={styles.emptyText}>Tu playlist está vacía</span>
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
                <span className={styles.dragHandle} aria-hidden="true">⠿</span>
                <span className={styles.index}>{index + 1}</span>
                <div className={styles.songInfo}>
                  <span className={styles.songTitle}>{song.title}</span>
                  <span className={styles.songArtist}>{song.artist}</span>
                </div>
                <span className={styles.songDuration}>{song.duration}</span>
                <button
                  className={styles.removeBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(song.id);
                  }}
                  aria-label={`Eliminar ${song.title}`}
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
