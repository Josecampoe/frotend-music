import { useEffect, useState, useMemo } from 'react';
import styles from './PlayerPage.module.css';
import { DJDeck } from '../../components/DJDeck/DJDeck';
import { PlaylistQueue } from '../../components/PlaylistQueue/PlaylistQueue';
import { AddSongModal } from '../../components/AddSongModal/AddSongModal';
import { usePlaylist } from '../../hooks/usePlaylist';
import { usePlayer } from '../../hooks/usePlayer';
import { Song } from '../../types';

/** Generate random star positions for the background particle field. */
function useStars(count: number) {
  return useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        size: Math.random() * 2.5 + 0.5,
        duration: `${Math.random() * 4 + 2}s`,
        delay: `${Math.random() * 5}s`,
      })),
    [count]
  );
}

/** Main player page — full DJ layout. */
export function PlayerPage() {
  const { songs, currentSong, loading, fetchAllSongs, addSong, removeSong } = usePlaylist();
  const { isPlaying } = usePlayer();
  const [showModal, setShowModal] = useState(false);
  const stars = useStars(80);

  useEffect(() => {
    fetchAllSongs();
  }, [fetchAllSongs]);

  const handleSelectSong = (_song: Song) => {
    // Optimistically set current song for immediate UI feedback
    // The actual navigation is handled by the backend
  };

  return (
    <div className={styles.page}>
      {/* Star field background */}
      <div className={styles.stars} aria-hidden="true">
        {stars.map((s) => (
          <div
            key={s.id}
            className={styles.star}
            style={{
              top: s.top,
              left: s.left,
              width: s.size,
              height: s.size,
              ['--duration' as string]: s.duration,
              ['--delay' as string]: s.delay,
            }}
          />
        ))}
      </div>

      {/* Top bar */}
      <header className={styles.topBar}>
        <span className={styles.appName}>DJ PLAYLIST</span>
        <div className={styles.topRight}>
          <div className={styles.statusDot} />
          <span className={styles.statusText}>
            {isPlaying ? 'REPRODUCIENDO' : 'EN PAUSA'}
          </span>
        </div>
      </header>

      {/* Main layout */}
      <main className={styles.layout}>
        {/* Center column: deck + controls */}
        <div className={styles.centerColumn}>
          <DJDeck />
        </div>

        {/* Right sidebar: playlist queue */}
        <aside className={styles.sidebar}>
          <PlaylistQueue
            songs={songs}
            currentSong={currentSong}
            loading={loading}
            onRemove={removeSong}
            onSelectSong={handleSelectSong}
          />
        </aside>
      </main>

      {/* Floating add button */}
      <button
        className={styles.fabBtn}
        onClick={() => setShowModal(true)}
        aria-label="Agregar canción"
        title="Agregar canción"
      >
        +
      </button>

      {/* Add song modal */}
      {showModal && (
        <AddSongModal
          onClose={() => setShowModal(false)}
          onAdd={addSong}
        />
      )}
    </div>
  );
}
