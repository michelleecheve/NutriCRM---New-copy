import React, { useMemo, useRef, useState } from 'react';
import { Trash2, Download, Eye, FileText, Image as ImageIcon, File, X, Link2, UploadCloud, Pencil, AlertTriangle } from 'lucide-react';
import { compressImage, fileToBase64 } from "../../src/utils/fileUtils";
import { store } from '../../services/store';
import type { PatientEvaluation } from '../../types';

interface FileGalleryProps {
  patientId: string;
  files: any[];
  onUpdate: (files: any[]) => void;
  title: string;
  icon: any;
  accept?: string;
  showDelete?: boolean; // ✅ para ocultar al usar dentro de EvaluationDetail
}

const ConfirmModal: React.FC<{
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ title, message, confirmText = 'Sí, eliminar', cancelText = 'Cancelar', onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-[80] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="font-bold text-slate-900">{title}</h3>
        </div>
        <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-5">
        <p className="text-sm text-slate-600">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  </div>
);

const InfoModal: React.FC<{
  title: string;
  message: string;
  onClose: () => void;
}> = ({ title, message, onClose }) => (
  <div className="fixed inset-0 z-[80] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-bold text-slate-900">{title}</h3>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-5">
        <p className="text-sm text-slate-600">{message}</p>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  </div>
);

