import React, { useState } from 'react';
import {
  GraduationCap,
  Plus,
  Search,
  CreditCard,
  Banknote,
  Receipt,
  FileCheck,
  AlertCircle,
  X,
} from 'lucide-react';
import { StudentPrintJob, UserProfile } from '../../types';
import { storageService } from '../../services/storageService';
import { googleSheetsService } from '../../services/googleSheetsService';
import { reportGenerator } from '../../services/reportGenerator';

interface StudentPrintingProps {
  jobs: StudentPrintJob[];
  currentUser: UserProfile;
  onRefresh: () => void;
  onShowMessage: (type: 'success' | 'error', text: string) => void;
  onOpenPaymentForJob?: (job: StudentPrintJob) => void;
}

export const StudentPrintingView: React.FC<StudentPrintingProps> = ({
  jobs,
  currentUser,
  onRefresh,
  onShowMessage,
  onOpenPaymentForJob,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL');

  const [isNewJobModalOpen, setIsNewJobModalOpen] = useState(false);

  // Form State
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [grade, setGrade] = useState('Grade 11');
  const [schoolClass, setSchoolClass] = useState('11-Sci-1');
  const [description, setDescription] = useState('');
  const [pagesPrinted, setPagesPrinted] = useState<number>(5);
  const [copies, setCopies] = useState<number>(1);
  const [ratePerPageJMD, setRatePerPageJMD] = useState<number>(15); // Standard JMD rate
  const [amountPaidJMD, setAmountPaidJMD] = useState<number>(75);
  const [notes, setNotes] = useState('');

  const totalPages = pagesPrinted * copies;
  const totalCharge = totalPages * ratePerPageJMD;
  const outstanding = Math.max(0, totalCharge - amountPaidJMD);

  const filteredJobs = jobs.filter((j) => {
    const matchesSearch =
      j.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = gradeFilter === 'ALL' || j.grade === gradeFilter;
    const matchesStatus = paymentStatusFilter === 'ALL' || j.paymentStatus === paymentStatusFilter;
    return matchesSearch && matchesGrade && matchesStatus;
  });

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !studentId.trim() || !description.trim()) {
      onShowMessage('error', 'Please fill in student name, student ID, and description.');
      return;
    }

    const currentJobs = storageService.getStudentJobs();
    const newJobId = `STU-2026-${String(currentJobs.length + 1).padStart(3, '0')}`;
    const receiptRef = `REC-${Date.now().toString().slice(-6)}`;
    const today = new Date().toISOString().split('T')[0];

    const newJob: StudentPrintJob = {
      jobId: newJobId,
      studentId: studentId.trim(),
      studentName: studentName.trim(),
      grade,
      schoolClass,
      requestDate: today,
      description: description.trim(),
      pagesPrinted,
      copies,
      totalPageCount: totalPages,
      ratePerPageJMD,
      totalChargeJMD: totalCharge,
      amountPaidJMD,
      outstandingBalanceJMD: outstanding,
      paymentStatus: outstanding === 0 ? 'Paid' : amountPaidJMD > 0 ? 'Partial' : 'Unpaid',
      receiptReference: receiptRef,
      notes,
    };

    const updated = [newJob, ...currentJobs];
    storageService.setStudentJobs(updated);

    // If payment was collected, automatically record into Payments tab as well!
    if (amountPaidJMD > 0) {
      const currentPayments = storageService.getPayments();
      const newPayId = `PAY-2026-${String(currentPayments.length + 1).padStart(4, '0')}`;
      const newPayment = {
        paymentId: newPayId,
        paymentReference: receiptRef,
        paymentDate: today,
        paymentTime: new Date().toLocaleTimeString('en-US', { hour12: false }),
        payerName: studentName,
        payerType: 'Student' as const,
        studentOrEmployeeId: studentId,
        linkedJobId: newJobId,
        description: `Student Print: ${description}`,
        paymentMethod: 'Cash' as const,
        amountChargedJMD: totalCharge,
        amountPaidJMD: amountPaidJMD,
        outstandingBalanceJMD: outstanding,
        receivedBy: currentUser.name,
      };
      storageService.setPayments([newPayment, ...currentPayments]);
    }

    await googleSheetsService.logAudit_(
      'Student Printing',
      'Create Student Job',
      newJobId,
      `Student print job for ${studentName} (${totalPages} pgs, JMD $${totalCharge}, Paid: JMD $${amountPaidJMD})`,
      currentUser
    );

    onShowMessage('success', `Student printing transaction ${newJobId} recorded!`);
    setIsNewJobModalOpen(false);
    resetForm();
    onRefresh();
  };

  const resetForm = () => {
    setStudentId('');
    setStudentName('');
    setDescription('');
    setPagesPrinted(5);
    setCopies(1);
    setAmountPaidJMD(75);
    setNotes('');
  };

  const handlePrintReceipt = (job: StudentPrintJob) => {
    reportGenerator.generateReceiptPdf({
      receiptRef: job.receiptReference || `REC-${job.jobId}`,
      date: job.requestDate,
      studentName: job.studentName,
      studentId: job.studentId,
      description: job.description,
      pages: job.pagesPrinted,
      copies: job.copies,
      rateJMD: job.ratePerPageJMD,
      amountPaidJMD: job.amountPaidJMD,
      outstandingBalanceJMD: job.outstandingBalanceJMD,
      cashierName: currentUser.name,
    });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-700 dark:text-blue-400" />
            <span>Student Printing Services (JMD)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track student coursework printings, SBA portfolios, JMD cash payments, and outstanding balances.
          </p>
        </div>

        {currentUser.role !== 'Read-only Management' && (
          <button
            onClick={() => setIsNewJobModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Student Print Job</span>
          </button>
        )}
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student name, ID or description..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white focus:outline-hidden"
          />
        </div>

        <div>
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
          >
            <option value="ALL">All Grades</option>
            {['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'Grade 13'].map(
              (g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              )
            )}
          </select>
        </div>

        <div>
          <select
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="Paid">Paid in Full</option>
            <option value="Partial">Partial Payment</option>
            <option value="Unpaid">Unpaid Balance</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Job ID & Date</th>
                <th className="px-4 py-3">Student Name & ID</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Pages & Rate</th>
                <th className="px-4 py-3">Total Charged</th>
                <th className="px-4 py-3">Paid / Outstanding</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    No student print transactions recorded.
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => (
                  <tr
                    key={job.jobId}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                  >
                    <td className="px-4 py-3 font-mono">
                      <div className="font-bold text-blue-700 dark:text-blue-400">
                        {job.jobId}
                      </div>
                      <div className="text-[10px] text-slate-400">{job.requestDate}</div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {job.studentName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {job.studentId}
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {job.grade}
                      </div>
                      <div className="text-[10px] text-slate-400">{job.schoolClass}</div>
                    </td>

                    <td className="px-4 py-3 max-w-xs truncate text-slate-700 dark:text-slate-300">
                      {job.description}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {job.totalPageCount} pages
                      </div>
                      <div className="text-[10px] text-slate-400">
                        @ JMD ${job.ratePerPageJMD.toFixed(2)}/pg
                      </div>
                    </td>

                    <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      JMD ${job.totalChargeJMD.toFixed(2)}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        Paid: ${job.amountPaidJMD.toFixed(2)}
                      </div>
                      {job.outstandingBalanceJMD > 0 && (
                        <div className="font-mono text-rose-600 dark:text-rose-400 font-bold text-[11px]">
                          Due: ${job.outstandingBalanceJMD.toFixed(2)}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          job.paymentStatus === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : job.paymentStatus === 'Partial'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {job.paymentStatus}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => handlePrintReceipt(job)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg text-xs font-semibold transition"
                        title="Download / Print Receipt PDF"
                      >
                        <Receipt className="w-3.5 h-3.5 text-blue-600" />
                        <span>Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Student Job Modal */}
      {isNewJobModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-700 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Record Student Printing Request
                </h3>
              </div>
              <button
                onClick={() => setIsNewJobModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Student Full Name *
                  </label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="e.g. Shanique Wright"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Student School ID # *
                  </label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="e.g. PHS-2023-9912"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Grade
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                  >
                    {['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'Grade 13'].map(
                      (g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Class / Homeroom
                  </label>
                  <input
                    type="text"
                    value={schoolClass}
                    onChange={(e) => setSchoolClass(e.target.value)}
                    placeholder="e.g. 11-Arts-1"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Document Description *
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. CSEC English Literature Portfolio Project"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                  required
                />
              </div>

              {/* Volume and Rates */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Pages
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={pagesPrinted}
                    onChange={(e) => setPagesPrinted(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Copies
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={copies}
                    onChange={(e) => setCopies(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Rate / Page (JMD)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={ratePerPageJMD}
                    onChange={(e) => setRatePerPageJMD(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Charge Summary Box */}
              <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-slate-500 text-[11px]">Total Charges:</span>
                  <div className="text-base font-bold text-slate-900 dark:text-white font-mono">
                    JMD ${totalCharge.toFixed(2)}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px]">Total Page Volume:</span>
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    {totalPages} pages
                  </div>
                </div>
              </div>

              {/* Payment collected */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Amount Collected Now (JMD $)
                </label>
                <input
                  type="number"
                  min={0}
                  max={totalCharge}
                  value={amountPaidJMD}
                  onChange={(e) => setAmountPaidJMD(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white font-mono font-bold"
                />
                {outstanding > 0 && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                    Will record outstanding balance of JMD ${outstanding.toFixed(2)}.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewJobModalOpen(false)}
                  className="px-3 py-1.5 text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white font-bold rounded-lg shadow-xs"
                >
                  Save & Record Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
