import React, { useState } from 'react';
import styles from './AddSongModal.module.css';
import { CreateSongDTO, Position } from '../../types';

interface AddSongModalProps {
  onClose: () => void;
  onAdd: (dto: CreateSongDTO) => Promise<void>;
}

const GENRES = ['Pop', 'Rock', 'Electronic', 'Hip-Hop', 'Jazz', 'Reggaeton', 'Salsa', 'Classical'];

interface FormState {
  title: string;
  artist: string;
  album: string;
  duration: string;
  genre: string;
}

const EMPTY: FormState = { title: '', artist: '', album: '', duration: '', genre: '' };

/** Modal for adding a new song with position selector. */
export function AddSongModal({ onClose, onAdd }: AddSongModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [positionType, setPositionType] = useState<'first' | 'last' | 'specific'>('last');
  const [specificPos, setSpecificPos] = useState(1);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = (): boolean => {
    const errs: Partial<FormState> = {};
    if (!form.title.trim()) errs.title = 'Requerido';
    if (!form.artist.trim()) errs.artist = 'Requerido';
    if (!form.duration.trim()) errs.duration = 'Requerido';
    else if (!/^\d{1,2}:\d{2}$/.test(form.duration)) errs.duration = 'Formato MM:SS';
    if (!form.genre) errs.genre = 'Requerido';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormState]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const position: Position =
      positionType === 'specific' ? specificPos : positionType;
    try {
      await onAdd({
        title: form.title.trim(),
        artist: form.artist.trim(),
        album: form.album.trim() || undefined,
        duration: form.duration.trim(),
        genre: form.genre,
        position,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className={styles.modalHeader}>
          <h2 id="modal-title" className={styles.modalTitle}>Agregar canción</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {/* Title */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="title">
              Título <span className={styles.required}>*</span>
            </label>
            <input
              id="title"
              name="title"
              className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
              placeholder="Nombre de la canción"
              value={form.title}
              onChange={handleChange}
            />
            {errors.title && <span className={styles.errorMsg}>{errors.title}</span>}
          </div>

          {/* Artist */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="artist">
              Artista <span className={styles.required}>*</span>
            </label>
            <input
              id="artist"
              name="artist"
              className={`${styles.input} ${errors.artist ? styles.inputError : ''}`}
              placeholder="Nombre del artista"
              value={form.artist}
              onChange={handleChange}
            />
            {errors.artist && <span className={styles.errorMsg}>{errors.artist}</span>}
          </div>

          {/* Album */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="album">Álbum</label>
            <input
              id="album"
              name="album"
              className={styles.input}
              placeholder="Nombre del álbum (opcional)"
              value={form.album}
              onChange={handleChange}
            />
          </div>

          {/* Duration + Genre row */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div className={styles.field} style={{ flex: 1 }}>
              <label className={styles.label} htmlFor="duration">
                Duración <span className={styles.required}>*</span>
              </label>
              <input
                id="duration"
                name="duration"
                className={`${styles.input} ${errors.duration ? styles.inputError : ''}`}
                placeholder="3:45"
                value={form.duration}
                onChange={handleChange}
              />
              {errors.duration && <span className={styles.errorMsg}>{errors.duration}</span>}
            </div>

            <div className={styles.field} style={{ flex: 1 }}>
              <label className={styles.label} htmlFor="genre">
                Género <span className={styles.required}>*</span>
              </label>
              <select
                id="genre"
                name="genre"
                className={`${styles.select} ${errors.genre ? styles.inputError : ''}`}
                value={form.genre}
                onChange={handleChange}
              >
                <option value="">Seleccionar</option>
                {GENRES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
              {errors.genre && <span className={styles.errorMsg}>{errors.genre}</span>}
            </div>
          </div>

          {/* Position selector */}
          <div className={styles.field}>
            <label className={styles.label}>Posición</label>
            <div className={styles.positionGroup}>
              {(['first', 'last', 'specific'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`${styles.posBtn} ${positionType === p ? styles.selected : ''}`}
                  onClick={() => setPositionType(p)}
                >
                  {p === 'first' ? 'Al inicio' : p === 'last' ? 'Al final' : 'Posición específica'}
                </button>
              ))}
            </div>
            {positionType === 'specific' && (
              <input
                type="number"
                min={1}
                className={styles.input}
                style={{ marginTop: '0.5rem' }}
                placeholder="Número de posición"
                value={specificPos}
                onChange={(e) => setSpecificPos(Math.max(1, Number(e.target.value)))}
              />
            )}
          </div>

          <button type="submit" className={styles.submitBtn} disabled={submitting}>
            {submitting ? 'Agregando...' : 'Agregar al playlist'}
          </button>
        </form>
      </div>
    </div>
  );
}
