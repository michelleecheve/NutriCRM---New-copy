import JSZip from 'jszip';
import { Patient } from '../types';
import { store } from './store';
import { getTodayStr } from '../src/utils/dateUtils';
import { buildClinicalDocBlob } from './exportClinicalDoc';
import { buildEvaluationDocBlob } from './exportEvaluationDoc';
import { exportMenuPDFAsBlob } from './exportMenuPDF';

/**
 * Generates a ZIP with the following structure:
 *
 *   Expediente_NombreCompleto_fecha.zip
 *   ├── Informacion_Clinica_NombreCompleto.docx
 *   ├── Evaluacion_FECHA1_NombreCompleto/
 *   │   ├── Evaluacion_FECHA1_NombreCompleto.docx
 *   │   └── Menu_FECHA1_NombreCompleto.pdf  (only if a linked menu with menuData exists)
 *   ├── Evaluacion_FECHA2_NombreCompleto/
 *   │   └── ...
 *   └── ...
 *
 * Strategy:
 * - The clinical doc and all evaluation docs are built in parallel (pure JS, no DOM conflict).
 * - Menu PDFs are built sequentially per evaluation because html2pdf renders to the live DOM.
 */
export async function exportPatientZip(patient: Patient): Promise<void> {
  const safeName = `${patient.firstName}_${patient.lastName}`.replace(/\s+/g, '_');
  const user = store.getUserProfile();
  const today = getTodayStr(user.timezone);

  const evals = store.getEvaluations(patient.id);

  // ── Phase 1: build all docx blobs in parallel ───────────────────────────
  const [clinicalBlob, ...evalDocBlobs] = await Promise.all([
    buildClinicalDocBlob(patient),
    ...evals.map((ev) => buildEvaluationDocBlob(patient, ev)),
  ]);

  // ── Phase 2: build menu PDF blobs sequentially ──────────────────────────
  // html2pdf mounts and unmounts DOM nodes; running multiple in parallel can
  // cause canvas/layout conflicts, so we process them one at a time.
  const menuBlobs: (Blob | null)[] = [];
  for (const ev of evals) {
    const linkedMenu = patient.menus.find(
      (m) => m.linkedEvaluationId === ev.id && m.menuData,
    );
    if (linkedMenu) {
      try {
        menuBlobs.push(await exportMenuPDFAsBlob(linkedMenu));
      } catch {
        menuBlobs.push(null);
      }
    } else {
      menuBlobs.push(null);
    }
  }

  // ── Phase 3: assemble ZIP ───────────────────────────────────────────────
  const zip = new JSZip();

  zip.file(`Informacion_Clinica_${safeName}.docx`, clinicalBlob);

  evals.forEach((ev, i) => {
    const folderName = `Evaluacion_${ev.date}_${safeName}`;
    const folder = zip.folder(folderName)!;
    folder.file(`Evaluacion_${ev.date}_${safeName}.docx`, evalDocBlobs[i]);
    if (menuBlobs[i]) {
      folder.file(`Menu_${ev.date}_${safeName}.pdf`, menuBlobs[i]!);
    }
  });

  // ── Phase 4: download ───────────────────────────────────────────────────
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Expediente_${safeName}_${today}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