export const FileGallery: React.FC<FileGalleryProps> = ({
  patientId,
  files,
  onUpdate,
  title,
  icon: Icon,
  accept = "*/*",
  showDelete = true
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewFile, setPreviewFile] = useState<any | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // ✅ upload modal (drag&drop)
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // ✅ modales (para sandbox)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [infoModal, setInfoModal] = useState<{ title: string; message: string } | null>(null);

  // ✅ evaluaciones disponibles
  const patientEvaluations: PatientEvaluation[] = useMemo(
    () => store.getEvaluations(patientId),
    [patientId]
  );

  // ✅ vinculación "por defecto para el upload" (config inicial dentro del modal)
  const [uploadEvalSelectorOpen, setUploadEvalSelectorOpen] = useState(false);
  const [uploadEvaluationId, setUploadEvaluationId] = useState<string | null>(
    store.getSelectedEvaluationId(patientId)
  );
  const uploadEvaluation = useMemo(() => {
    if (!uploadEvaluationId) return null;
    return store.getEvaluationById(uploadEvaluationId) ?? null;
  }, [uploadEvaluationId]);

  const uploadLinkedDate =
    uploadEvaluation?.date ??
    (store.getTodayStr ? store.getTodayStr() : new Date().toISOString().split('T')[0]);

  const handleChangeUploadEvaluation = (evId: string) => {
    const ev = store.getEvaluationById(evId);
    setUploadEvaluationId(evId || null);
    if (ev) store.setSelectedEvaluationId(patientId, ev.id);
    setUploadEvalSelectorOpen(false);
  };

  // ✅ vinculación "por archivo" (icono en cada tarjeta)
  const [fileLinkModalOpen, setFileLinkModalOpen] = useState(false);
  const [linkingFileId, setLinkingFileId] = useState<string | null>(null);
  const [fileEvalSelectorOpen, setFileEvalSelectorOpen] = useState(false);
  const [fileEvaluationId, setFileEvaluationId] = useState<string | null>(null);

  const fileEvaluation = useMemo(() => {
    if (!fileEvaluationId) return null;
    return store.getEvaluationById(fileEvaluationId) ?? null;
  }, [fileEvaluationId]);

  const fileLinkedDate =
    fileEvaluation?.date ??
    (store.getTodayStr ? store.getTodayStr() : new Date().toISOString().split('T')[0]);

  const openFileLinkModal = (file: any) => {
    setLinkingFileId(file.id);

    const currentLinkedEvalId = file.linkedEvaluationId as string | undefined;
    if (currentLinkedEvalId && store.getEvaluationById(currentLinkedEvalId)) {
      setFileEvaluationId(currentLinkedEvalId);
    } else {
      // fallback: intentar match por date
      const match = patientEvaluations.find(e => e.date === file.date);
      setFileEvaluationId(match?.id ?? store.getSelectedEvaluationId(patientId));
    }

    setFileEvalSelectorOpen(false);
    setFileLinkModalOpen(true);
  };

  const applyFileLink = () => {
    if (!linkingFileId) return;

    const nextDate = fileLinkedDate;

    onUpdate(files.map(f => {
      if (f.id !== linkingFileId) return f;
      return {
        ...f,
        date: nextDate,
        linkedEvaluationId: fileEvaluationId ?? null
      };
    }));

    setFileLinkModalOpen(false);
    setLinkingFileId(null);
    setFileEvalSelectorOpen(false);
  };

  const uploadFileObject = async (file: File) => {
    const isImage = file.type.startsWith('image/');

    if (!isImage && file.size > 500 * 1024) {
      setInfoModal({ title: 'Archivo muy grande', message: 'El archivo supera el límite de 500 KB.' });
      return;
    }

    setIsUploading(true);
    try {
      let fileUrl = '';
      let type: 'image' | 'pdf' | 'other' = 'other';

      if (isImage) {
        fileUrl = await compressImage(file);
        type = 'image';
      } else {
        fileUrl = await fileToBase64(file);
        if (file.type === 'application/pdf') type = 'pdf';
      }

      const newFile = {
        id: Math.random().toString(36).substring(7),
        name: file.name,
        date: uploadLinkedDate,
        linkedEvaluationId: uploadEvaluationId ?? null,
        url: fileUrl,
        type: type,
        description: ''
      };

      onUpdate([...files, newFile]);
    } catch (error) {
      console.error('Error uploading file:', error);
      setInfoModal({ title: 'Error', message: 'Error al subir el archivo.' });
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
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(
          `<iframe src="${file.url}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
        );
        newWindow.document.title = file.name;
      }
    } else if (file.type === 'image') {
      setPreviewFile(file);
    }
  };

  // ✅ delete flow sin confirm()
  const requestDelete = (id: string) => {
    setDeleteTargetId(id);
    setConfirmDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteTargetId) return;
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

  const handleRename = (id: string, newName: string) => {
    onUpdate(files.map(f => f.id === id ? { ...f, name: newName } : f));
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="w-6 h-6 text-blue-500" />;
      case 'pdf': return <FileText className="w-6 h-6 text-red-500" />;
      default: return <File className="w-6 h-6 text-slate-400" />;
    }
  };

  // Drag & drop en el modal de upload
  const [isDragOver, setIsDragOver] = useState(false);
  const onDrop = async (ev: React.DragEvent) => {
    ev.preventDefault();
    setIsDragOver(false);
    const file = ev.dataTransfer.files?.[0];
    if (file) {
      await uploadFileObject(file);
      setUploadModalOpen(false);
    }
  };

  return (
    <>
      {infoModal && (
        <InfoModal
          title={infoModal.title}
          message={infoModal.message}
          onClose={() => setInfoModal(null)}
        />
      )}

      {confirmDeleteOpen && (
        <ConfirmModal
          title="Eliminar archivo"
          message="¿Seguro que deseas eliminar este archivo? Esta acción no se puede deshacer."
          onCancel={() => { setConfirmDeleteOpen(false); setDeleteTargetId(null); }}
          onConfirm={confirmDelete}
        />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600">
              <Icon className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 truncate">{title}</h3>
          </div>

          <button
            type="button"
            onClick={() => setUploadModalOpen(true)}
            disabled={isUploading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50 shrink-0"
          >
            {isUploading ? 'Subiendo...' : '+ Subir Archivo'}
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept={accept}
            className="hidden"
          />
        </div>

        {/* Empty / Grid */}
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
            <Icon className="w-12 h-12 text-slate-200 mb-4" />
            <p>No hay archivos registrados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((file) => (
              <div key={file.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100 hover:border-emerald-200 transition-all group">
                <div
                  className={`flex flex-col gap-3 ${(file.type === 'image' || file.type === 'pdf') ? 'cursor-pointer' : ''}`}
                  onClick={() => handlePreview(file)}
                >
                  {file.type === 'image' && (
                    <div className="w-full h-40 rounded-lg overflow-hidden bg-white border border-slate-100 shadow-sm">
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
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleRename(file.id, e.target.value)}
                        className="w-full bg-transparent border-none p-0 text-sm font-bold text-slate-900 focus:ring-0 truncate"
                      />
                      <p className="text-xs text-slate-400 mt-0.5">{file.date}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-200/50">
                  {/* vincular POR ARCHIVO */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); openFileLinkModal(file); }}
                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                    title="Vincular a evaluación"
                  >
                    <Link2 className="w-4 h-4" />
                  </button>

                  {(file.type === 'image' || file.type === 'pdf') && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handlePreview(file); }}
                      className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                      title="Previsualizar"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={(e) => { e.stopPropagation(); handleDownload(file); }}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    title="Descargar"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  {showDelete && (
                    <button
                      onClick={(e) => { e.stopPropagation(); requestDelete(file.id); }}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* File link modal (por archivo) */}
        {fileLinkModalOpen && (
          <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900">Vincular archivo a evaluación</h3>
                </div>
                <button
                  onClick={() => {
                    setFileLinkModalOpen(false);
                    setLinkingFileId(null);
                    setFileEvalSelectorOpen(false);
                  }}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Evaluación asignada</p>

                  {!fileEvalSelectorOpen ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-700">
                        {fileEvaluation ? `${fileEvaluation.title ?? fileEvaluation.date} — ${fileEvaluation.date}` : '—'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setFileEvalSelectorOpen(true)}
                        className="p-1 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors"
                        title="Cambiar evaluación asignada"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <select
                        value={fileEvaluationId ?? ''}
                        onChange={(e) => { setFileEvaluationId(e.target.value || null); setFileEvalSelectorOpen(false); }}
                        className="text-sm bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-200 w-full"
                        autoFocus
                        disabled={patientEvaluations.length === 0}
                      >
                        {patientEvaluations.length === 0 ? (
                          <option value="">Crea una evaluación primero</option>
                        ) : (
                          <>
                            <option value="">Seleccionar...</option>
                            {patientEvaluations.map(ev => (
                              <option key={ev.id} value={ev.id}>
                                {ev.title ?? ev.date} — {ev.date}
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                      <button
                        type="button"
                        onClick={() => setFileEvalSelectorOpen(false)}
                        className="p-2 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Fecha de evaluación</p>
                  <input
                    type="date"
                    value={fileLinkedDate}
                    disabled
                    readOnly
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-600 outline-none cursor-not-allowed"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFileLinkModalOpen(false);
                      setLinkingFileId(null);
                      setFileEvalSelectorOpen(false);
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={applyFileLink}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-colors"
                  >
                    Guardar vínculo
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upload modal */}
        {uploadModalOpen && (
          <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900">Subir archivo</h3>
                </div>
                <button
                  onClick={() => {
                    setUploadModalOpen(false);
                    setUploadEvalSelectorOpen(false);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-5">
                <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-3">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Evaluación asignada</p>

                    {!uploadEvalSelectorOpen ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-700">
                          {uploadEvaluation ? `${uploadEvaluation.title ?? uploadEvaluation.date} — ${uploadEvaluation.date}` : '—'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setUploadEvalSelectorOpen(true)}
                          className="p-1 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors"
                          title="Cambiar evaluación asignada"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <select
                          value={uploadEvaluationId ?? ''}
                          onChange={(e) => handleChangeUploadEvaluation(e.target.value)}
                          className="text-sm bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-200 w-full"
                          autoFocus
                          disabled={patientEvaluations.length === 0}
                        >
                          {patientEvaluations.length === 0 ? (
                            <option value="">Crea una evaluación primero</option>
                          ) : (
                            <>
                              <option value="">Seleccionar...</option>
                              {patientEvaluations.map(ev => (
                                <option key={ev.id} value={ev.id}>
                                  {ev.title ?? ev.date} — {ev.date}
                                </option>
                              ))}
                            </>
                          )}
                        </select>
                        <button
                          type="button"
                          onClick={() => setUploadEvalSelectorOpen(false)}
                          className="p-2 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Fecha de evaluación</p>
                    <input
                      type="date"
                      value={uploadLinkedDate}
                      disabled
                      readOnly
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-600 outline-none cursor-not-allowed"
                    />
                  </div>
                </div>

                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={onDrop}
                  className={`rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
                    isDragOver ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-white'
                  }`}
                >
                  <UploadCloud className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                  <p className="text-sm font-bold text-slate-700">Arrastra el archivo aquí</p>
                  <p className="text-xs text-slate-400 mt-1">o</p>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    {isUploading ? 'Subiendo...' : 'Subir archivo'}
                  </button>

                  <p className="text-[10px] text-slate-400 mt-3">
                    Límite: 500 KB (imágenes se comprimen automáticamente).
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
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
              <div className="flex-1 overflow-auto bg-slate-100 p-8 pt-12 flex items-start justify-center">
                <img src={previewFile.url} alt={previewFile.name} className="max-w-full max-h-full object-contain shadow-lg" />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};