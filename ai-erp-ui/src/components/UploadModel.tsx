// src/components/UploadModal.tsx
import { X, Upload as UploadIcon, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useCallback } from 'react';
import '../styles/components.css';
import { uploadFile } from '../services/api';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete?: (filename: string) => void;
}

const UploadModal = ({ isOpen, onClose, onUploadComplete }: UploadModalProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setUploadComplete(false);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setError(null);
      setUploadComplete(false);
    }
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Simulate progress since FormData doesn't provide real-time progress easily
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await uploadFile(selectedFile);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadComplete(true);

      // Call callback
      if (onUploadComplete) {
        onUploadComplete(response.filename);
      }

      // Auto close after 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadComplete(false);
    setError(null);
    setIsUploading(false);
    onClose();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <h2 className="text-2xl font-bold text-white">Upload Document</h2>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Upload Area */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
                ${dragActive 
                  ? 'border-cyan-500 bg-cyan-500/10' 
                  : 'border-slate-600 hover:border-slate-500'
                }
                ${isUploading ? 'opacity-50 pointer-events-none' : ''}
              `}
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-cyan-500/10 rounded-full">
                  <UploadIcon className="h-12 w-12 text-cyan-400" />
                </div>
                
                {selectedFile ? (
                  <div className="space-y-2">
                    <p className="text-white font-semibold">{selectedFile.name}</p>
                    <p className="text-slate-400 text-sm">{formatFileSize(selectedFile.size)}</p>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-white font-semibold mb-1">
                        Drag and drop your file here
                      </p>
                      <p className="text-slate-400 text-sm">
                        or click to browse
                      </p>
                    </div>
                  </>
                )}

                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".csv,.xlsx,.xls,.pdf,.txt,.json,.md"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
                
                {!selectedFile && (
                  <label
                    htmlFor="file-upload"
                    className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg cursor-pointer transition-all duration-200 font-medium"
                  >
                    Select File
                  </label>
                )}

                <p className="text-slate-500 text-xs">
                  Supported: CSV, Excel, PDF, TXT, JSON, MD
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            {isUploading && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Uploading...</span>
                  </span>
                  <span className="text-white font-semibold">{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    className="h-full bg-gradient-to-r from-cyan-500 to-cyan-600"
                  />
                </div>
              </motion.div>
            )}

            {/* Success Message */}
            {uploadComplete && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center space-x-3 p-4 bg-green-500/10 border border-green-500/50 rounded-lg"
              >
                <CheckCircle className="h-6 w-6 text-green-400" />
                <div>
                  <p className="text-green-400 font-semibold">Upload Successful</p>
                  <p className="text-green-300 text-sm">File uploaded and ready for analysis</p>
                </div>
              </motion.div>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center space-x-3 p-4 bg-red-500/10 border border-red-500/50 rounded-lg"
              >
                <AlertCircle className="h-6 w-6 text-red-400" />
                <div>
                  <p className="text-red-400 font-semibold">Upload Failed</p>
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                onClick={handleClose}
                disabled={isUploading}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all duration-200 disabled:opacity-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading || uploadComplete}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white rounded-lg transition-all duration-200 disabled:opacity-50 font-medium flex items-center justify-center space-x-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : uploadComplete ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Complete</span>
                  </>
                ) : (
                  <>
                    <UploadIcon className="h-4 w-4" />
                    <span>Upload File</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default UploadModal;