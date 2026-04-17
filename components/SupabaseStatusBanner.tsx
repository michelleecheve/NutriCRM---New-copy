import React, { useState } from "react";
import { X, AlertTriangle } from "lucide-react";

// ── Banner de avisos del servidor ──────────────────────────────────────────
// Para activar:   cambia ACTIVE a true y escribe el mensaje en MESSAGE
// Para desactivar: cambia ACTIVE a false
const ACTIVE = true;
const MESSAGE =
  "Estamos experimentando lentitud en el servidor DNS de redes wifi locales. Utiliza tu internet móvil para evitar el problema de hoy, se resolverá pronto";
// ──────────────────────────────────────────────────────────────────────────

export function SupabaseStatusBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (!ACTIVE || dismissed) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-yellow-400 text-yellow-900 shadow-md">
      <div className="flex items-start gap-3 px-4 py-2.5 max-w-screen-xl mx-auto">
        <span className="flex-shrink-0 mt-0.5">
          <AlertTriangle size={16} />
        </span>
        <p className="flex-1 text-sm font-medium leading-snug">{MESSAGE}</p>
        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 p-1 rounded hover:bg-yellow-500 transition-colors"
          aria-label="Cerrar aviso"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
