'use client';

export function GuideCard() {
  return (
    <div className="absolute right-4 top-4 z-20 w-[300px] max-w-[calc(100vw-2rem)] border border-zinc-700 bg-[#1a1a1a]/95 p-5 shadow-[0_0_20px_rgba(255,255,255,0.06),0_6px_30px_rgba(0,0,0,0.8)] sm:right-6 sm:top-6" style={{ borderRadius: 6 }}>
      <div className="label text-[var(--interactive)] font-bold tracking-[0.16em] uppercase">Orbit Exploration Guide</div>
      <div className="mt-2 font-sans text-md font-medium text-white">How to travel to the sky:</div>

      <ol className="mt-4 space-y-3.5 font-mono text-[12px] text-[var(--text-secondary)]">
        <li className="flex gap-3">
          <span className="text-[var(--interactive)] font-bold">01.</span>
          <div>
            <strong className="text-white">Choose Mode:</strong> Toggle between <span className="text-[var(--interactive)]">SINGLE POINT</span> and <span className="text-[var(--interactive)]">COMPARE</span> mode on the top left.
          </div>
        </li>
        <li className="flex gap-3">
          <span className="text-[var(--interactive)] font-bold">02.</span>
          <div>
            <strong className="text-white">Select Location(s):</strong> Click on the globe, search a city, or click <span className="text-[var(--interactive)]">◎ Use My Location</span>. In Compare Mode, you will select and confirm Location A first, then Location B.
          </div>
        </li>
        <li className="flex gap-3">
          <span className="text-[var(--interactive)] font-bold">03.</span>
          <div>
            <strong className="text-white">Launch to Sky:</strong> Once confirmed, experience a real-time side-by-side split screen view of both zeniths (Compare Mode) or a full view (Single Mode).
          </div>
        </li>
      </ol>
    </div>
  );
}
