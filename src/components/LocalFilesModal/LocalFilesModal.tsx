import { useState, useRef, useCallback } from 'react';
import styles from './LocalFilesModal.module.css';
import { processFiles, localTrackToSong, LocalTrack } from '../../services/local-audio.service';
import { Song } from '../../types';

interface LocalFilesModalProps {
  onClose: () => void;
  onAddAll: (songs: Omit<Song, 'id'>[]) => Promise<void>;
}

export function LocalFilesModal({ onClose, onAddAll }: LocalFilesModalProps) {
  const [tracks, setTracks] = useState<LocalTrack[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [adding, setAdding] = useState(false);
  const [dragging, setDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files);
    if (!arr.length) return;
    setProcessing(true);
    setProgress({ done: 0, total: arr.length });
    try {
      const result = await processFiles(arr, (done, total) => setProgress({ done, total }));
      setTracks(result);
      setSelected(new Set(result.map((_, i) => i))); // select all by default
    } finally {
      setProcessing(false);
    }
  }, []);

  // Drag & drop
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const toggleSelect = (i: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(selected.size === tracks.length ? new Set() : new Set(tracks.map((_, i) => i)));
  };

  const handleAdd = async () => {
    const toAdd = tracks
      .filter((_, i) => selected.has(i))
      .map(localTrackToSong);
    if (!toAdd.length) return;
    setAdding(true);
    try {
      await onAddAll(toAdd);
      onClose();
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="local-modal-title">

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.headerIcon}>📁</span>
            <h2 id="local-modal-title" className={styles.title}>Archivos locales</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        {tracks.length === 0 ? (
          <>
            {/* Drop zone */}
            <div
              className={`${styles.dropZone} ${dragging ? styles.dragging : ''}`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            >
              {processing ? (
                <div className={styles.processingState}>
                  <div className={styles.spinner} />
                  <p className={styles.processingText}>
                    Leyendo archivos... {progress.done}/{progress.total}
                  </p>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className={styles.dropIcon}>🎵</div>
                  <p className={styles.dropTitle}>Arrastra tus archivos aquí</p>
                  <p className={styles.dropSub}>MP3, M4A, AAC, FLAC, WAV, OGG y más</p>
                  <div className={styles.dropBtns}>
                    <button
                      type="button"
                      className={styles.pickBtn}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 3l-4 4h3v4h2V7h3l-4-4zm-7 9v7h14v-7h-2v5H7v-5H5z"/>
                      </svg>
                      Seleccionar archivos
                    </button>
                    <button
                      type="button"
                      className={`${styles.pickBtn} ${styles.pickBtnFolder}`}
                      onClick={() => folderInputRef.current?.click()}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
                      </svg>
                      Abrir carpeta
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Hidden inputs */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="audio/*"
              style={{ display: 'none' }}
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
            <input
              ref={folderInputRef}
              type="file"
              // @ts-expect-error webkitdirectory is non-standard but widely supported
              webkitdirectory=""
              multiple
              accept="audio/*"
              style={{ display: 'none' }}
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
          </>
        ) : (
          <>
            {/* Track list */}
            <div className={styles.listHeader}>
              <label className={styles.selectAllLabel}>
                <input
                  type="checkbox"
                  checked={selected.size === tracks.length}
                  onChange={toggleAll}
                  className={styles.checkbox}
                />
                <span>Seleccionar todo ({tracks.length})</span>
              </label>
              <span className={styles.selectedCount}>
                {selected.size} seleccionadas
              </span>
            </div>

            <ul className={styles.trackList}>
              {tracks.map((track, i) => (
                <li
                  key={i}
                  className={`${styles.trackItem} ${selected.has(i) ? styles.trackSelected : ''}`}
                  onClick={() => toggleSelect(i)}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(i)}
                    onChange={() => toggleSelect(i)}
                    onClick={(e) => e.stopPropagation()}
                    className={styles.checkbox}
                  />
                  <div className={styles.trackIcon}>🎵</div>
                  <div className={styles.trackInfo}>
                    <span className={styles.trackTitle}>{track.title}</span>
                    <span className={styles.trackArtist}>{track.artist}</span>
                  </div>
                  <span className={styles.trackDuration}>{track.duration}</span>
                </li>
              ))}
            </ul>

            {/* Footer actions */}
            <div className={styles.footer}>
              <button
                type="button"
                className={styles.backBtn}
                onClick={() => { setTracks([]); setSelected(new Set()); }}
              >
                ← Volver
              </button>
              <button
                type="button"
                className={styles.addBtn}
                onClick={handleAdd}
                disabled={selected.size === 0 || adding}
              >
                {adding
                  ? 'Agregando...'
                  : `Agregar ${selected.size} canción${selected.size !== 1 ? 'es' : ''}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
