import { useState, useEffect, useCallback } from 'react';
import styles from './DJModePanel.module.css';
import { usePlayerContext } from '../../context/PlayerContext';
import { djMixEngine, MixEffect, DEFAULT_MIX_OPTIONS } from '../../services/dj-mix.service';
import { playlistService } from '../../services/playlist.service';
import { Song } from '../../types';

const EFFECTS: { id: MixEffect; label: string; icon: string; desc: string }[] = [
  { id: 'crossfade',    label: 'Crossfade',     icon: '⇌', desc: 'Mezcla suave' },
  { id: 'filter-sweep', label: 'Filter Sweep',  icon: '〜', desc: 'Barrido de filtro' },
  { id: 'echo-drop',    label: 'Echo Drop',     icon: '💥', desc: 'Eco + drop' },
  { id: 'cut',          label: 'Hard Cut',      icon: '✂',  desc: 'Corte directo' },
];

interface DJModePanelProps {
  djSelected: Set<string>;
  onDJToggle: (id: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}

export function DJModePanel({ djSelected, onSelectAll, onClearAll }: DJModePanelProps) {
  const {
    isDJMode, setIsDJMode,
    isPlaying, setIsPlaying,
    currentSong, setCurrentSong,
    songs, addToast,
  } = usePlayerContext();

  const [effect, setEffect] = useState<MixEffect>(DEFAULT_MIX_OPTIONS.effect);
  const [crossfadeDur, setCrossfadeDur] = useState(DEFAULT_MIX_OPTIONS.crossfadeDuration);
  const [isMixing, setIsMixing] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionQueue, setSessionQueue] = useState<Song[]>([]);
  const [sessionIndex, setSessionIndex] = useState(0);
  const [sessionName, setSessionName] = useState('');

  // Sync options to engine
  useEffect(() => {
    djMixEngine.setOptions({ effect, crossfadeDuration: crossfadeDur });
  }, [effect, crossfadeDur]);

  // Poll mixing state
  useEffect(() => {
    if (!isDJMode) return;
    const id = setInterval(() => setIsMixing(djMixEngine.mixing), 200);
    return () => clearInterval(id);
  }, [isDJMode]);

  const handleToggleDJ = () => {
    if (!isDJMode && songs.length < 2) {
      addToast('Necesitas al menos 2 canciones para el modo DJ', 'error');
      return;
    }
    if (isDJMode && sessionActive) stopSession();
    setIsDJMode(!isDJMode);
    if (!isDJMode) addToast('🎛️ Modo DJ — selecciona canciones para mezclar', 'success');
    else addToast('Modo DJ desactivado', 'info');
  };

  // Build session queue from selected songs (in playlist order)
  const buildQueue = useCallback((): Song[] => {
    if (djSelected.size === 0) return songs; // use all if none selected
    return songs.filter((s) => djSelected.has(s.id));
  }, [songs, djSelected]);

