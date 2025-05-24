
import React, { useState, useCallback, useRef } from 'react';
// Fix: Remove import of non-existent ACCEPTED_FILE_TYPES
import { MAX_FILE_SIZE_MB } from '../constants';
import { UploadCloud, FileText, XCircle, FileType2 } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File, fileContent: string, mimeType: string) => void;
  isLoading: boolean;
  clearFile?: () => void; // Optional: To allow parent to trigger a clear
  currentFile?: File | null;
  // Fix: Add acceptedFileTypes prop
  acceptedFileTypes: string;
  // Fix: Add acceptedFileTypesDescription prop for display purposes
  acceptedFileTypesDescription?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileSelect, 
  isLoading, 
  clearFile, 
  currentFile,
  // Fix: Destructure new props
  acceptedFileTypes,
  acceptedFileTypesDescription 
}) => {
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileTypeIcon, setFileTypeIcon] = useState<React.ReactNode>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setError(null);
      setPreview(null);
      setFileName(null);
      setFileTypeIcon(null);

      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setError(`File is too large. Max size is ${MAX_FILE_SIZE_MB}MB.`);
        return;
      }
      
      // Fix: Use acceptedFileTypes prop for validation
      const acceptedTypesArray = acceptedFileTypes.split(',').map(type => type.trim());
      if (!acceptedTypesArray.includes(file.type)) {
         // Fix: Use acceptedFileTypesDescription or acceptedFileTypes in error message
         setError(`Invalid file type. Accepted types: ${acceptedFileTypesDescription || acceptedFileTypes}. Detected: ${file.type || 'unknown'}`);
         return;
      }

      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (file.type.startsWith('image/')) {
          setPreview(result); // For images, result is base64 data URL
          setFileTypeIcon(null); // Image itself is the preview
          onFileSelect(file, result.split(',')[1], file.type); // Send only base64 part
        } else if (file.type === 'text/plain') {
          setPreview(null);
          setFileTypeIcon(<FileText className="w-12 h-12 mb-3 text-slate-500 dark:text-slate-400" />);
          onFileSelect(file, result, file.type); // For text, result is text content
        } else if (file.type === 'application/pdf') {
          setPreview(null);
          setFileTypeIcon(<FileType2 className="w-12 h-12 mb-3 text-slate-500 dark:text-slate-400" />);
          onFileSelect(file, result.split(',')[1], file.type); // Send only base64 part for PDF
        } else {
            setError("Unsupported file type for processing.");
        }
      };
      reader.onerror = () => {
        setError("Failed to read file.");
      };

      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        reader.readAsDataURL(file);
      } else if (file.type === 'text/plain') {
        reader.readAsText(file);
      }
    }
  }, [onFileSelect, acceptedFileTypes, acceptedFileTypesDescription]);

  const handleClearFile = useCallback(() => {
    setError(null);
    setPreview(null);
    setFileName(null);
    setFileTypeIcon(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (clearFile) clearFile(); // Notify parent
  }, [clearFile]);

  // If parent provides currentFile, update local state
  React.useEffect(() => {
    if (!currentFile) {
        handleClearFile();
    }
  }, [currentFile, handleClearFile]);


  return (
    <div className="w-full p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg transition-all">
      <label
        htmlFor="file-upload"
        className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer
                   ${isLoading ? 'bg-slate-100 dark:bg-slate-700 opacity-70' : 'bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600'} 
                   ${error ? 'border-red-400 dark:border-red-500' : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'}`}
      >
        {preview && (
          <div className="relative w-full h-full flex items-center justify-center">
            <img src={preview} alt="File preview" className="max-h-full max-w-full object-contain rounded-md" />
          </div>
        )}
        {!preview && fileName && fileTypeIcon && (
             <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                {fileTypeIcon}
                <p className="mb-2 text-sm text-slate-600 dark:text-slate-300">
                  <span className="font-semibold">{fileName}</span>
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Ready to parse</p>
            </div>
        )}
        {!preview && !fileName && (
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
            <UploadCloud className="w-12 h-12 mb-3 text-slate-500 dark:text-slate-400" />
            <p className="mb-2 text-sm text-slate-600 dark:text-slate-300">
                <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            {/* Fix: Use acceptedFileTypesDescription prop for displaying allowed types */}
            <p className="text-xs text-slate-500 dark:text-slate-400">{acceptedFileTypesDescription || acceptedFileTypes}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Max file size: {MAX_FILE_SIZE_MB}MB</p>
            </div>
        )}
        <input
          id="file-upload"
          type="file"
          className="hidden"
          // Fix: Use acceptedFileTypes prop for the input accept attribute
          accept={acceptedFileTypes}
          onChange={handleFileChange}
          disabled={isLoading}
          ref={fileInputRef}
        />
        {(fileName || preview) && !isLoading && (
            <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleClearFile(); }} 
                className="absolute top-3 right-3 p-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-full hover:bg-red-500 hover:text-white dark:hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors"
                aria-label="Clear file"
            >
                <XCircle size={22} />
            </button>
        )}
      </label>
      
      {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400 text-center">{error}</p>}
    </div>
  );
};

export default FileUpload;
