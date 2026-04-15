import { useState, useRef } from 'react';
import styles from './PlaylistQueue.module.css';
import { Song } from '../../types';

interface PlaylistQueueProps {
  songs: Song[];
  currentSong: Song | null;
  loading: boolean;
  onRemove: (id: string) => void;
  onSelectSong: (song: Song) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  // DJ mode selection
  djMode?: boolean;
  djSelected?: Set<string>;
  onDJToggle?: (id: string) => void;
}

export function PlaylistQueue({
  songs, currentSong, loading,
  onRemove, onSelectSong, onReorder,
  djMode, djSelected, onDJToggle,
}: PlaylistQueueProps) {
  const dragIndexRef = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragIndexRef.current = index;
    e.dataTransfer.effectAllowed = 'move';
    // Ghost image
    const el = e.currentTarget as HTMLElement;
    e.dataTransfer.setDragImage(el, el.offsetWidth / 2, el.offsetHeight / 2);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(index);
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const fromIndex = dragIndexRef.current;
    if (fromIndex !== null && fromIndex !== toIndex) {
      onReorder(fromIndex, toIndex);
    }
    dragIndexRef.current = null;
    setDragOver(null);
  };

  const handleDragEnd = () => {
    dragIndexRef.current = null;
    setDragOver(null);
  };

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
        <div className={styles.headerRight}>
          {djMode && djSelected && djSelected.size > 0 && (
            <span className={styles.djCount}>{djSelected.size} en mix</span>
          )}
          <span className={styles.count}>{songs.length}</span>
        </div>
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
            const isDJSelected = djMode && djSelected?.has(song.id);
            const isDraggingOver = dragOver === index;

            return (
              <li
                key={song.id}
                className={[
                  styles.item,
                  isActive ? styles.active : '',
                  isDJSelected ? styles.djSelected : '',
                  isDraggingOver ? styles.dragOver : '',
                ].join(' ')}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                onClick={() => {
                  if (djMode && onDJToggle) onDJToggle(song.id);
                  else onSelectSong(song);
                }}
                aria-current={isActive ? 'true' : undefined}
              >
                {/* Drag handle */}
                <div className={styles.dragHandle} title="Arrastrar para reordenar">
                  <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
                    <circle cx="3" cy="2" r="1.2"/><circle cx="7" cy="2" r="1.2"/>
                    <circle cx="3" cy="7" r="1.2"/><circle cx="7" cy="7" r="1.2"/>
                    <circle cx="3" cy="12" r="1.2"/><circle cx="7" cy="12" r="1.2"/>
                  </svg>
                </div>

                {/* DJ checkbox or album art */}
                {djMode ? (
                  <div className={`${styles.djCheckbox} ${isDJSelected ? styles.djCheckboxOn : ''}`}>
                    {isDJSelected && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                    )}
                  </div>
                ) : (
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
                )}

                <div className={styles.songInfo}>
                  <span className={styles.songTitle}>{song.title}</span>
                  <span className={styles.songArtist}>{song.artist}</span>
                </div>

                <div className={styles.right}>
                  {song.youtubeId && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="#ff4444" aria-label="YouTube">
                      <path d="M21.8 8s-.2-1.4-.8-2c-.8-.8-1.6-.8-2-.9C16.2 5 12 5 12 5s-4.2 0-7 .1c-.4.1-1.2.1-2 .9-.6.6-.8 2-.8 2S2 9.6 2 11.2v1.5c0 1.6.2 3.2.2 3.2s.2 1.4.8 2c.8.8 1.8.8 2.2.8C6.8 19 12 19 12 19s4.2 0 7-.2c.4-.1 1.2-.1 2-.9.6-.6.8-2 .8-2s.2-1.6.2-3.2v-1.5C22 9.6 21.8 8 21.8 8zM9.7 14.5V9l5.4 2.8-5.4 2.7z"/>
                    </svg>
                  )}
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
