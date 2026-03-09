
import React from 'react';
import { Printer } from 'lucide-react';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface MenuExportPDFProps {
  elementId: string;
  filename: string;
  className?: string;
  disabled?: boolean;
  label?: string;
  children?: React.ReactNode;
}

export const MenuExportPDF: React.FC<MenuExportPDFProps> = ({
  elementId,
  filename,
  className = "",
  disabled = false,
  label = "Exportar PDF",
  children
}) => {
  const handleExport = () => {
    const element = document.getElementById(elementId);
    if (!element) {
      console.warn("No se encontró el área de impresión.");
      return;
    }

    const opt = {
      margin: 0,
      filename: filename.endsWith('.pdf') ? filename : `${filename}.pdf`,
      image: { type: 'png' as const, quality: 1.0 },
      html2canvas: { 
        scale: 4, 
        useCORS: true, 
        logging: false, 
        letterRendering: true,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      },
      jsPDF: { 
        unit: 'mm' as const, 
        format: 'a4' as const, 
        orientation: 'portrait' as const,
        compress: true
      }
    };

    // Generate PDF and open in new tab
    html2pdf().set(opt).from(element).toPdf().get('pdf').then((pdf: any) => {
      const blob = pdf.output('bloburl');
      window.open(blob, '_blank');
    });
  };

  return (
    <button
      onClick={handleExport}
      disabled={disabled}
      className={className}
    >
      {children ? children : (
        <>
          <Printer className="w-5 h-5" />
          {label}
        </>
      )}
    </button>
  );
};
