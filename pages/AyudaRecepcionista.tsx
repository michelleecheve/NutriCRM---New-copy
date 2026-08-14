import React from 'react';
import { Sparkles, LifeBuoy, Compass } from 'lucide-react';

// Página de ayuda para el rol recepcionista. A diferencia de la versión de la
// nutricionista (pages/Ayuda.tsx), aquí no existe el interruptor para ocultar
// las guías ni el recorrido guiado por capítulos (pensado para el flujo de
// paciente, al que la recepcionista no tiene acceso) — el botón "Guía de esta
// página" siempre está activo.
export const AyudaRecepcionista: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8 text-white shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-6 h-6" />
          <h2 className="text-2xl font-bold">¡Nos alegra tenerte aquí!</h2>
        </div>
        <p className="text-emerald-50">
          Esta es tu página de ayuda. Aquí encuentras cómo aprovechar las guías de cada página, el recorrido guiado paso a paso, y cómo contactarnos si algo no sale como esperas.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Compass className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-slate-800">Guías de cada página</h3>
        </div>

        <div className="flex items-center justify-between gap-4 bg-slate-50 rounded-xl px-4 py-3">
          <p className="text-sm text-slate-600">
            En cada página encontrarás un botón <span className="font-bold text-slate-800">"Guía de esta página"</span> para conocer sus elementos y funciones.
          </p>
          <span className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1.5">
            Siempre disponible
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Búscalo en la parte superior de cada página cuando necesites ayuda.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <LifeBuoy className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-slate-800">Soporte</h3>
        </div>
        <p className="text-sm text-slate-600">
          ¿Tienes dudas o quieres reportar un problema? Contáctanos a{' '}
          <a href="mailto:nutrifollow.app@outlook.com" className="font-bold text-emerald-700 hover:text-emerald-800">
            nutrifollow.app@outlook.com
          </a>
          {' '}y con gusto te ayudamos.
        </p>
        <p className="text-sm text-slate-400">
          Tip: estamos trabajando de forma continua para hacer de NutriFollow una plataforma cada vez más rápida y fácil de usar. Si en algún momento notas información o alguna función que no carga correctamente, te recomendamos recargar la página, ya que en la mayoría de los casos esto resuelve el inconveniente. Asegúrate también de contar con una buena conexión a internet, y si sientes la plataforma lenta, borrar la caché de tu navegador suele ayudar. Si el problema persiste, no dudes en reportarlo para que podamos solucionarlo lo antes posible.
        </p>
      </div>
    </div>
  );
};
