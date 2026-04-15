import React from 'react';
import styles from './DJDeck.module.css';
import { VinylRecord } from '../VinylRecord/VinylRecord';
import { ControlPanel } from '../ControlPanel/ControlPanel';
import { usePlayerContext } from '../../context/PlayerContext';
import { usePlayer } from '../../hooks/usePlayer';

/** Main DJ turntable component — vinyl + song info + controls. */
export function DJDeck() {
  const { currentSong } = usePlayerContext();
  const { isPlaying } = usePlayer();

  return (
    <div className={styles.deck}>
      <VinylRecord
        coverUrl={currentSong?.coverUrl ?? ''}
        isSpinning={isPlaying && !!currentSong}
      />
      <div className={styles.info}>
        <p className={styles.title}>{currentSong?.title ?? 'No track selected'}</p>
        <p className={styles.artist}>{currentSong?.artist ?? '—'}</p>
        <p className={styles.album}>{currentSong?.album ?? ''}</p>
      </div>
      <ControlPanel />
    </div>
  );
}
