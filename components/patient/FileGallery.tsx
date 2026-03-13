import React, {
  useState, useRef, useEffect, useMemo, forwardRef, useImperativeHandle,
} from 'react';
import {
  UploadCloud, X, Trash2, Download, Link, ImageIcon,
  FileText, File, Eye,
} from 'lucide-react';
import { store } from '../../services/store';
import { supabaseService } from '../../services/supabaseService';
import { authStore } from '../../services/authStore';

interface FileGalleryProps {
  patientId: string;
  files: any[];
  onUpdate: (files: any[]) => void;
  title: string;
  icon: React.ElementType;
  accept?: string;
  showDelete?: boolean;
}

export interface FileGalleryHandle {
  openUpload: () => void;
}

// ── Compresión de imágenes ────────────────────────────────────────────────────
const compressImageFile = (inputFile: File, maxSizeKb = 500): Promise<File> => {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(inputFile);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      const MAX_DIM = 1920;
      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) { height = Math.round(height * MAX_DIM / width); width = MAX_DIM; }
        else { width = Math.round(width * MAX_DIM / height); height = MAX_DIM; }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);

      let quality = 0.9;
      const tryCompress = () => {
        canvas.toBlob((blob) => {
          if (!blob) { resolve(inputFile); return; }
          if (blob.size <= maxSizeKb * 1024 || quality <= 0.1) {
            resolve(new globalThis.File([blob], inputFile.name, { type: 'image/jpeg' }));
          } else {
            quality -= 0.1;
            tryCompress();
          }
        }, 'image/jpeg', quality);
      };
      tryCompress();
    };
    img.src = objectUrl;
  });
};

