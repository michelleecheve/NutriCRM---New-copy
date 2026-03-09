
import React, { useRef, useState } from 'react';
import { Trash2, Download, Eye, Edit3, FileText, Image as ImageIcon, File, X } from 'lucide-react';
import { compressImage, fileToBase64 } from "../../src/utils/fileUtils";

interface FileGalleryProps {
  files: any[];
  onUpdate: (files: any[]) => void;
  title: string;
  icon: any;
  accept?: string;
}

export const FileGallery: React.FC<FileGalleryProps> = ({ files, onUpdate, title, icon: Icon, accept = "*/*" }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewFile, setPreviewFile] = useState<any | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (500 KB)
    // Note: If it's an image, we'll compress it, so we check size after compression.
    // But for non-images, we check now.
    const isImage = file.type.startsWith('image/');
    
    if (!isImage && file.size > 500 * 1024) {
      alert('El archivo supera el límite de 500 KB.');
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
        date: new Date().toISOString().split('T')[0],
        url: fileUrl,
        type: type,
        description: ''
      };

      onUpdate([...files, newFile]);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error al subir el archivo.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePreview = (file: any) => {
    if (file.type === 'pdf') {
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`<iframe src="${file.url}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
        newWindow.document.title = file.name;
      }
    } else if (file.type === 'image') {
      setPreviewFile(file);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este archivo?')) {
      onUpdate(files.filter(f => f.id !== id));
    }
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600">
            <Icon className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50"
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
                className={`flex flex-col gap-3 ${ (file.type === 'image' || file.type === 'pdf') ? 'cursor-pointer' : '' }`}
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

              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-200/50">
                {(file.type === 'image' || file.type === 'pdf') && (
                  <button
                    onClick={() => handlePreview(file)}
                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                    title="Previsualizar"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDownload(file)}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                  title="Descargar"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(file.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
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
  );
};
