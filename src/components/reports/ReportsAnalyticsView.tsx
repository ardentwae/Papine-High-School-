import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
  Filter,
  CheckCircle2,
  Printer,
  Users,
  GraduationCap,
  CreditCard,
  Package,
  Wrench,
  History,
} from 'lucide-react';
import { reportGenerator } from '../../services/reportGenerator';
import { storageService } from '../../services/storageService';
import { SCHOOL_INFO } from '../../config/constants';

interface ReportOption {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'Documents' | 'Academics' | 'Finance' | 'Hardware' | 'Governance';
  generateData: () => {
    headers: string[];
    rows: (string | number)[][];
    summaryNotes?: string[];
  };
}

export const ReportsAnalyticsView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const reportDefinitions: ReportOption[] = [
    {
      id: 'doc-reg',
      title: 'Document Registrations Report',
      description: 'Complete inventory of all examination papers, student handouts, and curriculum files.',
      icon: FileText,
      category: 'Documents',
      generateData: () => {
        const docs = storageService.getDocuments();
        const headers = [
          'Document ID',
          'Date Received',
          'Teacher',
          'Department',
          'Title',
          'Category',
          'Pages',
          'Copies',
          'Total Pages',
          'Priority',
          'Status',
        ];
        const rows = docs.map((d) => [
          d.documentId,
          d.dateReceived,
          d.teacherName,
          d.department.split('(')[0].trim(),
          d.documentTitle,
          d.documentCategory,
          d.numberOfPages,
          d.numberOfCopies,
          d.numberOfPages * d.numberOfCopies,
          d.priority,
          d.status,
        ]);
        const summaryNotes = [
          `Total Registered Documents: ${docs.length}`,
          `Completed Documents: ${docs.filter((d) => d.status === 'Completed' || d.status === 'Delivered').length}`,
        ];
        return { headers, rows, summaryNotes };
      },
    },
    {
      id: 'print-queue',
      title: 'Printing Queue Performance Report',
      description: 'Active and completed printing jobs with turnaround times and sheet counts.',
      icon: Printer,
      category: 'Documents',
      generateData: () => {
        const queue = storageService.getQueue();
        const headers = [
          'Queue ID',
          'Pos',
          'Doc ID',
          'Title',
          'Teacher',
          'Total Sheets',
          'Printer',
          'Priority',
          'Status',
          'Added Date',
        ];
        const rows = queue.map((q) => [
          q.queueId,
          q.position,
          q.documentId,
          q.documentTitle,
          q.teacherName,
          q.totalSheets,
          q.assignedPrinterName || 'N/A',
          q.priority,
          q.status,
          `${q.dateAdded} ${q.timeAdded}`,
        ]);
        const summaryNotes = [
          `Total Queue Items: ${queue.length}`,
          `Pending Jobs: ${queue.filter((q) => q.status === 'Pending').length}`,
          `Printing Jobs: ${queue.filter((q) => q.status === 'Printing').length}`,
        ];
        return { headers, rows, summaryNotes };
      },
    },
    {
      id: 'teacher-allowance',
      title: 'Teacher Allowance & Quota Usage',
      description: 'Allocated paper quotas, pages printed, remaining balances, and threshold alerts.',
      icon: Users,
      category: 'Academics',
      generateData: () => {
        const teachers = storageService.getTeachers();
        const headers = [
          'Teacher ID',
          'Name',
          'Department',
          'Status',
          'Quota Allocated',
          'Tokens Used',
          'Remaining Balance',
          'Alert Status',
        ];
        const rows = teachers.map((t) => [
          t.teacherId,
          t.teacherName,
          t.department.split('(')[0].trim(),
          t.status,
          t.tokenAllocation,
          t.tokensUsed,
          t.remainingBalance,
          t.remainingBalance <= t.warningThreshold ? 'LOW QUOTA ALERT' : 'Normal',
        ]);
        const totalAlloc = teachers.reduce((acc, t) => acc + t.tokenAllocation, 0);
        const totalUsed = teachers.reduce((acc, t) => acc + t.tokensUsed, 0);
        const summaryNotes = [
          `Total Allowance Pool: ${totalAlloc.toLocaleString()} pages`,
          `Total Pages Printed: ${totalUsed.toLocaleString()} pages (${Math.round((totalUsed / (totalAlloc || 1)) * 100)}%)`,
          `Teachers Approaching Limit: ${teachers.filter((t) => t.remainingBalance <= t.warningThreshold).length}`,
        ];
        return { headers, rows, summaryNotes };
      },
    },
    {
      id: 'student-printing',
      title: 'Student Printing Services Report',
      description: 'Coursework print jobs, page rates, and collection status in Jamaican Dollars.',
      icon: GraduationCap,
      category: 'Finance',
      generateData: () => {
        const jobs = storageService.getStudentJobs();
        const headers = [
          'Job ID',
          'Date',
          'Student Name',
          'Student ID',
          'Grade',
          'Class',
          'Pages',
          'Charge (JMD)',
          'Paid (JMD)',
          'Balance (JMD)',
          'Status',
        ];
        const rows = jobs.map((j) => [
          j.jobId,
          j.requestDate,
          j.studentName,
          j.studentId,
          j.grade,
          j.schoolClass,
          j.totalPageCount,
          `$${j.totalChargeJMD.toFixed(2)}`,
          `$${j.amountPaidJMD.toFixed(2)}`,
          `$${j.outstandingBalanceJMD.toFixed(2)}`,
          j.paymentStatus,
        ]);
        const totalCharge = jobs.reduce((acc, j) => acc + j.totalChargeJMD, 0);
        const totalPaid = jobs.reduce((acc, j) => acc + j.amountPaidJMD, 0);
        const summaryNotes = [
          `Total Student Jobs: ${jobs.length}`,
          `Total Billed: JMD $${totalCharge.toFixed(2)}`,
          `Total Collected: JMD $${totalPaid.toFixed(2)}`,
        ];
        return { headers, rows, summaryNotes };
      },
    },
    {
      id: 'student-payments',
      title: 'Printing Revenue & Payments Ledger',
      description: 'Audit of all cash, card, and bank receipts issued for student and staff printing.',
      icon: CreditCard,
      category: 'Finance',
      generateData: () => {
        const payments = storageService.getPayments();
        const headers = [
          'Receipt Ref',
          'Date',
          'Payer Name',
          'Category',
          'Description',
          'Method',
          'Amount Paid (JMD)',
          'Outstanding (JMD)',
          'Cashier',
        ];
        const rows = payments.map((p) => [
          p.paymentReference,
          `${p.paymentDate} ${p.paymentTime}`,
          p.payerName,
          p.payerType,
          p.description,
          p.paymentMethod,
          `$${p.amountPaidJMD.toFixed(2)}`,
          `$${p.outstandingBalanceJMD.toFixed(2)}`,
          p.receivedBy,
        ]);
        const totalRev = payments.reduce((acc, p) => acc + p.amountPaidJMD, 0);
        const summaryNotes = [
          `Total Receipts Issued: ${payments.length}`,
          `Total Revenue: JMD $${totalRev.toFixed(2)}`,
        ];
        return { headers, rows, summaryNotes };
      },
    },
    {
      id: 'outstanding-balances',
      title: 'Outstanding Student Balances Statement',
      description: 'Unpaid coursework printing balances requiring bursar clearance.',
      icon: CreditCard,
      category: 'Finance',
      generateData: () => {
        const jobs = storageService.getStudentJobs().filter((j) => j.outstandingBalanceJMD > 0);
        const headers = [
          'Job ID',
          'Date',
          'Student Name',
          'Student ID',
          'Grade',
          'Description',
          'Outstanding Balance (JMD)',
        ];
        const rows = jobs.map((j) => [
          j.jobId,
          j.requestDate,
          j.studentName,
          j.studentId,
          j.grade,
          j.description,
          `$${j.outstandingBalanceJMD.toFixed(2)}`,
        ]);
        const totalDue = jobs.reduce((acc, j) => acc + j.outstandingBalanceJMD, 0);
        const summaryNotes = [
          `Students with Outstanding Balances: ${jobs.length}`,
          `Total Amount Outstanding: JMD $${totalDue.toFixed(2)}`,
        ];
        return { headers, rows, summaryNotes };
      },
    },
    {
      id: 'printer-performance',
      title: 'Printer Fleet Performance & Meter Counts',
      description: 'Hardware installation details, operational status, and lifetime printed page counters.',
      icon: Printer,
      category: 'Hardware',
      generateData: () => {
        const printers = storageService.getPrinters();
        const headers = [
          'Printer ID',
          'Name',
          'Manufacturer',
          'Model',
          'Serial Number',
          'Location',
          'Status',
          'Total Pages Printed',
        ];
        const rows = printers.map((p) => [
          p.printerId,
          p.printerName,
          p.manufacturer,
          p.model,
          p.serialNumber,
          p.location,
          p.status,
          p.totalPrintedPages.toLocaleString(),
        ]);
        const totalSheets = printers.reduce((acc, p) => acc + p.totalPrintedPages, 0);
        const summaryNotes = [
          `Total Fleet Devices: ${printers.length}`,
          `Operational Devices: ${printers.filter((p) => p.status === 'Operational').length}`,
          `Fleet Cumulative Sheets Printed: ${totalSheets.toLocaleString()}`,
        ];
        return { headers, rows, summaryNotes };
      },
    },
    {
      id: 'toner-usage',
      title: 'Toner & Consumables Inventory Status',
      description: 'Cartridge stock levels, units received, units issued, and reorder warnings.',
      icon: Package,
      category: 'Hardware',
      generateData: () => {
        const cartridges = storageService.getCartridges();
        const headers = [
          'Cartridge ID',
          'Model',
          'Color',
          'Compatible Printers',
          'Current Stock',
          'Threshold',
          'Status',
          'Unit Cost (JMD)',
        ];
        const rows = cartridges.map((c) => [
          c.cartridgeId,
          c.modelNumber,
          c.color,
          c.compatiblePrinters,
          c.currentStock,
          c.reorderThreshold,
          c.stockStatus,
          `$${c.unitCostJMD.toLocaleString()}`,
        ]);
        const lowStockCount = cartridges.filter((c) => c.currentStock <= c.reorderThreshold).length;
        const summaryNotes = [
          `Consumable SKUs: ${cartridges.length}`,
          `SKUs At or Below Reorder Threshold: ${lowStockCount}`,
        ];
        return { headers, rows, summaryNotes };
      },
    },
    {
      id: 'maintenance-expenditure',
      title: 'Maintenance Log & Service Expenditure',
      description: 'Breakdown of service calls, technicians, replaced parts, and costs in JMD.',
      icon: Wrench,
      category: 'Hardware',
      generateData: () => {
        const records = storageService.getMaintenance();
        const headers = [
          'Log ID',
          'Date',
          'Printer',
          'Fault Description',
          'Technician',
          'Cost (JMD)',
          'Parts Replaced',
          'Status',
        ];
        const rows = records.map((m) => [
          m.logId,
          m.maintenanceDate,
          m.printerName,
          m.faultDescription,
          m.technician,
          `$${m.costJMD.toFixed(2)}`,
          m.partsReplaced,
          m.maintenanceStatus,
        ]);
        const totalCost = records.reduce((acc, m) => acc + m.costJMD, 0);
        const summaryNotes = [
          `Total Maintenance Calls: ${records.length}`,
          `Total Expenditure: JMD $${totalCost.toFixed(2)}`,
        ];
        return { headers, rows, summaryNotes };
      },
    },
    {
      id: 'audit-activities',
      title: 'Administrative Security & Audit Log',
      description: 'Official tamper-evident audit trail of system transactions and role activities.',
      icon: History,
      category: 'Governance',
      generateData: () => {
        const logs = storageService.getAuditLogs();
        const headers = [
          'Audit ID',
          'Timestamp',
          'User Name',
          'Email',
          'Role',
          'Module',
          'Action',
          'Record ID',
          'Details',
        ];
        const rows = logs.map((l) => [
          l.auditId,
          l.timestamp,
          l.userName,
          l.userEmail,
          l.userRole,
          l.module,
          l.action,
          l.recordId,
          l.details,
        ]);
        const summaryNotes = [`Total Logged Audit Events: ${logs.length}`];
        return { headers, rows, summaryNotes };
      },
    },
  ];

  const filteredReports =
    selectedCategory === 'ALL'
      ? reportDefinitions
      : reportDefinitions.filter((r) => r.category === selectedCategory);

  const handleDownloadPdf = (report: ReportOption) => {
    const { headers, rows, summaryNotes } = report.generateData();
    reportGenerator.exportToPdf({
      title: report.title,
      subtitle: report.description,
      filename: `PHS-${report.id}-${new Date().toISOString().split('T')[0]}`,
      headers,
      rows,
      summaryNotes,
    });
  };

  const handleDownloadCsv = (report: ReportOption) => {
    const { headers, rows } = report.generateData();
    reportGenerator.exportToCsv(
      `PHS-${report.id}-${new Date().toISOString().split('T')[0]}`,
      headers,
      rows
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-700 dark:text-blue-400" />
            <span>Reports, Analytics & Official Export Hub</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Generate formal Papine High School administrative reports with school crest letterheads and downloadable CSV spreadsheets.
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5 text-xs">
          {['ALL', 'Documents', 'Academics', 'Finance', 'Hardware', 'Governance'].map(
            (cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  selectedCategory === cat
                    ? 'bg-blue-800 text-white shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            )
          )}
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredReports.map((report) => {
          const Icon = report.icon;
          return (
            <div
              key={report.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs flex flex-col justify-between hover:border-blue-400 transition"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 rounded-xl">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {report.title}
                      </h3>
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                        {report.category}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  {report.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleDownloadCsv(report)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition"
                  title="Export to CSV Spreadsheet"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Download CSV</span>
                </button>

                <button
                  onClick={() => handleDownloadPdf(report)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-800 hover:bg-blue-900 rounded-lg shadow-2xs transition"
                  title="Export Official PDF Report"
                >
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
