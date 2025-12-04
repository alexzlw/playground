import React, { useCallback, useRef } from 'react';
import { isImageFile } from '../utils';

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

const Dropzone: React.FC<DropzoneProps> = ({ onFilesSelected, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;

      const files = Array.from(e.dataTransfer.files).filter(isImageFile);
      if (files.length > 0) {
        onFilesSelected(files);
      }
    },
    [disabled, onFilesSelected]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files).filter(isImageFile);
      onFilesSelected(files);
    }
    // Reset value to allow selecting same files again
    e.target.value = '';
  };

  const handleFolderInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Filter for images
      const files = Array.from(e.target.files).filter(isImageFile);
      onFilesSelected(files);
    }
    e.target.value = '';
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={`
        border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300
        ${disabled ? 'opacity-50 cursor-not-allowed border-slate-600 bg-slate-800/50' : 'cursor-pointer border-slate-500 hover:border-primary hover:bg-slate-800/80 bg-slate-800/30'}
      `}
    >
      <div className="flex flex-col items-center justify-center space-y-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        
        <div className="space-y-2">
          <h3 className="text-xl font-medium text-white">画像 または フォルダーをドロップ</h3>
          <p className="text-slate-400 text-sm">または、以下のボタンから選択してください</p>
        </div>

        <div className="flex gap-4 mt-4 justify-center">
          <input
            type="file"
            multiple
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileInputChange}
            disabled={disabled}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20"
          >
            画像を選択
          </button>

          <input
            type="file"
            // @ts-ignore
            webkitdirectory=""
            directory=""
            multiple
            ref={folderInputRef}
            className="hidden"
            onChange={handleFolderInputChange}
            disabled={disabled}
          />
          <button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            disabled={disabled}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors border border-slate-600"
          >
            フォルダーを選択
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dropzone;