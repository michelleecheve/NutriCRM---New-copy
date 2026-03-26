import React, { useRef } from 'react';

export function Landing() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleLoad = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    try {
      const doc = iframe.contentDocument;
      if (!doc) return;
      // Inject <base target="_top"> so all links navigate the top-level page
      const existing = doc.querySelector('base');
      if (!existing) {
        const base = doc.createElement('base');
        base.target = '_top';
        doc.head.prepend(base);
      } else {
        existing.target = '_top';
      }
    } catch {
      // cross-origin guard (no-op in same-origin)
    }
  };

  return (
    <iframe
      ref={iframeRef}
      src="/landing.html"
      onLoad={handleLoad}
      style={{ width: '100%', height: '100vh', border: 'none', display: 'block' }}
      title="NutriFollow"
    />
  );
}
