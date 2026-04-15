import { useState, useEffect } from 'react';
import styles from './DJModePanel.module.css';
import { usePlayerContext } from '../../context/PlayerContext';
import { djMixEngine, MixEffect, DEFAULT_MIX_OPTIONS } from '../../services/dj-mix.service';
import { playlistService } from '../../services/playlist.service';

const EFFECTS: { id: MixEffect; label: string; icon: string; desc: string }[] = [
  { id: 'crossfade',    label: 'Crossfade',     icon: '⇌', desc: 'Mezcla suave entre canciones' },
  { id: 'filter-sweep', label: 'Filter Sweep',  icon: '〜', desc: 'Barrido de filtro estilo club' },
  { id: 'echo-drop',    label: 'Echo Drop',     icon: '💥', desc: 'Eco + silencio + entrada explosiva' },
  { id: 'cut',          label: 'Hard Cut',      icon: '✂', desc: 'Corte directo sin transición' },
];

export function DJModePanel() {
  const {
    isDJMode, setIsDJMode,
    isPlaying, setIsPlaying,
    currentSong, setCurrentSong,
    songs, addToast,
  } = usePlayerContext();

  const [effect, setEffect] = useState<MixEffect>(DEFAULT_MIX_OPTIONS.effect);
  const [crossfadeDur, setCrossfadeDur] = useState(DEFAULT_MIX_OPTIONS.crossfadeDuration);
  const [isMixing, setIsMixing] = useState(false);
  const [crossfaderPos, setCrossfaderPos] = useState(50); // 0=A, 100=B

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
    setIsDJMode(!isDJMode);
    if (!isDJMode) {
      addToast('🎛️ Modo DJ activado — ¡a mezclar!', 'success');
    } else {
      addToast('Modo DJ desactivado', 'info');
    }
  };

  const handleMixNow = () => {
    if (!currentSong || isMixing) return;
    const next = playlistService.navigateNext();
    if (!next) { addToast('No hay siguiente canción', 'error'); return; }
    setIsMixing(true);
    addToast(`🎛️ Mezclando → ${next.title}`, 'info');

    djMixEngine.init();
    djMixEngine.resume().then(() => {
      djMixEngine.crossfadeTo(next.previewUrl ?? '', (newAudio) => {
        setCurrentSong(next);
        setIsPlaying(true);
        newAudio.onended = () => {
          const n2 = playlistService.navigateNext();
          if (n2) { setCurrentSong(n2); setIsPlaying(true); }
          else setIsPlaying(false);
        };
        setIsMixing(false);
      });
    });
  };

  // Crossfader visual (cosmetic — shows A/B balance)
  const handleCrossfader = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCrossfaderPos(Number(e.target.value));
  };

  const nextSong = (() => {
    if (!songs.length || !currentSong) return null;
    const idx = songs.findIndex((s) => s.id === currentSong.id);
    return songs[(idx + 1) % songs.length] ?? null;
  })();

  return (
    <div className={`${styles.panel} ${isDJMode ? styles.active : ''}`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.djIcon}>🎛️</span>
          <span className={styles.title}>Modo DJ</span>
          {isDJMode && isMixing && (
            <span className={styles.mixingBadge}>MEZCLANDO</span>
          )}
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
          {/* Decks display */}
          <div className={styles.decks}>
            <div className={`${styles.deck} ${styles.deckA}`}>
              <span className={styles.deckLabel}>DECK A</span>
              <div className={styles.deckArt}>
                {currentSong?.coverUrl
                  ? <img src={currentSong.coverUrl} alt="" />
                  : <span>🎵</span>}
              </div>
              <span className={styles.deckTitle}>{currentSong?.title ?? '—'}</span>
              <span className={styles.deckArtist}>{currentSong?.artist ?? ''}</span>
            </div>

            {/* Crossfader */}
            <div className={styles.crossfaderSection}>
              <div className={styles.crossfaderLabels}>
                <span>A</span><span>B</span>
              </div>
              <input
                type="range"
                min={0} max={100}
                value={crossfaderPos}
                onChange={handleCrossfader}
                className={styles.crossfader}
                aria-label="Crossfader"
              />
              <button
                className={`${styles.mixNowBtn} ${isMixing ? styles.mixing : ''}`}
                onClick={handleMixNow}
                disabled={isMixing || !isPlaying || !nextSong}
                title="Mezclar ahora"
              >
                {isMixing ? (
                  <span className={styles.mixSpinner} />
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M10.59 9.17 5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
                    </svg>
                    MIX
                  </>
                )}
              </button>
            </div>

            <div className={`${styles.deck} ${styles.deckB}`}>
              <span className={styles.deckLabel}>DECK B</span>
              <div className={styles.deckArt}>
                {nextSong?.coverUrl
                  ? <img src={nextSong.coverUrl} alt="" />
                  : <span>🎵</span>}
              </div>
              <span className={styles.deckTitle}>{nextSong?.title ?? '—'}</span>
              <span className={styles.deckArtist}>{nextSong?.artist ?? ''}</span>
            </div>
          </div>

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

          {/* Crossfade duration */}
          {effect !== 'cut' && (
            <div className={styles.durationSection}>
              <span className={styles.sectionLabel}>DURACIÓN DEL MIX</span>
              <div className={styles.durationRow}>
                <input
                  type="range"
                  min={2} max={10} step={0.5}
                  value={crossfadeDur}
                  onChange={(e) => setCrossfadeDur(Number(e.target.value))}
                  className={styles.durationSlider}
                  aria-label="Duración del crossfade"
                />
                <span className={styles.durationValue}>{crossfadeDur}s</span>
              </div>
            </div>
          )}

          {/* Auto-mix hint */}
          <p className={styles.hint}>
            🎉 El DJ mezclará automáticamente al terminar cada canción
          </p>
        </div>
      )}
    </div>
  );
}
