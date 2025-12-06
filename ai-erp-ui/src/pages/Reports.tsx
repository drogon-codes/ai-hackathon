import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog } from '@headlessui/react';
import { jsPDF } from 'jspdf';
import { 
  FileText, 
  Download, 
  Eye, 
  Loader2, 
  RefreshCw, 
  FileImage,
  FileSpreadsheet,
  FileCog,
  Calendar,
  HardDrive,
  CheckCircle,
  AlertCircle,
  Search,
  X,
  ZoomIn,
  ZoomOut,
  File
} from 'lucide-react';
import { cn } from '../utils/cn';
import { listReports, downloadVisualization, getVisualizationUrl, ReportFile } from '../services/api';

const Reports: React.FC = () => {
  const [reports, setReports] = useState<ReportFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [previewFile, setPreviewFile] = useState<ReportFile | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await listReports();
      setReports(response.reports || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reports');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (filename: string) => {
    setDownloadingFile(filename);
    try {
      const blob = await downloadVisualization(filename);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(`Failed to download file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setDownloadingFile(null);
    }
  };

  const handleView = async (report: ReportFile) => {
    setPreviewFile(report);
    setLoadingPreview(true);
    setPreviewContent(null);
    setImageZoom(1);

    try {
      // For images, just use the URL
      if (['png', 'jpg', 'jpeg', 'svg', 'gif', 'webp'].includes(report.type)) {
        setPreviewContent(getVisualizationUrl(report.name));
        setLoadingPreview(false);
        return;
      }

      // For text-based files, fetch content
      if (['txt', 'json', 'yaml', 'yml', 'csv', 'md', 'log'].includes(report.type)) {
        if (report.type === 'html') {
          // For HTML files, set a special flag to render in iframe
          setPreviewContent('html_content');
        } else {
          const blob = await downloadVisualization(report.name);
          const text = await blob.text();
          setPreviewContent(text);
        }
        setLoadingPreview(false);
        return;
      }

      // For PDFs and other files, open in new tab
      if (['pdf', 'doc', 'docx', 'xlsx', 'xls'].includes(report.type)) {
        window.open(getVisualizationUrl(report.name), '_blank');
        setPreviewFile(null);
        return;
      }

      // Default: just show download option
      setPreviewContent('preview_not_supported');
      setLoadingPreview(false);
    } catch (err) {
      alert(`Failed to preview file: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setPreviewFile(null);
    }
  };

  const closePreview = () => {
    setPreviewFile(null);
    setPreviewContent(null);
    setImageZoom(1);
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'svg':
      case 'gif':
      case 'webp':
        return FileImage;
      case 'csv':
      case 'xlsx':
      case 'xls':
        return FileSpreadsheet;
      case 'json':
      case 'yaml':
      case 'yml':
        return FileCog;
      case 'pdf':
      case 'doc':
      case 'docx':
        return FileText;
      case 'txt':
      case 'md':
      case 'log':
        return File;
      default:
        return FileText;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredReports = filterType === 'all' 
    ? reports 
    : reports.filter(r => r.type === filterType);

  const searchedReports = searchQuery.trim()
    ? filteredReports.filter(r => 
        r.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredReports;

  const fileTypes = ['all', ...Array.from(new Set(reports.map(r => r.type)))];

  const exportToPdf = () => {
    // Create a new PDF document
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text('File Export Report', 14, 22);
    
    // Add date
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 32);
    
    // Add filter info
    doc.text(`Filter: ${filterType === 'all' ? 'All Files' : `Type: ${filterType}`}`, 14, 42);
    
    // Add files list
    doc.setFontSize(10);
    doc.setDrawColor(200, 200, 200);
    
    // Table headers
    doc.setFont('helvetica', 'bold');
    doc.text('Name', 14, 60);
    doc.text('Type', 100, 60);
    doc.text('Size', 150, 60);
    doc.text('Created', 180, 60);
    doc.line(14, 62, 200, 62);
    
    // Table rows
    doc.setFont('helvetica', 'normal');
    let y = 70;
    const pageHeight = doc.internal.pageSize.height - 20;
    
    filteredReports.forEach((file, index) => {
      // Add new page if needed
      if (y > pageHeight) {
        doc.addPage();
        y = 20;
      }
      
      doc.text(file.name, 14, y);
      doc.text(file.type, 100, y);
      doc.text(formatFileSize(file.size), 150, y);
      doc.text(new Date(file.created).toLocaleDateString(), 180, y);
      
      // Add a line between rows
      if (index < filteredReports.length - 1) {
        doc.line(14, y + 5, 200, y + 5);
      }
      
      y += 10;
    });
    
    // Save the PDF
    doc.save(`file_export_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const renderPreviewContent = () => {
      if (loadingPreview) {
        return (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Loader2 className="h-12 w-12 text-cyan-400 animate-spin mb-4" />
            <p className="text-slate-300">Loading preview...</p>
          </div>
        );
      }

      if (!previewContent) return null;

      if (previewContent === 'preview_not_supported') {
        return (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="h-16 w-16 text-amber-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Preview Not Available</h3>
            <p className="text-slate-300 mb-6 max-w-md">
              We can't display a preview for this file type. You can still download the file to view it.
            </p>
          </div>
        );
      }

      // HTML content preview
      if (previewFile?.type === 'html' || previewContent === 'html_content') {
        return (
          <div className="w-full h-full flex items-center justify-center">
            <iframe
              src={previewFile ? getVisualizationUrl(previewFile.name) : ''}
              className="w-full h-[80vh] border-0 rounded-lg bg-white"
              title="HTML Preview"
              sandbox="allow-same-origin allow-scripts"
              style={{ minWidth: '800px' }}
            />
          </div>
        );
      }

      // Image preview
      if (previewFile && ['png', 'jpg', 'jpeg', 'svg', 'gif', 'webp'].includes(previewFile.type)) {
        return (
          <div className="flex justify-center items-center h-full">
            <img
              src={previewFile ? getVisualizationUrl(previewFile.name) : ''}
              alt="Preview"
              className="max-w-full max-h-[80vh] object-contain"
            />
          </div>
        );
      }

      // Text content preview
      return (
        <div className="w-full h-full">
          <pre className="whitespace-pre-wrap break-words p-4 bg-slate-800 text-slate-100 rounded-lg overflow-auto max-h-[80vh]">
            {previewContent}
          </pre>
        </div>
      );
    };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <FileText className="h-8 w-8 text-cyan-400" />
                <h1 className="text-3xl font-bold text-white">Reports & Visualizations</h1>
              </div>
              <p className="text-slate-400">Browse and download generated reports and visualizations</p>
            </div>
            <button
              onClick={fetchReports}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              <span>Refresh</span>
            </button>
          </div>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 space-y-4"
        >
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-700 rounded transition-colors"
              >
                <X className="h-4 w-4 text-slate-400" />
              </button>
            )}
          </div>

          {/* File Type Filters and Export */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {fileTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={cn(
                    "px-4 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap",
                    filterType === type
                      ? "bg-cyan-600 text-white"
                      : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50"
                  )}
                >
                  {type === 'all' ? 'All Files' : `.${type}`}
                </button>
              ))}
            </div>
            <button
              onClick={exportToPdf}
              className="ml-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              <Download className="h-4 w-4" />
              <span>Export to PDF</span>
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6"
        >
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Files</p>
                <p className="text-3xl font-bold text-white mt-1">{reports.length}</p>
              </div>
              <FileText className="h-10 w-10 text-cyan-400" />
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Size</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {formatFileSize(reports.reduce((sum, r) => sum + r.size, 0))}
                </p>
              </div>
              <HardDrive className="h-10 w-10 text-green-400" />
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">File Types</p>
                <p className="text-3xl font-bold text-white mt-1">{fileTypes.length - 1}</p>
              </div>
              <FileCog className="h-10 w-10 text-yellow-400" />
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-500/10 border border-red-500/50 rounded-xl p-6 mb-6"
          >
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-6 w-6 text-red-400" />
              <div>
                <p className="text-red-400 font-semibold">Error Loading Reports</p>
                <p className="text-red-300 text-sm mt-1">{error}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!isLoading && !error && reports.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-12 border border-slate-700 text-center"
          >
            <FileText className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Reports Available</h3>
            <p className="text-slate-400">
              Run an analysis to generate reports and visualizations
            </p>
          </motion.div>
        )}

        {/* Reports Grid */}
        {!isLoading && !error && searchedReports.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {searchedReports.map((report, index) => {
                const FileIcon = getFileIcon(report.type);
                return (
                  <motion.div
                    key={report.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 hover:border-cyan-500/50 transition-all duration-200 overflow-hidden group"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-cyan-500/10 rounded-lg">
                          <FileIcon className="h-6 w-6 text-cyan-400" />
                        </div>
                        <span className="px-2 py-1 text-xs font-medium bg-slate-700 text-slate-300 rounded">
                          .{report.type}
                        </span>
                      </div>
                      <h3 className="text-white font-semibold mb-2 truncate" title={report.name}>
                        {report.name}
                      </h3>
                      <div className="space-y-2 text-sm text-slate-400">
                        <div className="flex items-center space-x-2">
                          <HardDrive className="h-4 w-4" />
                          <span>{formatFileSize(report.size)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(report.created)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="px-6 pb-6 flex space-x-2">
                      <button
                        onClick={() => handleView(report)}
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all duration-200"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => handleDownload(report.name)}
                        disabled={downloadingFile === report.name}
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50"
                      >
                        {downloadingFile === report.name ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Downloading...</span>
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4" />
                            <span>Download</span>
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}

        {/* No Search Results */}
        {!isLoading && !error && searchQuery && searchedReports.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-12 border border-slate-700 text-center"
          >
            <Search className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No files found</h3>
            <p className="text-slate-400 mb-4">
              No files match "{searchQuery}"
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
            >
              Clear Search
            </button>
          </motion.div>
        )}

        {/* Preview Modal */}
        <AnimatePresence mode="wait">
            <Dialog
              open={!!previewFile}
              onClose={closePreview}
              className="relative z-50"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm"
                aria-hidden="true"
              />
              <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel as="div">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{
                      type: "spring",
                      damping: 25,
                      stiffness: 400,
                      bounce: 0.2
                    }}
                    className="w-full max-w-6xl rounded-xl bg-slate-800 border border-slate-700 shadow-2xl flex flex-col max-h-[90vh]"
                >
                  {/* Modal Header */}
                  <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/95 backdrop-blur-sm flex-shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-cyan-500/10 rounded-lg">
                        {previewFile && React.createElement(getFileIcon(previewFile.type), { className: "h-5 w-5 text-cyan-400" })}
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{previewFile?.name}</h3>
                        <p className="text-sm text-slate-400">
                          {previewFile && `${formatFileSize(previewFile.size)} • ${formatDate(previewFile.created)}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => previewFile && handleDownload(previewFile.name)}
                        className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download</span>
                      </button>
                      <button
                        onClick={closePreview}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <X className="h-5 w-5 text-slate-400" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Preview Content */}
                  <div className="flex-1 overflow-auto p-6 bg-slate-900">
                    <div className="flex items-center justify-center min-h-[60vh]">
                      {renderPreviewContent()}
                    </div>
                  </div>
                  </motion.div>
                </Dialog.Panel>
              </div>
            </Dialog>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Reports;