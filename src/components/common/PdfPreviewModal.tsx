import React from 'react';
import { X, ExternalLink, Download, FileText } from 'lucide-react';

interface PdfPreviewModalProps {
  isOpen: boolean;
  title: string;
  pdfUrl: string;
  documentId?: string;
  onClose: () => void;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  isOpen,
  title,
  pdfUrl,
  documentId,
  onClose,
}) => {
  if (!isOpen || !pdfUrl) return null;

  const isGoogleDriveLink = pdfUrl.includes('drive.google.com');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-4xl h-[88vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-700/50 rounded-lg text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-blue-900 text-amber-300">
                  {documentId || 'PDF PREVIEW'}
                </span>
                <h3 className="text-sm md:text-base font-bold text-white truncate max-w-md">
                  {title}
                </h3>
              </div>
              <p className="text-xs text-slate-400">Papine High School Print Repository</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in New Tab</span>
            </a>
            <a
              href={pdfUrl}
              download={`${documentId || 'document'}.pdf`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 ml-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Close PDF preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewer Body */}
        <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-2 overflow-hidden flex flex-col items-center justify-center">
          {pdfUrl.startsWith('blob:') || pdfUrl.endsWith('.pdf') ? (
            <iframe
              src={pdfUrl}
              title={title}
              className="w-full h-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white"
            />
          ) : isGoogleDriveLink ? (
            <div className="flex flex-col items-center text-center p-8 max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/50 rounded-2xl text-blue-700 dark:text-blue-400 mb-4">
                <FileText className="w-12 h-12" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Google Drive Stored Document
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                This PDF is secured in the official Papine High School Drive archive folder. Click below to view the original file with Google Drive's built-in PDF reader.
              </p>
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-800 hover:bg-blue-900 text-white font-semibold rounded-lg shadow-xs transition"
              >
                <ExternalLink className="w-4 h-4" />
                View Document in Google Drive
              </a>
            </div>
          ) : (
            <iframe
              src={pdfUrl}
              title={title}
              className="w-full h-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white"
            />
          )}
        </div>
      </div>
    </div>
  );
};
