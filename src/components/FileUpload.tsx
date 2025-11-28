import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, X, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface FileUploadProps {
  onFileUploaded: (fileId: string) => void;
}

export function FileUpload({ onFileUploaded }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];

    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx?|csv)$/i)) {
      setError('Please upload an Excel file (.xlsx, .xls) or CSV file');
      return;
    }

    setError('');
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('user_id', user.id);

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      const data = await response.json();
      onFileUploaded(data.file_id);
      setSelectedFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-12 text-center transition ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-slate-300 bg-white hover:border-blue-400'
        }`}
      >
        {!selectedFile ? (
          <>
            <div className="flex justify-center mb-4">
              <div className="bg-blue-100 rounded-full p-4">
                <FileSpreadsheet className="w-12 h-12 text-blue-600" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Upload Your Excel File
            </h3>
            <p className="text-slate-600 mb-6">
              Drag and drop your file here, or click to browse
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition inline-flex items-center gap-2"
            >
              <Upload className="w-5 h-5" />
              Choose File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
              className="hidden"
            />
            <p className="text-sm text-slate-500 mt-4">
              Supports .xlsx, .xls, and .csv files
            </p>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-8 h-8 text-blue-600" />
                <div className="text-left">
                  <p className="font-medium text-slate-900">{selectedFile.name}</p>
                  <p className="text-sm text-slate-600">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Upload & Analyze
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
}