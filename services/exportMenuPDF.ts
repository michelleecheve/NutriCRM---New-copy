import React from 'react';
import { createRoot } from 'react-dom/client';
import { GeneratedMenu } from '../types';
import { MenuTemplateV1, MenuTemplateV2 } from '../components/menus_components/MenuDesignTemplates';
// @ts-ignore
import html2pdf from 'html2pdf.js';

export async function exportMenuPDF(menu: GeneratedMenu, filename: string): Promise<void> {
  if (!menu.menuData) return;

  // Determine template from dedicated column, fallback to plantilla_v1
  const templateId: string = menu.templateId || 'plantilla_v1';

  // Create hidden off-screen container
  const container = document.createElement('div');
  container.style.cssText =
    'position:fixed;top:-9999px;left:-9999px;width:210mm;z-index:-1;background:#fff;';
  document.body.appendChild(container);

  const root = createRoot(container);

  try {
    const Template = templateId === 'plantilla_v2' ? MenuTemplateV2 : MenuTemplateV1;

    // Render and wait for paint
    await new Promise<void>((resolve) => {
      root.render(React.createElement(Template, { data: menu.menuData }));
      requestAnimationFrame(() => setTimeout(resolve, 600));
    });

    // Collect A4 pages — same strategy as MenuExportPDF
    const allPages: HTMLElement[] = [];
    const knownIds = ['menu-page-1', 'menu-page-2', 'recommendations-page'];
    knownIds.forEach((pid) => {
      const el = container.querySelector(`#${pid}`) as HTMLElement | null;
      if (el) allPages.push(el);
    });
    if (allPages.length === 0) allPages.push(container);

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

    let worker = html2pdf().set(baseOpt).from(allPages[0]).toPdf();

    for (let i = 1; i < allPages.length; i++) {
      worker = worker
        .get('pdf')
        .then((pdf: any) => { pdf.addPage(); })
        .from(allPages[i])
        .toContainer()
        .toCanvas()
        .toPdf();
    }

    const safeName = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    await worker.get('pdf').then((pdf: any) => {
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = safeName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  } finally {
    root.unmount();
    document.body.removeChild(container);
  }
}