  // Play next song in session with crossfade
  const playNextInSession = useCallback((queue: Song[], idx: number) => {
    const song = queue[idx];
    if (!song) { stopSession(); return; }

    setCurrentSong(song);
    setIsPlaying(true);
    setSessionIndex(idx);

    // If no previewUrl (YouTube), just navigate — no crossfade
    if (!song.previewUrl) {
      playlistService.setCurrentById(song.id);
      return;
    }

    // Load into DJ engine
    djMixEngine.init();
    djMixEngine.resume().then(() => {
      if (idx === 0) {
        // First song: load directly
        const audio = djMixEngine.loadDeckA(song.previewUrl!);
        audio.play().catch(() => {});
        audio.onended = () => {
          if (idx + 1 < queue.length) {
            setIsMixing(true);
            addToast(`🎛️ Mezclando → ${queue[idx + 1].title}`, 'info');
            djMixEngine.crossfadeTo(queue[idx + 1].previewUrl ?? '', () => {
              setIsMixing(false);
              playNextInSession(queue, idx + 1);
            });
          } else {
            stopSession();
          }
        };
      } else {
        // Subsequent songs: crossfade handled by previous onended
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setCurrentSong, setIsPlaying, addToast]);

  const startSession = () => {
    const queue = buildQueue();
    if (queue.length < 1) { addToast('Selecciona al menos 1 canción', 'error'); return; }

    const name = `Mix ${new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}`;
    setSessionName(name);
    setSessionQueue(queue);
    setSessionActive(true);
    setSessionIndex(0);

    addToast(`🎉 Sesión "${name}" iniciada — ${queue.length} canciones`, 'success');
    playNextInSession(queue, 0);
  };

  const stopSession = useCallback(() => {
    setSessionActive(false);
    setSessionQueue([]);
    setSessionIndex(0);
    setIsMixing(false);
    setIsPlaying(false);
    djMixEngine.destroy();
    addToast('Sesión DJ terminada', 'info');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setIsPlaying, addToast]);

  const skipToNext = () => {
    if (!sessionActive || sessionIndex + 1 >= sessionQueue.length) return;
    const nextIdx = sessionIndex + 1;
    const next = sessionQueue[nextIdx];
    if (!next) return;
    addToast(`⏭ Saltando → ${next.title}`, 'info');
    if (next.previewUrl) {
      setIsMixing(true);
      djMixEngine.crossfadeTo(next.previewUrl, () => {
        setIsMixing(false);
        playNextInSession(sessionQueue, nextIdx);
      });
    } else {
      playNextInSession(sessionQueue, nextIdx);
    }
  };

  const selectedSongs = buildQueue();
  const nextSong = sessionActive
    ? sessionQueue[sessionIndex + 1] ?? null
    : selectedSongs[1] ?? null;
  const currentInSession = sessionActive ? sessionQueue[sessionIndex] : currentSong;

  return (
    <div className={`${styles.panel} ${isDJMode ? styles.active : ''}`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.djIcon}>🎛️</span>
          <span className={styles.title}>Modo DJ</span>
          {isDJMode && isMixing && <span className={styles.mixingBadge}>MEZCLANDO</span>}
          {isDJMode && sessionActive && !isMixing && <span className={styles.liveBadge}>● LIVE</span>}
        </div>
        <button
          className={`${styles.toggleBtn} ${isDJMode ? styles.toggleOn : ''}`}
          onClick={handleToggleDJ}
          aria-label={isDJMode ? 'Desactivar modo DJ' : 'Activar modo DJ'}
        >
          <span className={styles.toggleKnob} />
        </button>
      </div>

      {isDJMode && (
        <div className={styles.body}>

          {/* Selection controls */}
          <div className={styles.selectionRow}>
            <span className={styles.sectionLabel}>
              {djSelected.size === 0
                ? 'Selecciona canciones en la lista →'
                : `${djSelected.size} canción${djSelected.size !== 1 ? 'es' : ''} seleccionada${djSelected.size !== 1 ? 's' : ''}`}
            </span>
            <div className={styles.selectionBtns}>
              <button className={styles.selBtn} onClick={onSelectAll} title="Seleccionar todas">Todas</button>
              <button className={styles.selBtn} onClick={onClearAll} title="Limpiar selección">Limpiar</button>
            </div>
          </div>

          {/* Decks */}
          <div className={styles.decks}>
            <div className={`${styles.deck} ${styles.deckA}`}>
              <span className={styles.deckLabel}>DECK A</span>
              <div className={`${styles.deckArt} ${sessionActive && isPlaying ? styles.deckSpinning : ''}`}>
                {currentInSession?.coverUrl
                  ? <img src={currentInSession.coverUrl} alt="" />
                  : <span>🎵</span>}
              </div>
              <span className={styles.deckTitle}>{currentInSession?.title ?? '—'}</span>
              <span className={styles.deckArtist}>{currentInSession?.artist ?? ''}</span>
            </div>

            {/* Center controls */}
            <div className={styles.centerControls}>
              <div className={styles.crossfaderLabels}><span>A</span><span>B</span></div>
              <div className={styles.crossfaderTrack}>
                <div
                  className={styles.crossfaderFill}
                  style={{ width: isMixing ? '50%' : sessionActive ? '0%' : '0%' }}
                />
              </div>
              {sessionActive ? (
                <div className={styles.sessionBtns}>
                  <button
                    className={`${styles.skipBtn} ${isMixing ? styles.skipDisabled : ''}`}
                    onClick={skipToNext}
                    disabled={isMixing || sessionIndex + 1 >= sessionQueue.length}
                    title="Saltar a siguiente"
                  >
                    {isMixing ? <span className={styles.mixSpinner} /> : '⏭'}
                  </button>
                  <button className={styles.stopBtn} onClick={stopSession} title="Detener sesión">■</button>
                </div>
              ) : (
                <button
                  className={styles.startBtn}
                  onClick={startSession}
                  disabled={!isPlaying && selectedSongs.length === 0}
                  title="Iniciar sesión DJ"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  START
                </button>
              )}
              {sessionActive && (
                <span className={styles.sessionProgress}>
                  {sessionIndex + 1}/{sessionQueue.length}
                </span>
              )}
            </div>

            <div className={`${styles.deck} ${styles.deckB}`}>
              <span className={styles.deckLabel}>DECK B</span>
              <div className={styles.deckArt}>
                {nextSong?.coverUrl
                  ? <img src={nextSong.coverUrl} alt="" />
                  : <span>{nextSong ? '🎵' : '—'}</span>}
              </div>
              <span className={styles.deckTitle}>{nextSong?.title ?? '—'}</span>
              <span className={styles.deckArtist}>{nextSong?.artist ?? ''}</span>
            </div>
          </div>

          {/* Session name */}
          {sessionActive && (
            <div className={styles.sessionInfo}>
              <span className={styles.sessionIcon}>🎉</span>
              <span className={styles.sessionName}>{sessionName}</span>
              <span className={styles.sessionSongs}>{sessionQueue.length} canciones</span>
            </div>
          )}

          {/* Effect selector */}
          <div className={styles.effectSection}>
            <span className={styles.sectionLabel}>EFECTO DE TRANSICIÓN</span>
            <div className={styles.effectGrid}>
              {EFFECTS.map((fx) => (
                <button
                  key={fx.id}
                  className={`${styles.effectBtn} ${effect === fx.id ? styles.effectActive : ''}`}
                  onClick={() => setEffect(fx.id)}
                  title={fx.desc}
                >
                  <span className={styles.effectIcon}>{fx.icon}</span>
                  <span className={styles.effectLabel}>{fx.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          {effect !== 'cut' && (
            <div className={styles.durationSection}>
              <span className={styles.sectionLabel}>DURACIÓN DEL MIX</span>
              <div className={styles.durationRow}>
                <input
                  type="range" min={2} max={10} step={0.5}
                  value={crossfadeDur}
                  onChange={(e) => setCrossfadeDur(Number(e.target.value))}
                  className={styles.durationSlider}
                />
                <span className={styles.durationValue}>{crossfadeDur}s</span>
              </div>
            </div>
          )}

          {!sessionActive && (
            <p className={styles.hint}>
              {djSelected.size === 0
                ? '💡 Selecciona canciones en la lista o usa "Todas" para mezclar el playlist completo'
                : `🎉 Presiona START para iniciar la sesión con ${selectedSongs.length} canciones`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
