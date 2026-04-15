import { useEffect, useState, useMemo } from 'react';
import styles from './PlayerPage.module.css';
import { DJDeck } from '../../components/DJDeck/DJDeck';
import { PlaylistQueue } from '../../components/PlaylistQueue/PlaylistQueue';
import { AddSongModal } from '../../components/AddSongModal/AddSongModal';
import { LocalFilesModal } from '../../components/LocalFilesModal/LocalFilesModal';
import { usePlaylist } from '../../hooks/usePlaylist';
import { usePlayer } from '../../hooks/usePlayer';
import { Song } from '../../types';

function useStars(count: number) {
  return useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        size: Math.random() * 2 + 0.5,
        duration: `${Math.random() * 4 + 2}s`,
        delay: `${Math.random() * 6}s`,
      })),
    [count]
  );
}

export function PlayerPage() {
  const { songs, currentSong, loading, fetchAllSongs, addSong, addManySongs, removeSong, selectSong } = usePlaylist();
  const { isPlaying } = usePlayer();
  const [showModal, setShowModal] = useState(false);
  const [showLocalModal, setShowLocalModal] = useState(false);
  const stars = useStars(100);

  useEffect(() => {
    fetchAllSongs();
  }, [fetchAllSongs]);

  const handleSelectSong = (song: Song) => {
    selectSong(song);
  };

  return (
    <div className={styles.page}>
      {/* Star field */}
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

      {/* Ambient gradient blobs */}
      <div className={styles.blob1} aria-hidden="true" />
      <div className={styles.blob2} aria-hidden="true" />

      {/* Top bar */}
      <header className={styles.topBar}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🎧</span>
          <span className={styles.appName}>DJ PLAYLIST</span>
        </div>
        <div className={styles.topRight}>
          <div className={`${styles.statusDot} ${isPlaying ? styles.statusPlaying : ''}`} />
          <span className={styles.statusText}>
            {isPlaying ? 'REPRODUCIENDO' : songs.length > 0 ? 'EN PAUSA' : 'SIN CANCIONES'}
          </span>
          {songs.length > 0 && (
            <span className={styles.songCount}>{songs.length} canciones</span>
          )}
        </div>
      </header>

      {/* Main layout */}
      <main className={styles.layout}>
        <div className={styles.centerColumn}>
          <DJDeck />
        </div>

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

      {/* FAB group */}
      <div className={styles.fabGroup}>
        {/* Local files button */}
        <button
          className={`${styles.fabBtn} ${styles.fabLocal}`}
          onClick={() => setShowLocalModal(true)}
          aria-label="Agregar desde archivos locales"
          title="Agregar desde archivos locales"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
          </svg>
        </button>

        {/* iTunes search button */}
        <button
          className={styles.fabBtn}
          onClick={() => setShowModal(true)}
          aria-label="Buscar en iTunes"
          title="Buscar en iTunes"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
        </button>
      </div>

      {showModal && (
        <AddSongModal
          onClose={() => setShowModal(false)}
          onAdd={addSong}
        />
      )}

      {showLocalModal && (
        <LocalFilesModal
          onClose={() => setShowLocalModal(false)}
          onAddAll={addManySongs}
        />
      )}
    </div>
  );
}
