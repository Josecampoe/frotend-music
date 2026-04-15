import { useState, useEffect, useRef } from 'react';
import styles from './AddSongModal.module.css';
import { Song } from '../../types';
import { searchItunes, msToMMSS, ItunesTrack } from '../../services/itunes.service';
import { extractYouTubeId, fetchYouTubeMeta } from '../YouTubePlayer/YouTubePlayer';

interface AddSongModalProps {
  onClose: () => void;
  onAdd: (song: Omit<Song, 'id'>) => Promise<void>;
}

type Tab = 'itunes' | 'youtube';

const GENRES = ['Pop', 'Rock', 'Electronic', 'Hip-Hop', 'Jazz', 'Reggaeton', 'Salsa', 'Classical'];

interface FormState {
  title: string;
  artist: string;
  album: string;
  duration: string;
  genre: string;
}

const EMPTY: FormState = { title: '', artist: '', album: '', duration: '', genre: '' };

export function AddSongModal({ onClose, onAdd }: AddSongModalProps) {
  const [tab, setTab] = useState<Tab>('itunes');
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [submitting, setSubmitting] = useState(false);

  // iTunes state
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ItunesTrack[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<ItunesTrack | null>(null);
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
  const [playingPreview, setPlayingPreview] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // YouTube state
  const [ytUrl, setYtUrl] = useState('');
  const [ytId, setYtId] = useState<string | null>(null);
  const [ytLoading, setYtLoading] = useState(false);
  const [ytError, setYtError] = useState('');

  // Debounced iTunes search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const tracks = await searchItunes(query);
        setResults(tracks);
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  useEffect(() => { return () => { previewAudio?.pause(); }; }, [previewAudio]);

  // Auto-detect YouTube ID and fetch metadata
  useEffect(() => {
    const id = extractYouTubeId(ytUrl.trim());
    setYtId(id);
    setYtError('');
    if (!id) { if (ytUrl.trim()) setYtError('URL de YouTube no válida'); return; }

    setYtLoading(true);
    fetchYouTubeMeta(id).then((meta) => {
      if (meta) {
        setForm((prev) => ({
          ...prev,
          title: meta.title || prev.title,
          artist: meta.author || prev.artist,
        }));
      }
    }).finally(() => setYtLoading(false));
  }, [ytUrl]);

  const handleSelectTrack = (track: ItunesTrack) => {
    setSelectedTrack(track);
    setForm({
      title: track.trackName,
      artist: track.artistName,
      album: track.collectionName ?? '',
      duration: msToMMSS(track.trackTimeMillis),
      genre: GENRES.find((g) => track.primaryGenreName.toLowerCase().includes(g.toLowerCase())) ?? '',
    });
    setResults([]);
    setQuery('');
    previewAudio?.pause();
    setPlayingPreview(null);
  };

  const togglePreview = (track: ItunesTrack) => {
    if (playingPreview === track.trackId) {
      previewAudio?.pause(); setPlayingPreview(null); return;
    }
    previewAudio?.pause();
    const audio = new Audio(track.previewUrl);
    audio.volume = 0.6;
    audio.play();
    audio.onended = () => setPlayingPreview(null);
    setPreviewAudio(audio);
    setPlayingPreview(track.trackId);
  };

  const validate = (): boolean => {
    const errs: Partial<FormState> = {};
    if (!form.title.trim()) errs.title = 'Requerido';
    if (!form.artist.trim()) errs.artist = 'Requerido';
    if (tab === 'itunes') {
      if (!form.duration.trim()) errs.duration = 'Requerido';
      else if (!/^\d{1,2}:\d{2}$/.test(form.duration)) errs.duration = 'Formato MM:SS';
      if (!form.genre) errs.genre = 'Requerido';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormState]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (tab === 'youtube' && !ytId) { setYtError('Pega un link de YouTube válido'); return; }
    setSubmitting(true);
    previewAudio?.pause();
    try {
      if (tab === 'youtube') {
        await onAdd({
          title: form.title.trim(),
          artist: form.artist.trim(),
          album: form.album.trim() || '',
          duration: form.duration.trim() || '—',
          genre: form.genre || 'Sin género',
          youtubeId: ytId!,
          coverUrl: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
        });
      } else {
        await onAdd({
          title: form.title.trim(),
          artist: form.artist.trim(),
          album: form.album.trim() || '',
          duration: form.duration.trim(),
          genre: form.genre,
          coverUrl: selectedTrack?.artworkUrl100.replace('100x100', '300x300'),
          previewUrl: selectedTrack?.previewUrl,
        });
      }
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

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === 'itunes' ? styles.tabActive : ''}`}
            onClick={() => setTab('itunes')}
            type="button"
          >
            🎵 iTunes
          </button>
          <button
            className={`${styles.tab} ${tab === 'youtube' ? styles.tabActive : ''}`}
            onClick={() => setTab('youtube')}
            type="button"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ color: tab === 'youtube' ? '#ff4444' : 'inherit' }}>
              <path d="M21.8 8s-.2-1.4-.8-2c-.8-.8-1.6-.8-2-.9C16.2 5 12 5 12 5s-4.2 0-7 .1c-.4.1-1.2.1-2 .9-.6.6-.8 2-.8 2S2 9.6 2 11.2v1.5c0 1.6.2 3.2.2 3.2s.2 1.4.8 2c.8.8 1.8.8 2.2.8C6.8 19 12 19 12 19s4.2 0 7-.2c.4-.1 1.2-.1 2-.9.6-.6.8-2 .8-2s.2-1.6.2-3.2v-1.5C22 9.6 21.8 8 21.8 8zM9.7 14.5V9l5.4 2.8-5.4 2.7z"/>
            </svg>
            YouTube
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>

          {tab === 'itunes' ? (
            <>
              {/* iTunes Search */}
              <div className={styles.field}>
                <label className={styles.label} htmlFor="itunes-search">Buscar en iTunes</label>
                <div className={styles.searchWrapper}>
                  <input
                    id="itunes-search"
                    className={styles.input}
                    placeholder="Busca una canción o artista..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoComplete="off"
                  />
                  {searching && <span className={styles.searchSpinner}>⟳</span>}
                </div>
                {results.length > 0 && (
                  <ul className={styles.resultsList} role="listbox">
                    {results.map((track) => (
                      <li key={track.trackId} className={styles.resultItem} role="option" aria-selected={false}>
                        <img src={track.artworkUrl100} alt={track.collectionName} className={styles.resultArt} />
                        <div className={styles.resultInfo} onClick={() => handleSelectTrack(track)}>
                          <span className={styles.resultTitle}>{track.trackName}</span>
                          <span className={styles.resultArtist}>{track.artistName}</span>
                        </div>
                        <button type="button"
                          className={`${styles.previewBtn} ${playingPreview === track.trackId ? styles.previewPlaying : ''}`}
                          onClick={() => togglePreview(track)} title="Preview 30s">
                          {playingPreview === track.trackId ? '⏹' : '▶'}
                        </button>
                        <button type="button" className={styles.selectBtn} onClick={() => handleSelectTrack(track)}>✓</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {selectedTrack && (
                <div className={styles.selectedTrack}>
                  <img src={selectedTrack.artworkUrl100.replace('100x100', '300x300')} alt="" className={styles.selectedArt} />
                  <div className={styles.selectedInfo}>
                    <span className={styles.selectedTitle}>{selectedTrack.trackName}</span>
                    <span className={styles.selectedArtist}>{selectedTrack.artistName}</span>
                    <button type="button"
                      className={`${styles.previewBtn} ${playingPreview === selectedTrack.trackId ? styles.previewPlaying : ''}`}
                      onClick={() => togglePreview(selectedTrack)}>
                      {playingPreview === selectedTrack.trackId ? '⏹ Detener' : '▶ Preview 30s'}
                    </button>
                  </div>
                  <button type="button" className={styles.clearSelected}
                    onClick={() => { setSelectedTrack(null); setForm(EMPTY); previewAudio?.pause(); setPlayingPreview(null); }}>✕</button>
                </div>
              )}

              <div className={styles.divider} />
            </>
          ) : (
            <>
              {/* YouTube URL input */}
              <div className={styles.field}>
                <label className={styles.label} htmlFor="yt-url">
                  Link de YouTube
                </label>
                <div className={styles.searchWrapper}>
                  <input
                    id="yt-url"
                    className={`${styles.input} ${ytError ? styles.inputError : ''}`}
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={ytUrl}
                    onChange={(e) => setYtUrl(e.target.value)}
                    autoComplete="off"
                  />
                  {ytLoading && <span className={styles.searchSpinner}>⟳</span>}
                  {ytId && !ytLoading && <span className={styles.ytCheck}>✓</span>}
                </div>
                {ytError && <span className={styles.errorMsg}>{ytError}</span>}
              </div>

              {/* YouTube thumbnail preview */}
              {ytId && (
                <div className={styles.ytPreview}>
                  <img
                    src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                    alt="thumbnail"
                    className={styles.ytThumb}
                  />
                  <div className={styles.ytInfo}>
                    <span className={styles.ytLabel}>Video detectado</span>
                    <span className={styles.ytId}>{ytId}</span>
                    <span className={styles.ytNote}>🎬 Canción completa — se reproduce en el reproductor</span>
                  </div>
                </div>
              )}

              <div className={styles.divider} />
            </>
          )}

          {/* Common fields */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="title">Título <span className={styles.required}>*</span></label>
            <input id="title" name="title"
              className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
              placeholder="Nombre de la canción" value={form.title} onChange={handleChange} />
            {errors.title && <span className={styles.errorMsg}>{errors.title}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="artist">Artista <span className={styles.required}>*</span></label>
            <input id="artist" name="artist"
              className={`${styles.input} ${errors.artist ? styles.inputError : ''}`}
              placeholder="Nombre del artista" value={form.artist} onChange={handleChange} />
            {errors.artist && <span className={styles.errorMsg}>{errors.artist}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="album">Álbum</label>
            <input id="album" name="album" className={styles.input}
              placeholder="Nombre del álbum (opcional)" value={form.album} onChange={handleChange} />
          </div>

          {tab === 'itunes' && (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div className={styles.field} style={{ flex: 1 }}>
                <label className={styles.label} htmlFor="duration">Duración <span className={styles.required}>*</span></label>
                <input id="duration" name="duration"
                  className={`${styles.input} ${errors.duration ? styles.inputError : ''}`}
                  placeholder="3:45" value={form.duration} onChange={handleChange} />
                {errors.duration && <span className={styles.errorMsg}>{errors.duration}</span>}
              </div>
              <div className={styles.field} style={{ flex: 1 }}>
                <label className={styles.label} htmlFor="genre">Género <span className={styles.required}>*</span></label>
                <select id="genre" name="genre"
                  className={`${styles.select} ${errors.genre ? styles.inputError : ''}`}
                  value={form.genre} onChange={handleChange}>
                  <option value="">Seleccionar</option>
                  {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
                {errors.genre && <span className={styles.errorMsg}>{errors.genre}</span>}
              </div>
            </div>
          )}

          <button type="submit" className={styles.submitBtn} disabled={submitting || (tab === 'youtube' && !ytId)}>
            {submitting ? 'Agregando...' : 'Agregar al playlist'}
          </button>
        </form>
      </div>
    </div>
  );
}