export const FileGallery = forwardRef<FileGalleryHandle, FileGalleryProps>(
  ({ patientId, files = [], onUpdate, title, icon: Icon, accept, showDelete = true }, ref) => {

    const [uploadModalOpen,        setUploadModalOpen]        = useState(false);
    const [isUploading,            setIsUploading]            = useState(false);
    const [previewFile,            setPreviewFile]            = useState<any>(null);
    const [confirmDeleteOpen,      setConfirmDeleteOpen]      = useState(false);
    const [deleteTargetId,         setDeleteTargetId]         = useState<string | null>(null);
    const [infoModal,              setInfoModal]              = useState<{ title: string; message: string } | null>(null);
    const [uploadEvaluationId,     setUploadEvaluationId]     = useState<string | null>(null);
    const [uploadEvalSelectorOpen, setUploadEvalSelectorOpen] = useState(false);
    const [fileLinkModalOpen,      setFileLinkModalOpen]      = useState(false);
    const [linkingFileId,          setLinkingFileId]          = useState<string | null>(null);
    const [fileEvalSelectorOpen,   setFileEvalSelectorOpen]   = useState(false);
    const [fileEvaluationId,       setFileEvaluationId]       = useState<string | null>(null);
    const [isDragOver,             setIsDragOver]             = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({ openUpload: () => setUploadModalOpen(true) }));

    const patientEvaluations = useMemo(
      () => store.getEvaluations(patientId),
      [patientId],
    );

    const uploadEvaluation = useMemo(
      () => (uploadEvaluationId ? store.getEvaluationById(uploadEvaluationId) ?? null : null),
      [uploadEvaluationId],
    );

    const uploadLinkedDate =
      uploadEvaluation?.date ??
      (store.getTodayStr ? store.getTodayStr() : new Date().toISOString().split('T')[0]);

    const fileEvaluation = useMemo(
      () => (fileEvaluationId ? store.getEvaluationById(fileEvaluationId) ?? null : null),
      [fileEvaluationId],
    );

    const fileLinkedDate =
      fileEvaluation?.date ??
      (store.getTodayStr ? store.getTodayStr() : new Date().toISOString().split('T')[0]);

    const handleChangeUploadEvaluation = (evId: string) => {
      const ev = store.getEvaluationById(evId);
      setUploadEvaluationId(evId || null);
      if (ev) store.setSelectedEvaluationId(patientId, ev.id);
      setUploadEvalSelectorOpen(false);
    };

    const openFileLinkModal = (file: any) => {
      setLinkingFileId(file.id);
      const currentLinkedEvalId = file.linkedEvaluationId as string | undefined;
      if (currentLinkedEvalId && store.getEvaluationById(currentLinkedEvalId)) {
        setFileEvaluationId(currentLinkedEvalId);
      } else {
        const match = patientEvaluations.find(e => e.date === file.date);
        setFileEvaluationId(match?.id ?? store.getSelectedEvaluationId(patientId));
      }
      setFileEvalSelectorOpen(false);
      setFileLinkModalOpen(true);
    };

    const applyFileLink = async () => {
      if (!linkingFileId) return;
      const nextDate = fileLinkedDate;
      const updatedFiles = files.map(f => {
        if (f.id !== linkingFileId) return f;
        return { ...f, date: nextDate, linkedEvaluationId: fileEvaluationId ?? null };
      });
      onUpdate(updatedFiles);
      try {
        await supabaseService.updatePatientFile(linkingFileId, {
          evaluationId: fileEvaluationId,
          date:         nextDate,
        });
      } catch (err) {
        console.error('Error actualizando vínculo en Supabase:', err);
      }
      setFileLinkModalOpen(false);
      setLinkingFileId(null);
      setFileEvalSelectorOpen(false);
    };

    const uploadFileObject = async (file: File) => {
      const isImage = file.type.startsWith('image/');

      if (!isImage && file.size > 1024 * 1024) {
        setInfoModal({ title: 'Archivo muy grande', message: 'El archivo supera el límite de 1 MB.' });
        return;
      }

      setIsUploading(true);
      try {
        const fileToUpload = isImage ? await compressImageFile(file, 500) : file;

        const folder: 'photos' | 'labs' = isImage ? 'photos' : 'labs';
        const userId = authStore.getCurrentUser()?.id ?? 'guest';
        const type: 'image' | 'pdf' | 'other' = isImage
          ? 'image'
          : file.type === 'application/pdf' ? 'pdf' : 'other';

        const { signedUrl, path } = await supabaseService.uploadPatientFile(
          userId, patientId, fileToUpload, folder,
        );

        const saved = await supabaseService.savePatientFile({
          patientId,
          evaluationId:      uploadEvaluationId,
          name:              file.name,
          type,
          folder,
          path,
          url:               signedUrl,
          date:              uploadLinkedDate,
          description:       '',
          labInterpretation: '',
        });

        onUpdate([...files, saved]);
      } catch (error) {
        console.error('Error subiendo archivo:', error);
        setInfoModal({ title: 'Error al subir', message: 'No se pudo subir el archivo. Intenta de nuevo.' });
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      await uploadFileObject(file);
      setUploadModalOpen(false);
    };

    const handlePreview = (file: any) => {
      if (file.type === 'pdf') {
        window.open(file.url, '_blank');
      } else if (file.type === 'image') {
        setPreviewFile(file);
      }
    };

    const requestDelete = (id: string) => {
      setDeleteTargetId(id);
      setConfirmDeleteOpen(true);
    };

    const confirmDelete = async () => {
      if (!deleteTargetId) return;
      const target = files.find(f => f.id === deleteTargetId);
      if (target) {
        try {
          await supabaseService.deletePatientFile(target.id, target.path);
        } catch (err) {
          console.error('Error eliminando archivo:', err);
        }
      }
      onUpdate(files.filter(f => f.id !== deleteTargetId));
      setConfirmDeleteOpen(false);
      setDeleteTargetId(null);
    };

    const handleDownload = (file: any) => {
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const handleRename = async (id: string, newName: string) => {
      onUpdate(files.map(f => f.id === id ? { ...f, name: newName } : f));
      try {
        await supabaseService.updatePatientFile(id, { name: newName });
      } catch (err) {
        console.error('Error renombrando archivo:', err);
      }
    };

    const getFileIcon = (type: string) => {
      switch (type) {
        case 'image': return <ImageIcon className="w-6 h-6 text-blue-500" />;
        case 'pdf':   return <FileText  className="w-6 h-6 text-red-500"  />;
        default:      return <File      className="w-6 h-6 text-slate-400" />;
      }
    };

    const onDrop = async (ev: React.DragEvent) => {
      ev.preventDefault();
      setIsDragOver(false);
      const file = ev.dataTransfer.files?.[0];
      if (!file) return;
      setUploadModalOpen(false);
      await uploadFileObject(file);
    };

    return (
      <>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="w-5 h-5 text-slate-500" />
              <h3 className="font-bold text-slate-800">{title}</h3>
              <span className="text-xs text-slate-400 font-medium">({files.length})</span>
            </div>
            <button
              onClick={() => setUploadModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <UploadCloud className="w-4 h-4" />
              Subir
            </button>
          </div>

          {/* Grid */}
          {files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-300 border-2 border-dashed border-slate-100 rounded-2xl">
              <Icon className="w-10 h-10 mb-2" />
              <p className="text-sm font-medium text-slate-400">No hay archivos aún</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {files.map(file => (
                <div
                  key={file.id}
                  className="group relative bg-slate-50 rounded-2xl border border-slate-100 p-4 hover:border-slate-200 hover:shadow-md transition-all"
                >
                  <div
                    className={`${file.type === 'image' ? 'cursor-pointer' : ''}`}
                    onClick={() => handlePreview(file)}
                  >
                    {file.type === 'image' && (
                      <div className="w-full h-40 rounded-lg overflow-hidden bg-white border border-slate-100 shadow-sm mb-3">
                        <img
                          src={file.url}
                          alt={file.name}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
                        />
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      {file.type !== 'image' && (
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                          {getFileIcon(file.type)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={file.name}
                          onClick={e => e.stopPropagation()}
                          onChange={e => handleRename(file.id, e.target.value)}
                          className="w-full bg-transparent border-none p-0 text-sm font-bold text-slate-900 focus:ring-0 truncate"
                        />
                        <p className="text-xs text-slate-400 mt-0.5">{file.date}</p>
                        {file.labInterpretation && (
                          <span className="inline-block mt-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full">
                            ✓ Con interpretación
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => openFileLinkModal(file)}
                      title="Vincular a evaluación"
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      <Link className="w-3.5 h-3.5" />
                    </button>
                    {file.type === 'image' && (
                      <button
                        onClick={() => handlePreview(file)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-500 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDownload(file)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-emerald-600 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    {showDelete && (
                      <button
                        onClick={() => requestDelete(file.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Confirm Delete Modal ── */}
        {confirmDeleteOpen && (
          <div className="fixed inset-0 z-[80] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm p-6 space-y-4">
              <h3 className="font-bold text-slate-900">¿Eliminar archivo?</h3>
              <p className="text-sm text-slate-500">Esta acción no se puede deshacer. El archivo se eliminará del almacenamiento.</p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => { setConfirmDeleteOpen(false); setDeleteTargetId(null); }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Info Modal ── */}
        {infoModal && (
          <div className="fixed inset-0 z-[80] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm p-6 space-y-4">
              <h3 className="font-bold text-slate-900">{infoModal.title}</h3>
              <p className="text-sm text-slate-500">{infoModal.message}</p>
              <div className="flex justify-end">
                <button
                  onClick={() => setInfoModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── File Link Modal ── */}
        {fileLinkModalOpen && (
          <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm p-6 space-y-4">
              <h3 className="font-bold text-slate-900">Vincular a evaluación</h3>
              {!fileEvalSelectorOpen ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-700">
                    {fileEvaluation
                      ? `${fileEvaluation.title ?? fileEvaluation.date} — ${fileEvaluation.date}`
                      : 'Sin evaluación'}
                  </span>
                  <button
                    onClick={() => setFileEvalSelectorOpen(true)}
                    className="ml-auto text-xs font-bold text-emerald-600 hover:underline"
                  >
                    Cambiar
                  </button>
                </div>
              ) : (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {patientEvaluations.map(ev => (
                    <button
                      key={ev.id}
                      onClick={() => { setFileEvaluationId(ev.id); setFileEvalSelectorOpen(false); }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-emerald-50 text-sm font-medium text-slate-700 transition-colors"
                    >
                      {ev.title ?? ev.date} — {ev.date}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => { setFileLinkModalOpen(false); setLinkingFileId(null); setFileEvalSelectorOpen(false); }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={applyFileLink}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-colors"
                >
                  Guardar vínculo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Upload Modal ── */}
        {uploadModalOpen && (
          <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900">Subir archivo</h3>
                </div>
                <button
                  onClick={() => { setUploadModalOpen(false); setUploadEvalSelectorOpen(false); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-5">
                <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Evaluación asignada</p>
                  {!uploadEvalSelectorOpen ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-700">
                        {uploadEvaluation
                          ? `${uploadEvaluation.title ?? uploadEvaluation.date} — ${uploadEvaluation.date}`
                          : 'Sin evaluación específica'}
                      </span>
                      <button
                        onClick={() => setUploadEvalSelectorOpen(true)}
                        className="ml-auto text-xs font-bold text-emerald-600 hover:underline"
                      >
                        Cambiar
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {patientEvaluations.map(ev => (
                        <button
                          key={ev.id}
                          onClick={() => handleChangeUploadEvaluation(ev.id)}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-emerald-50 text-sm font-medium text-slate-700 transition-colors"
                        >
                          {ev.title ?? ev.date} — {ev.date}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div
                  onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={onDrop}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                    isDragOver ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <UploadCloud className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-500 mb-1">Arrastra un archivo aquí</p>
                  <p className="text-xs text-slate-400 mb-4">o haz clic para seleccionar</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={accept}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    {isUploading ? 'Subiendo...' : 'Seleccionar archivo'}
                  </button>
                  <p className="text-[10px] text-slate-400 mt-3">Imágenes: comprimidas a 500 KB · PDFs: máx 1 MB</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Preview Modal ── */}
        {previewFile && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-900 truncate">{previewFile.name}</h3>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 overflow-auto bg-slate-100 p-8 flex items-start justify-center">
                <img src={previewFile.url} alt={previewFile.name} className="max-w-full max-h-full object-contain shadow-lg" />
              </div>
            </div>
          </div>
        )}
      </>
    );
  },
);

FileGallery.displayName = 'FileGallery';