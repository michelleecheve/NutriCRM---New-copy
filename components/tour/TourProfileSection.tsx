import React, { useEffect, useState } from 'react';
import { Compass, CheckCircle2, SkipForward, PlayCircle, RotateCcw, Circle } from 'lucide-react';
import { tourService } from '../../services/tourService';
import { CHAPTER_TITLES } from '../../services/tourSteps';
import { isPageGuidesEnabled, setPageGuidesEnabled } from '../../services/pageGuidePrefs';

const STATUS_LABEL: Record<string, string> = {
  completed: 'Completado',
  in_progress: 'En progreso',
  skipped: 'Omitido',
  not_started: 'No iniciado',
};

const STATUS_STYLE: Record<string, string> = {
  completed: 'text-emerald-700 bg-emerald-50',
  in_progress: 'text-amber-700 bg-amber-50',
  skipped: 'text-slate-500 bg-slate-100',
  not_started: 'text-slate-400 bg-slate-50',
};

// Bloque autocontenido para la página de Ayuda: no depende de ni modifica
// ningún formulario ni botón de guardado de otra página.
export const TourProfileSection: React.FC = () => {
  const [, setVersion] = useState(0);
  const [pageGuidesOn, setPageGuidesOn] = useState(() => isPageGuidesEnabled());

  useEffect(() => tourService.subscribe(() => setVersion(v => v + 1)), []);

  const handleChapterAction = (chapterId: number) => {
    const status = tourService.getChapterStatus(chapterId);
    if (status === 'completed' || status === 'skipped') {
      tourService.resetChapter(chapterId);
    } else {
      tourService.resumeChapter(chapterId);
    }
  };

  const handleTogglePageGuides = () => {
    const next = !pageGuidesOn;
    setPageGuidesOn(next);
    setPageGuidesEnabled(next);
  };

  return (
    <div className="space-y-10">
      {/* Guías por página */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Compass className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-slate-800">Guías de cada página</h3>
        </div>

        <div className="flex items-center justify-between gap-4 bg-slate-50 rounded-xl px-4 py-3">
          <p className="text-sm text-slate-600">
            En cada página encontrarás un botón <span className="font-bold text-slate-800">"Guía de esta página"</span> para conocer sus elementos y funciones.
          </p>
          <button
            type="button"
            role="switch"
            aria-checked={pageGuidesOn}
            onClick={handleTogglePageGuides}
            className={`shrink-0 relative w-11 h-6 rounded-full transition-colors ${pageGuidesOn ? 'bg-emerald-600' : 'bg-slate-300'}`}
            title={pageGuidesOn ? 'Ocultar botones de guía' : 'Mostrar botones de guía'}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${pageGuidesOn ? 'translate-x-5' : 'translate-x-0'}`}
            />
          </button>
        </div>
        <p className="text-xs text-slate-400">
          {pageGuidesOn ? 'Los botones de guía están activos en todas las páginas.' : 'Los botones de guía están ocultos en todas las páginas.'}
        </p>
      </div>

      {/* Recorrido guiado por capítulos */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Compass className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-slate-800">Recorrido guiado paso a paso</h3>
        </div>
        <p className="text-sm text-slate-600">
          Te lleva a crear un paciente de prueba de principio a fin, para que conozcas el sistema haciendo. Retómalo por capítulos o reinícialo si quieres repasar algún tema.
        </p>

        {tourService.getDemoPatientId() && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            Paciente de prueba creado: <span className="font-bold">{tourService.getDemoPatientName()}</span>
          </p>
        )}

        <div className="space-y-2">
          {Array.from({ length: tourService.totalChapters }, (_, i) => i + 1).map(chapterId => {
            const status = tourService.getChapterStatus(chapterId);
            const Icon = status === 'completed' ? CheckCircle2 : status === 'skipped' ? SkipForward : status === 'in_progress' ? PlayCircle : Circle;
            return (
              <div key={chapterId} className="flex items-center justify-between gap-3 bg-slate-50 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${status === 'completed' ? 'text-emerald-600' : status === 'in_progress' ? 'text-amber-600' : 'text-slate-400'}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">Capítulo {chapterId}: {CHAPTER_TITLES[chapterId]}</p>
                    <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${STATUS_STYLE[status]}`}>
                      {STATUS_LABEL[status]}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleChapterAction(chapterId)}
                  className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
                >
                  {status === 'completed' || status === 'skipped' ? (
                    <><RotateCcw className="w-3.5 h-3.5" /> Reiniciar</>
                  ) : (
                    <><PlayCircle className="w-3.5 h-3.5" /> {status === 'in_progress' ? 'Reanudar' : 'Comenzar'}</>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => tourService.resetAll()}
          className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
        >
          Reiniciar todo el recorrido
        </button>
      </div>
    </div>
  );
};
