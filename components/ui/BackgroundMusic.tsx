'use client';

import { useEffect, useRef, useState } from 'react';
import { useZenith } from '@/store/useZenith';

export function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(true);
  const viewMode = useZenith((s) => s.viewMode);
  const phase = useZenith((s) => s.phase);

  useEffect(() => {
    const audio = new Audio('/you - viera.aac');
    audio.loop = true;
    audio.volume = 0.4;
    audioRef.current = audio;

    const startAudio = () => {
      audio.play().then(() => {
        setMuted(false);
        audio.muted = false;
      }).catch(() => {
        // Safe catch for autoplay policy
      });
      cleanupListeners();
    };

    const cleanupListeners = () => {
      window.removeEventListener('click', startAudio);
      window.removeEventListener('keydown', startAudio);
      window.removeEventListener('pointerdown', startAudio);
    };

    window.addEventListener('click', startAudio);
    window.addEventListener('keydown', startAudio);
    window.addEventListener('pointerdown', startAudio);

    return () => {
      audio.pause();
      cleanupListeners();
    };
  }, []);

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      audio.play().then(() => {
        audio.muted = false;
        setMuted(false);
      });
    } else {
      audio.muted = !audio.muted;
      setMuted(audio.muted);
    }
  };

  if (viewMode === 'freeview') return null;

  const isSky = phase === 'sky';
  const containerClass = isSky
    ? "absolute top-4 left-[calc(50%+130px)] sm:left-[calc(50%+205px)] z-50 pointer-events-auto sm:top-6 transition-all duration-300"
    : "fixed left-4 top-4 z-50 pointer-events-auto sm:left-6 sm:top-6 transition-all duration-300";

  return (
    <div className={containerClass}>
      <button
        onClick={toggleMute}
        className="font-doto text-[16px] tracking-[0.16em] text-white/60 hover:text-white border border-white/35 hover:border-white px-5 py-2.5 transition-all duration-300 uppercase outline-none select-none"
        style={{ borderRadius: 6 }}
        title={muted ? 'Turn music on' : 'Turn music off'}
      >
        {muted ? 'MUSIC OFF' : 'MUSIC ON'}
      </button>
    </div>
  );
}
