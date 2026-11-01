import React from 'react';
import {
  FileText,
  Clock,
  Printer,
  CheckCircle2,
  Send,
  Users,
  AlertTriangle,
  CreditCard,
  Banknote,
  Wrench,
  Package,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import {
  DashboardStats,
  DocumentRecord,
  QueueItem,
  MaintenanceRecord,
  UserRole,
} from '../../types';

interface DashboardViewProps {
  stats: DashboardStats;
  recentDocs: DocumentRecord[];
  activeQueue: QueueItem[];
  recentMaintenance: MaintenanceRecord[];
  onNavigate: (tab: any) => void;
  onRefresh: () => void;
  isSyncing: boolean;
  userRole: UserRole;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  recentDocs,
  activeQueue,
  recentMaintenance,
  onNavigate,
  onRefresh,
  isSyncing,
  userRole,
}) => {
  const teacherAllowancePercent =
    stats.totalTeacherAllowanceAllocated > 0
      ? Math.round(
          (stats.totalTeacherAllowanceUsed / stats.totalTeacherAllowanceAllocated) *
            100
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions and Status */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 text-white rounded-2xl p-6 shadow-md border border-blue-900/40 relative overflow-hidden">
        {/* Subtle decorative watermark */}
        <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 opacity-10 pointer-events-none">
          <Printer className="w-64 h-64 text-amber-300" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full">
                Papine High School Media Centre
              </span>
              <span className="text-xs text-slate-400">
                Data Synced: {stats.lastUpdated}
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Printing & Document Management Operations
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              Unified control center for Jamaican examination papers, student printing requests, teacher allowances, and equipment maintenance.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onRefresh}
              disabled={isSyncing}
              className="inline-flex items-center gap-2 px-3 py-2 bg-slate-800/80 hover:bg-slate-700/80 text-white text-xs font-semibold rounded-xl border border-slate-700 transition"
              title="Refresh from Google Sheets"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Data'}</span>
            </button>

            {userRole !== 'Read-only Management' && (
              <button
                onClick={() => onNavigate('documents')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl shadow-xs transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Register Document</span>
              </button>
            )}

            <button
              onClick={() => onNavigate('queue')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              <Printer className="w-4 h-4" />
              <span>Open Queue ({stats.documentsPending + stats.documentsPrinting})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 12 Required Operational Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3.5">
        {/* Card 1: Total Docs */}
        <div
          onClick={() => onNavigate('documents')}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Received</span>
            <FileText className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.totalDocumentsReceived}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">All registered documents</p>
        </div>

        {/* Card 2: Pending Printing */}
        <div
          onClick={() => onNavigate('queue')}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 transition cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending Print</span>
            <Clock className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {stats.documentsPending}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Awaiting print bay</p>
        </div>

        {/* Card 3: Currently Printing */}
        <div
          onClick={() => onNavigate('queue')}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Now Printing</span>
            <Printer className="w-4 h-4 text-blue-600 animate-pulse group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
            {stats.documentsPrinting}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Active jobs running</p>
        </div>

        {/* Card 4: Documents Completed */}
        <div
          onClick={() => onNavigate('documents')}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {stats.documentsCompleted}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Printed & verified</p>
        </div>

        {/* Card 5: Documents Delivered */}
        <div
          onClick={() => onNavigate('documents')}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 transition cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Delivered</span>
            <Send className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {stats.documentsDelivered}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Collected by staff</p>
        </div>

        {/* Card 6: Active Teachers */}
        <div
          onClick={() => onNavigate('teachers')}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Teachers</span>
            <Users className="w-4 h-4 text-blue-700 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.activeTeachers}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">With allocated tokens</p>
        </div>

        {/* Card 7: Teacher Allowance Usage */}
        <div
          onClick={() => onNavigate('teachers')}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500 transition cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Allowance Usage</span>
            <TrendingUp className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {teacherAllowancePercent}%
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div
              className="bg-purple-600 h-full rounded-full"
              style={{ width: `${Math.min(100, teacherAllowancePercent)}%` }}
            />
          </div>
        </div>

        {/* Card 8: Teachers Approaching Limit */}
        <div
          onClick={() => onNavigate('teachers')}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-rose-500 dark:hover:border-rose-500 transition cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Low Quota Alert</span>
            <AlertTriangle className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {stats.teachersApproachingLimit}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Below warning threshold</p>
        </div>

        {/* Card 9: Student Printing Transactions */}
        <div
          onClick={() => onNavigate('students')}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Student Jobs</span>
            <CreditCard className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.totalStudentTransactions}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Paid student printings</p>
        </div>

        {/* Card 10: Outstanding Student Payments */}
        <div
          onClick={() => onNavigate('payments')}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 transition cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Student Balance</span>
            <Banknote className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl font-black text-amber-700 dark:text-amber-400 truncate">
            JMD ${stats.outstandingStudentPaymentsJMD.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Outstanding charges</p>
        </div>

        {/* Card 11: Operational Printers */}
        <div
          onClick={() => onNavigate('printers')}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Printers Online</span>
            <Printer className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {stats.operationalPrinters}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Fleet operational</p>
        </div>

        {/* Card 12: Printers Requiring Maintenance */}
        <div
          onClick={() => onNavigate('maintenance')}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-rose-500 dark:hover:border-rose-500 transition cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Maintenance</span>
            <Wrench className="w-4 h-4 text-rose-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {stats.printersUnderMaintenance}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Faulty or in service</p>
        </div>
      </div>

      {/* Main Grid: Active Printing Queue + Recent Registrations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Queue Pipeline */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Live Printing Queue Pipeline
              </h3>
            </div>
            <button
              onClick={() => onNavigate('queue')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
            >
              <span>Manage Full Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {activeQueue.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                The printing queue is currently empty.
              </div>
            ) : (
              activeQueue.slice(0, 5).map((item) => (
                <div key={item.queueId} className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      #{item.position}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {item.documentTitle}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            item.priority === 'Urgent'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : item.priority === 'High'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {item.priority}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {item.teacherName} • {item.numberOfPages} pgs × {item.numberOfCopies} copies ({item.totalSheets} sheets)
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === 'Printing'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 animate-pulse'
                          : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {item.status}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[120px]">
                      {item.assignedPrinterName || 'Unassigned'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Document Registrations */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Recent Document Registrations
              </h3>
            </div>
            <button
              onClick={() => onNavigate('documents')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
            >
              <span>View Register</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentDocs.slice(0, 5).map((doc) => (
              <div key={doc.documentId} className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-slate-400 dark:text-slate-500">
                      {doc.documentId}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {doc.documentTitle}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {doc.teacherName} ({doc.department.split('(')[0].trim()})
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      doc.status === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : doc.status === 'Delivered'
                        ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                        : doc.status === 'Queued'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {doc.status}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {doc.dateReceived}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Equipment Fleet & Maintenance Summary */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Recent Printer Maintenance & Service Calls
            </h3>
          </div>
          <button
            onClick={() => onNavigate('maintenance')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
          >
            <span>Maintenance Log</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentMaintenance.slice(0, 2).map((m) => (
            <div
              key={m.logId}
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {m.printerName}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      m.maintenanceStatus === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {m.maintenanceStatus}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                  {m.faultDescription}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>Tech: {m.technician}</span>
                <span className="font-bold text-slate-700 dark:text-slate-200 font-mono">
                  Cost: JMD ${m.costJMD.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
