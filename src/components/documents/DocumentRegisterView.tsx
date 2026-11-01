import React, { useState } from 'react';
import {
  FileText,
  Upload,
  Plus,
  Search,
  Filter,
  Eye,
  ListPlus,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  FileCheck,
  Download,
  X,
  File,
} from 'lucide-react';
import {
  DocumentRecord,
  DocumentCategory,
  PrintingType,
  PaperSize,
  PriorityLevel,
  UserProfile,
  UserRole,
} from '../../types';
import {
  DEPARTMENTS,
  DOCUMENT_CATEGORIES,
  INITIAL_TEACHERS,
} from '../../config/constants';
import { googleDriveService, MAX_PDF_SIZE_BYTES } from '../../services/googleDriveService';
import { googleSheetsService } from '../../services/googleSheetsService';

interface DocumentRegisterProps {
  documents: DocumentRecord[];
  currentUser: UserProfile;
  onRefresh: () => void;
  onPreviewPdf: (url: string, title: string, id: string) => void;
  onAddToQueue: (docId: string, priority: PriorityLevel) => void;
  onShowMessage: (type: 'success' | 'error', text: string) => void;
}

export const DocumentRegisterView: React.FC<DocumentRegisterProps> = ({
  documents,
  currentUser,
  onRefresh,
  onPreviewPdf,
  onAddToQueue,
  onShowMessage,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State for new registration (17 required fields)
  const [teacherName, setTeacherName] = useState(
    currentUser.role === 'Teacher' ? currentUser.name : 'Mrs. Marcia Campbell'
  );
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentCategory, setDocumentCategory] = useState<DocumentCategory>('Class Quiz / Test');
  const [numberOfPages, setNumberOfPages] = useState<number>(4);
  const [numberOfCopies, setNumberOfCopies] = useState<number>(30);
  const [printingType, setPrintingType] = useState<PrintingType>('Black & White');
  const [duplexPrinting, setDuplexPrinting] = useState<boolean>(true);
  const [paperSize, setPaperSize] = useState<PaperSize>('Letter (8.5 x 11)');
  const [dateNeeded, setDateNeeded] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [priority, setPriority] = useState<PriorityLevel>('Normal');
  const [notes, setNotes] = useState('');

  // PDF File attachment state (Strictly mandatory <= 25MB)
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfValidationError, setPdfValidationError] = useState<string | null>(null);

  // Handle PDF file selection with instant 25MB & MIME validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = googleDriveService.validatePdfFile(file);
    if (!validation.valid) {
      setPdfValidationError(validation.error || 'Invalid PDF');
      setPdfFile(null);
    } else {
      setPdfValidationError(null);
      setPdfFile(file);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!documentTitle.trim()) {
      onShowMessage('error', 'Please provide a document title.');
      return;
    }

    if (!pdfFile) {
      setPdfValidationError('Requirement: Every registered document must have a PDF attachment.');
      onShowMessage('error', 'Every document must have a valid PDF attached before registration.');
      return;
    }

    // Duplicate Registration Prevention: verify no duplicate submission for same teacher today
    const todayStr = new Date().toISOString().split('T')[0];
    const isDuplicate = documents.some(
      (d) =>
        d.documentTitle.trim().toLowerCase() === documentTitle.trim().toLowerCase() &&
        d.teacherName.trim().toLowerCase() === teacherName.trim().toLowerCase() &&
        d.dateReceived === todayStr
    );
    if (isDuplicate) {
      onShowMessage(
        'error',
        `Duplicate Prevention: "${documentTitle}" for ${teacherName} was already registered today.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      // Server-side PDF validation check
      try {
        const srvRes = await fetch('/api/documents/validate-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: pdfFile.name,
            sizeBytes: pdfFile.size,
            mimeType: pdfFile.type,
          }),
        });
        const srvData = await srvRes.json();
        if (!srvData.valid) {
          throw new Error(srvData.error || 'Server validation failed');
        }
      } catch (valErr: any) {
        if (valErr.message && !valErr.message.includes('fetch')) {
          throw valErr;
        }
      }
      // 1. Upload to Google Drive archive folder
      const uploadRes = await googleDriveService.uploadPdf(pdfFile, documentTitle);

      // 2. Register document via Sheets Service
      const created = await googleSheetsService.registerDocument(
        {
          submittedBy: currentUser.email,
          teacherName,
          department,
          documentTitle,
          documentCategory,
          numberOfPages,
          numberOfCopies,
          printingType,
          duplexPrinting,
          paperSize,
          dateNeeded,
          priority,
          pdfAttachment: uploadRes.webViewLink,
          pdfFileId: uploadRes.fileId,
          notes,
        },
        currentUser
      );

      onShowMessage(
        'success',
        `Document ${created.documentId} registered successfully and archived in Google Drive!`
      );
      setIsRegisterModalOpen(false);
      resetForm();
      onRefresh();
    } catch (err: any) {
      onShowMessage('error', err.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setDocumentTitle('');
    setPdfFile(null);
    setPdfValidationError(null);
    setNotes('');
    setNumberOfPages(4);
    setNumberOfCopies(30);
  };

  // Filtered documents
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.documentTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.documentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.teacherName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = filterDepartment === 'ALL' || doc.department === filterDepartment;
    const matchesCategory = filterCategory === 'ALL' || doc.documentCategory === filterCategory;
    const matchesStatus = filterStatus === 'ALL' || doc.status === filterStatus;

    return matchesSearch && matchesDept && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-700 dark:text-blue-400" />
            <span>Document Register</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Official repository of all submitted exam papers, handouts, and curriculum materials.
          </p>
        </div>

        {currentUser.role !== 'Read-only Management' && (
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Document</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search title, ID, or teacher..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden"
            >
              <option value="ALL">All Departments</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden"
            >
              <option value="ALL">All Categories</option>
              {DOCUMENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden"
            >
              <option value="ALL">All Statuses</option>
              <option value="Registered">Registered</option>
              <option value="Pending Queue">Pending Queue</option>
              <option value="Queued">Queued</option>
              <option value="Printing">Printing</option>
              <option value="Completed">Completed</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Doc ID</th>
                <th className="px-4 py-3">Title & Category</th>
                <th className="px-4 py-3">Teacher & Dept</th>
                <th className="px-4 py-3">Volume</th>
                <th className="px-4 py-3">Format</th>
                <th className="px-4 py-3">Priority / Due</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No documents found matching the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr
                    key={doc.documentId}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                  >
                    <td className="px-4 py-3 font-mono font-bold text-blue-700 dark:text-blue-400 whitespace-nowrap">
                      {doc.documentId}
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 dark:text-white max-w-xs truncate">
                        {doc.documentTitle}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {doc.documentCategory}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {doc.teacherName}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                        {doc.department.split('(')[0].trim()}
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-bold text-slate-800 dark:text-white">
                        {doc.numberOfPages} pgs × {doc.numberOfCopies}
                      </span>
                      <div className="text-[10px] text-slate-400">
                        Total {doc.numberOfPages * doc.numberOfCopies} pages
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-slate-700 dark:text-slate-300">
                        {doc.printingType}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {doc.paperSize} • {doc.duplexPrinting ? 'Duplex' : 'Single-side'}
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          doc.priority === 'Urgent'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : doc.priority === 'High'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {doc.priority}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Due: {doc.dateNeeded || 'Standard'}
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          doc.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : doc.status === 'Delivered'
                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                            : doc.status === 'Queued' || doc.status === 'Printing'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : doc.status === 'Cancelled'
                            ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {doc.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* PDF View Modal Button */}
                        {doc.pdfAttachment && (
                          <button
                            onClick={() =>
                              onPreviewPdf(doc.pdfAttachment, doc.documentTitle, doc.documentId)
                            }
                            className="p-1.5 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition"
                            title="Preview PDF Document"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}

                        {/* Add to Queue Button */}
                        {currentUser.role !== 'Read-only Management' &&
                          doc.status !== 'Queued' &&
                          doc.status !== 'Printing' &&
                          doc.status !== 'Completed' &&
                          doc.status !== 'Delivered' && (
                            <button
                              onClick={() => onAddToQueue(doc.documentId, doc.priority)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] font-bold rounded-lg shadow-2xs transition"
                              title="Add to Printing Queue"
                            >
                              <ListPlus className="w-3.5 h-3.5" />
                              <span>Queue</span>
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registration Modal (17 Required Fields) */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Register School Document
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Auto-generates Document ID & archives PDF to Google Drive
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4">
              {/* Mandatory PDF Upload Box (Max 25MB) */}
              <div className="p-4 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-800">
                <div className="flex flex-col items-center justify-center text-center">
                  <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2" />
                  <label className="cursor-pointer">
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-400 hover:underline">
                      Click to upload PDF Document
                    </span>
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      required
                    />
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Requirement: PDF format only. Maximum upload size 25 MB.
                  </p>
                  {pdfFile && (
                    <div className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg text-xs font-medium text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      <FileCheck className="w-4 h-4" />
                      <span className="font-bold">{pdfFile.name}</span>
                      <span className="text-slate-400">
                        ({(pdfFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    </div>
                  )}
                  {pdfValidationError && (
                    <div className="mt-2 text-xs font-bold text-rose-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{pdfValidationError}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Document Title *
                  </label>
                  <input
                    type="text"
                    value={documentTitle}
                    onChange={(e) => setDocumentTitle(e.target.value)}
                    placeholder="e.g. Grade 11 Chemistry Paper 2 Mock Exam"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-600 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Document Category
                  </label>
                  <select
                    value={documentCategory}
                    onChange={(e) => setDocumentCategory(e.target.value as DocumentCategory)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                  >
                    {DOCUMENT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Teacher & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Teacher Name
                  </label>
                  <input
                    type="text"
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Volumes: Pages, Copies, Duplex */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Pages per Copy
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={numberOfPages}
                    onChange={(e) => setNumberOfPages(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Number of Copies
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={2000}
                    value={numberOfCopies}
                    onChange={(e) => setNumberOfCopies(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Duplex (Two-Sided)
                  </label>
                  <select
                    value={duplexPrinting ? 'true' : 'false'}
                    onChange={(e) => setDuplexPrinting(e.target.value === 'true')}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                  >
                    <option value="true">Yes (Double-Sided)</option>
                    <option value="false">No (Single-Sided)</option>
                  </select>
                </div>
              </div>

              {/* Format: Printing Type, Paper Size, Priority, Date Needed */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Color Mode
                  </label>
                  <select
                    value={printingType}
                    onChange={(e) => setPrintingType(e.target.value as PrintingType)}
                    className="w-full px-2 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                  >
                    <option value="Black & White">Black & White</option>
                    <option value="Full Color">Full Color</option>
                    <option value="Spot Color">Spot Color</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Paper Size
                  </label>
                  <select
                    value={paperSize}
                    onChange={(e) => setPaperSize(e.target.value as PaperSize)}
                    className="w-full px-2 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                  >
                    <option value="Letter (8.5 x 11)">Letter (8.5 x 11)</option>
                    <option value="Legal (8.5 x 14)">Legal (8.5 x 14)</option>
                    <option value="Tabloid (11 x 17)">Tabloid (11 x 17)</option>
                    <option value="A4">A4</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                    className="w-full px-2 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white font-bold"
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Date Needed
                  </label>
                  <input
                    type="date"
                    value={dateNeeded}
                    onChange={(e) => setDateNeeded(e.target.value)}
                    className="w-full px-2 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                  />
                </div>
              </div>

              {/* Special Instructions / Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Finishing Notes & Instructions
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Please staple top-left corner. Hole punch for 3-ring binder."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !pdfFile}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-blue-800 hover:bg-blue-900 text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Archiving to Drive & Registering...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4" />
                      <span>Complete Registration</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
