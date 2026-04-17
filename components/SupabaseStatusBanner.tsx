import React, { useState, useEffect } from "react";
import { X, WifiOff, AlertTriangle } from "lucide-react";
import { supabaseHealthService } from "../services/supabaseHealthService";

export function SupabaseStatusBanner() {
  const [status, setStatus] = useState(supabaseHealthService.getStatus());
  const [dismissed, setDismissed] = useState(
    supabaseHealthService.isDismissed(),
  );

  useEffect(() => {
    return supabaseHealthService.subscribe((s, d) => {
      setStatus(s);
      setDismissed(d);
    });
  }, []);

  if (status === "ok" || dismissed) return null;

  const noInternet = status === "no-internet";

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-yellow-400 text-yellow-900 shadow-md">
      <div className="flex items-start gap-3 px-4 py-2.5 max-w-screen-xl mx-auto">
        <span className="flex-shrink-0 mt-0.5">
          {noInternet ? <WifiOff size={16} /> : <AlertTriangle size={16} />}
        </span>
        <p className="flex-1 text-sm font-medium leading-snug">
          {noInternet
            ? "Parece que no tienes conexión a internet. Verifica tu red e intenta de nuevo."
            : "Estamos experimentando lentitud en el servidor DNS de redes wifi locales. Utiliza tu internet móvil para evitar el problema de hoy, se resolverá en un par de horas."}
        </p>
        <button
          onClick={() => supabaseHealthService.dismiss()}
          className="flex-shrink-0 p-1 rounded hover:bg-yellow-500 transition-colors"
          aria-label="Cerrar aviso"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
