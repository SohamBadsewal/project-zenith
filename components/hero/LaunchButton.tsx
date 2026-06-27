'use client';

import { useRef } from 'react';
import { useZenith } from '@/store/useZenith';
import { audio } from './audio';
import { RocketSvg } from './RocketSvg';
import styles from './LaunchButton.module.css';

/**
 * The launch CTA — kennyotsu's "witty-bullfrog-54" button (uiverse.io). On hover the
 * platform tilts into an isometric pad and the small rocket lifts off it. On click we
 * measure the rocket's on-screen rect and hand it to the store, so the full 3D shuttle
 * magnifies out of exactly where the little rocket was.
 */
export function LaunchButton() {
  const launch = useZenith((s) => s.launch);
  const beginLaunch = useZenith((s) => s.beginLaunch);
  const rocketRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const onLaunch = () => {
    if (useZenith.getState().launch !== 'idle') return;
    audio.resume();
    const rect =
      rocketRef.current?.getBoundingClientRect() ??
      containerRef.current?.getBoundingClientRect();
    if (rect) beginLaunch(rect);
  };

  const hidden = launch !== 'idle';

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${styles.noselect} ${hidden ? styles.hidden : ''}`}
    >
      {/* Sibling-before-button so the `~ .button` hover combinators fire; also the click target. */}
      <button
        type="button"
        className={styles.clickHandler}
        onClick={onLaunch}
        aria-label="Launch to orbit"
      />
      <div className={styles.button} aria-hidden>
        <p className={styles.toLaunch}>let&apos;s launch!</p>
        <div className={styles.platform} />
        <div className={styles.caution}>
          <div className={styles.cautionLeft}>LAUNCH ZONE</div>
          <div className={styles.cautionRight}>LAUNCH ZONE</div>
        </div>
      </div>
      <p className={styles.toHover} aria-hidden>
        Start exploration
      </p>
      <div className={styles.shuttleWrapper} aria-hidden>
        <div className={styles.shadow} />
        <RocketSvg ref={rocketRef} className={styles.b} />
      </div>
    </div>
  );
}
