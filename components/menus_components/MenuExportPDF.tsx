import React, { useState, useRef, useEffect } from 'react';
import { Printer, Loader2, ChevronDown, FileText, Files } from 'lucide-react';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface MenuExportPDFProps {
  elementId: string;
  filename: string;
  className?: string;
  disabled?: boolean;
  label?: string;
  children?: React.ReactNode;
  hideIconOnMobile?: boolean;
}

const PAGE_LABELS: Record<string, string> = {
  'menu-page-1': 'Menú principal',
  'menu-page-2': 'Menú pág. 2',
  'recommendations-page': 'Recomendaciones',
  'portions-recs-page': 'Porciones y recomendaciones',
  'portions-page': 'Porciones',
};

const KNOWN_IDS = ['menu-page-1', 'menu-page-2', 'recommendations-page', 'portions-recs-page', 'portions-page'];

const BASE_OPT = {
  margin: 0,
  image: { type: 'jpeg' as const, quality: 0.95 },
  html2canvas: {
    scale: 3,
    useCORS: true,
    logging: false,
    letterRendering: true,
    windowWidth: 1200,
  },
  jsPDF: {
    unit: 'mm' as const,
    format: 'a4' as const,
    orientation: 'portrait' as const,
    compress: true,
  },
};

function detectPages(elementId: string): HTMLElement[] {
  const wrapper = document.getElementById(elementId);
  if (!wrapper) return [];

  const pages: HTMLElement[] = [];

  KNOWN_IDS.forEach(pid => {
    const el = wrapper.querySelector(`#${pid}`) as HTMLElement;
    if (el) pages.push(el);
  });

  if (pages.length === 0) {
    const container = wrapper.querySelector('.menu-template-container') || wrapper;
    (Array.from(container.children) as HTMLElement[]).forEach(child => {
      const h = child.style?.height;
      if (h === '297mm' || child.id) pages.push(child);
    });
  }

  if (pages.length === 0) pages.push(wrapper);

  return pages;
}

async function exportPages(pages: HTMLElement[], filename: string) {
  const safeName = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

  let worker = html2pdf().set(BASE_OPT).from(pages[0]).toPdf();

  for (let i = 1; i < pages.length; i++) {
    worker = worker
      .get('pdf')
      .then((pdf: any) => { pdf.addPage(); })
      .from(pages[i])
      .toContainer()
      .toCanvas()
      .toPdf();
  }

  await worker.get('pdf').then((pdf: any) => {
    const blob = pdf.output('bloburl');
    window.open(blob, '_blank');
  });
}

export const MenuExportPDF: React.FC<MenuExportPDFProps> = ({
  elementId,
  filename,
  className = "",
  disabled = false,
  label = "Exportar PDF",
  children,
  hideIconOnMobile = false,
}) => {
  const [exporting, setExporting] = useState(false);
  const [open, setOpen] = useState(false);
  const [detectedPages, setDetectedPages] = useState<HTMLElement[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleButtonClick = () => {
    if (exporting || disabled) return;
    const pages = detectPages(elementId);
    setDetectedPages(pages);
    setOpen(prev => !prev);
  };

  const runExport = async (pages: HTMLElement[]) => {
    setOpen(false);
    setExporting(true);
    try {
      await exportPages(pages, filename);
    } catch (err) {
      console.error('Error exporting PDF:', err);
    } finally {
      setExporting(false);
    }
  };

  const getPageLabel = (el: HTMLElement, index: number): string => {
    if (el.id && PAGE_LABELS[el.id]) return PAGE_LABELS[el.id];
    return `Hoja ${index + 1}`;
  };

  // If children prop is provided, keep simple single-click behavior
  if (children) {
    return (
      <button
        onClick={async () => {
          if (exporting || disabled) return;
          const pages = detectPages(elementId);
          setExporting(true);
          try { await exportPages(pages, filename); }
          catch (err) { console.error('Error exporting PDF:', err); }
          finally { setExporting(false); }
        }}
        disabled={disabled || exporting}
        className={className}
      >
        {exporting ? <><Loader2 className="w-5 h-5 animate-spin" />Exportando...</> : children}
      </button>
    );
  }

  return (
    <div ref={dropdownRef} className="relative inline-block">
      <button
        onClick={handleButtonClick}
        disabled={disabled || exporting}
        className={className}
      >
        {exporting ? (
          <>
            <Loader2 className={`w-5 h-5 animate-spin${hideIconOnMobile ? ' hidden md:inline' : ''}`} />
            Exportando...
          </>
        ) : (
          <>
            <Printer className={`w-5 h-5${hideIconOnMobile ? ' hidden md:inline' : ''}`} />
            {label}
            <ChevronDown className={`w-4 h-4 transition-transform${open ? ' rotate-180' : ''}`} />
          </>
        )}
      </button>

      {open && !exporting && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Exportar como PDF</p>
          </div>

          {/* All pages */}
          <button
            onClick={() => runExport(detectedPages)}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
          >
            <Files className="w-4 h-4 text-emerald-500 shrink-0" />
            Todas las páginas
            <span className="ml-auto text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
              {detectedPages.length}
            </span>
          </button>

          {/* Divider */}
          {detectedPages.length > 1 && (
            <div className="border-t border-slate-100">
              {detectedPages.map((page, i) => (
                <button
                  key={page.id || i}
                  onClick={() => runExport([page])}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors"
                >
                  <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{getPageLabel(page, i)}</span>
                  <span className="ml-auto text-[10px] text-slate-400 shrink-0">Hoja {i + 1}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
