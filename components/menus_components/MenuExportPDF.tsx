import React, { useState } from 'react';
import { Printer, Loader2 } from 'lucide-react';
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

  const handleExport = async () => {
    const wrapper = document.getElementById(elementId);
    if (!wrapper) {
      console.warn("No se encontró el área de impresión.");
      return;
    }

    setExporting(true);

    try {
      // ── 1. Collect individual A4 pages ──────────────────────────────────
      // Each A4 page has a unique id. We look for them inside the wrapper.
      // Fallback: if we can't find them, export the wrapper as a whole.
      const allPages: HTMLElement[] = [];

      // Strategy A: find elements with explicit page ids
      const knownIds = ['menu-page-1', 'menu-page-2', 'recommendations-page'];
      knownIds.forEach(pid => {
        const el = wrapper.querySelector(`#${pid}`) as HTMLElement;
        if (el) allPages.push(el);
      });

      // Strategy B: if no known ids found, look for direct children that are
      // 210mm-wide divs (A4 pages) inside a container
      if (allPages.length === 0) {
        const container = wrapper.querySelector('.menu-template-container') || wrapper;
        const children = Array.from(container.children) as HTMLElement[];
        children.forEach(child => {
          // Accept any element that looks like an A4 page (has height set to 297mm)
          const h = child.style?.height;
          if (h === '297mm' || child.id) {
            allPages.push(child);
          }
        });
      }

      // Strategy C: last resort — just export the wrapper
      if (allPages.length === 0) {
        allPages.push(wrapper);
      }

      // ── 2. Shared pdf options ───────────────────────────────────────────
      const baseOpt = {
        margin: 0,
        image: { type: 'jpeg' as const, quality: 0.95 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          letterRendering: true,
        },
        jsPDF: {
          unit: 'mm' as const,
          format: 'a4' as const,
          orientation: 'portrait' as const,
          compress: true,
        },
      };

      // ── 3. Build PDF page-by-page ───────────────────────────────────────
      // Start with first page
      let worker = html2pdf().set(baseOpt).from(allPages[0]).toPdf();

      // Chain subsequent pages
      for (let i = 1; i < allPages.length; i++) {
        worker = worker
          .get('pdf')
          .then((pdf: any) => { pdf.addPage(); })
          .from(allPages[i])
          .toContainer()
          .toCanvas()
          .toPdf();
      }

      // ── 4. Open in new tab ──────────────────────────────────────────────
      const safeName = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
      await worker.get('pdf').then((pdf: any) => {
        const blob = pdf.output('bloburl');
        window.open(blob, '_blank');
      });

    } catch (err) {
      console.error('Error exporting PDF:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={disabled || exporting}
      className={className}
    >
      {exporting ? (
        <>
          <Loader2 className={`w-5 h-5 animate-spin${hideIconOnMobile ? ' hidden md:inline' : ''}`} />
          Exportando...
        </>
      ) : children ? children : (
        <>
          <Printer className={`w-5 h-5${hideIconOnMobile ? ' hidden md:inline' : ''}`} />
          {label}
        </>
      )}
    </button>
  );
};