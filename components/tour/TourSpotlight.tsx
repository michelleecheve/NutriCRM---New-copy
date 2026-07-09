import React from 'react';

interface TourSpotlightProps {
  rect: DOMRect | null;
}

// Resalta un elemento real de la UI con un halo + backdrop atenuado alrededor.
// No bloquea pointer-events: el usuario puede seguir interactuando con el elemento
// resaltado y el resto de la página (varios pasos requieren llenar varios campos
// antes de guardar, no solo un clic único).
export const TourSpotlight: React.FC<TourSpotlightProps> = ({ rect }) => {
  if (!rect) return null;
  const pad = 6;

  return (
    <div
      style={{
        position: 'fixed',
        top: rect.top - pad,
        left: rect.left - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
        borderRadius: 12,
        boxShadow: '0 0 0 9999px rgba(15,23,42,0.45), 0 0 0 2px #10b981',
        pointerEvents: 'none',
        zIndex: 9998,
        transition: 'top 0.2s ease, left 0.2s ease, width 0.2s ease, height 0.2s ease',
      }}
    />
  );
};
