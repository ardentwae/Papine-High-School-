import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Banknote,
  Receipt,
  Calendar,
  Filter,
  DollarSign,
  TrendingUp,
  X,
} from 'lucide-react';
import { PaymentRecord, UserProfile } from '../../types';
import { storageService } from '../../services/storageService';
import { googleSheetsService } from '../../services/googleSheetsService';
import { reportGenerator } from '../../services/reportGenerator';

interface PrintingPaymentsProps {
  payments: PaymentRecord[];
  currentUser: UserProfile;
  onRefresh: () => void;
  onShowMessage: (type: 'success' | 'error', text: string) => void;
}

export const PrintingPaymentsView: React.FC<PrintingPaymentsProps> = ({
  payments,
  currentUser,
  onRefresh,
  onShowMessage,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);

  // Form State
  const [payerName, setPayerName] = useState('');
  const [payerType, setPayerType] = useState<PaymentRecord['payerType']>('Student');
  const [studentOrEmployeeId, setStudentOrEmployeeId] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentRecord['paymentMethod']>('Cash');
  const [amountChargedJMD, setAmountChargedJMD] = useState<number>(150);
  const [amountPaidJMD, setAmountPaidJMD] = useState<number>(150);
  const [notes, setNotes] = useState('');

  const totalCollectedJMD = payments.reduce((acc, p) => acc + (p.amountPaidJMD || 0), 0);
  const totalOutstandingJMD = payments.reduce((acc, p) => acc + (p.outstandingBalanceJMD || 0), 0);

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.payerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.paymentReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMethod = methodFilter === 'ALL' || p.paymentMethod === methodFilter;
    return matchesSearch && matchesMethod;
  });

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payerName.trim() || amountPaidJMD <= 0) {
      onShowMessage('error', 'Please provide payer name and a valid payment amount.');
      return;
    }

    const currentPayments = storageService.getPayments();
    const newId = `PAY-2026-${String(currentPayments.length + 1).padStart(4, '0')}`;
    const ref = `REC-${Date.now().toString().slice(-6)}`;
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
    const outstanding = Math.max(0, amountChargedJMD - amountPaidJMD);

    const newPayment: PaymentRecord = {
      paymentId: newId,
      paymentReference: ref,
      paymentDate: today,
      paymentTime: timeStr,
      payerName: payerName.trim(),
      payerType,
      studentOrEmployeeId: studentOrEmployeeId.trim() || undefined,
      description: description.trim() || 'Printing Services Fee',
      paymentMethod,
      amountChargedJMD,
      amountPaidJMD,
      outstandingBalanceJMD: outstanding,
      receivedBy: currentUser.name,
      notes,
    };

    const updated = [newPayment, ...currentPayments];
    storageService.setPayments(updated);

    await googleSheetsService.logAudit_(
      'Printing Payments',
      'Record Payment',
      newId,
      `Received JMD $${amountPaidJMD.toFixed(2)} via ${paymentMethod} from ${payerName} (Ref: ${ref})`,
      currentUser
    );

    onShowMessage('success', `Payment receipt ${ref} registered for ${payerName}!`);
    setIsAddPaymentModalOpen(false);
    resetForm();
    onRefresh();
  };

  const resetForm = () => {
    setPayerName('');
    setStudentOrEmployeeId('');
    setDescription('');
    setAmountChargedJMD(150);
    setAmountPaidJMD(150);
    setNotes('');
  };

  const handlePrintReceipt = (pay: PaymentRecord) => {
    reportGenerator.generateReceiptPdf({
      receiptRef: pay.paymentReference,
      date: `${pay.paymentDate} ${pay.paymentTime}`,
      studentName: pay.payerName,
      studentId: pay.studentOrEmployeeId || 'N/A',
      description: pay.description,
      pages: 1,
      copies: 1,
      rateJMD: pay.amountChargedJMD,
      amountPaidJMD: pay.amountPaidJMD,
      outstandingBalanceJMD: pay.outstandingBalanceJMD,
      cashierName: pay.receivedBy,
    });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-700 dark:text-blue-400" />
            <span>Printing Payments & Revenue Ledger</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Financial accounting in Jamaican Dollars (JMD), cash receipts, and audit reconciliation.
          </p>
        </div>

        {currentUser.role !== 'Read-only Management' && (
          <button
            onClick={() => setIsAddPaymentModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Payment</span>
          </button>
        )}
      </div>

      {/* Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Revenue Collected</span>
            <Banknote className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            JMD ${totalCollectedJMD.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Verified cash & card transactions</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Outstanding Balances</span>
            <CreditCard className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
            JMD ${totalOutstandingJMD.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Pending student clearance</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Receipts Issued</span>
            <Receipt className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {payments.length}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Audited financial records</p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center gap-3 justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by payer or receipt reference..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
            Method:
          </label>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
          >
            <option value="ALL">All Payment Methods</option>
            <option value="Cash">Cash</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="School Card">School Card</option>
            <option value="Cheque">Cheque</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Receipt Ref</th>
                <th className="px-4 py-3">Date & Time</th>
                <th className="px-4 py-3">Payer & Type</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Charged</th>
                <th className="px-4 py-3">Paid (JMD)</th>
                <th className="px-4 py-3">Balance</th>
                <th className="px-4 py-3 text-right">Receipt Slip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPayments.map((p) => (
                <tr
                  key={p.paymentId}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                >
                  <td className="px-4 py-3 font-mono font-bold text-blue-700 dark:text-blue-400 whitespace-nowrap">
                    {p.paymentReference}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap text-slate-500 dark:text-slate-400">
                    <div>{p.paymentDate}</div>
                    <div className="text-[10px]">{p.paymentTime}</div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {p.payerName}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {p.payerType} {p.studentOrEmployeeId ? `• ${p.studentOrEmployeeId}` : ''}
                    </div>
                  </td>

                  <td className="px-4 py-3 max-w-xs truncate text-slate-700 dark:text-slate-300">
                    {p.description}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                      {p.paymentMethod}
                    </span>
                  </td>

                  <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    ${p.amountChargedJMD.toFixed(2)}
                  </td>

                  <td className="px-4 py-3 font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    ${p.amountPaidJMD.toFixed(2)}
                  </td>

                  <td className="px-4 py-3 font-mono whitespace-nowrap">
                    {p.outstandingBalanceJMD > 0 ? (
                      <span className="font-bold text-rose-600 dark:text-rose-400">
                        ${p.outstandingBalanceJMD.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px] font-bold">CLEARED</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => handlePrintReceipt(p)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg text-xs font-semibold transition"
                      title="Download Official Receipt PDF"
                    >
                      <Receipt className="w-3.5 h-3.5 text-blue-600" />
                      <span>PDF Slip</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {isAddPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Record Printing Fee Payment
              </h3>
              <button
                onClick={() => setIsAddPaymentModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Payer Full Name *
                </label>
                <input
                  type="text"
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                  placeholder="e.g. Althea Robinson"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Payer Category
                  </label>
                  <select
                    value={payerType}
                    onChange={(e) => setPayerType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                  >
                    <option value="Student">Student</option>
                    <option value="Teacher / Staff">Teacher / Staff</option>
                    <option value="Department">Department</option>
                    <option value="External">External Visitor</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ID # (Optional)
                  </label>
                  <input
                    type="text"
                    value={studentOrEmployeeId}
                    onChange={(e) => setStudentOrEmployeeId(e.target.value)}
                    placeholder="e.g. PHS-2023-4820"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Service Details
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. History Project Printing & Binding"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Amount Charged
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={amountChargedJMD}
                    onChange={(e) => setAmountChargedJMD(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Amount Paid
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={amountPaidJMD}
                    onChange={(e) => setAmountPaidJMD(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="School Card">School Card</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddPaymentModalOpen(false)}
                  className="px-3 py-1.5 text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white font-bold rounded-lg shadow-xs"
                >
                  Issue Receipt & Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
