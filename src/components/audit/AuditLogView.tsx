import React, { useState } from 'react';
import {
  History,
  Search,
  Filter,
  ShieldAlert,
  ShieldCheck,
  Calendar,
  Lock,
} from 'lucide-react';
import { AuditRecord, UserProfile } from '../../types';

interface AuditLogProps {
  logs: AuditRecord[];
  currentUser: UserProfile;
}

export const AuditLogView: React.FC<AuditLogProps> = ({ logs, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.recordId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = moduleFilter === 'ALL' || log.module === moduleFilter;
    return matchesSearch && matchesModule;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-blue-700 dark:text-blue-400" />
            <span>Administrative Audit Log</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Immutable, tamper-evident security record of all system events, document uploads, and financial transactions.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700">
          <Lock className="w-3.5 h-3.5 text-amber-500" />
          <span>Read-Only Audit Trail (Immutable)</span>
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
            placeholder="Search details, user, or record ID..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
            Filter Module:
          </label>
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
          >
            <option value="ALL">All System Modules</option>
            <option value="Document Register">Document Register</option>
            <option value="Printing Queue">Printing Queue</option>
            <option value="Teacher Accounts">Teacher Accounts</option>
            <option value="Student Printing">Student Printing</option>
            <option value="Printing Payments">Printing Payments</option>
            <option value="Printer Register">Printer Register</option>
            <option value="Toner Management">Toner Management</option>
            <option value="Maintenance Log">Maintenance Log</option>
            <option value="Settings">Settings</option>
            <option value="Authentication">Authentication</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Audit ID</th>
                <th className="px-4 py-3">Timestamp (JA)</th>
                <th className="px-4 py-3">User & Role</th>
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Record ID</th>
                <th className="px-4 py-3">Action Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.map((log) => (
                <tr
                  key={log.auditId}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition font-mono text-[11px]"
                >
                  <td className="px-4 py-3 font-bold text-slate-400 whitespace-nowrap">
                    {log.auditId}
                  </td>

                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {log.timestamp}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="font-bold font-sans text-slate-900 dark:text-white">
                      {log.userName}
                    </div>
                    <div className="text-[10px] text-amber-600 dark:text-amber-400 font-sans">
                      {log.userRole}
                    </div>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-sans font-bold text-slate-700 dark:text-slate-300">
                      {log.module}
                    </span>
                  </td>

                  <td className="px-4 py-3 font-sans font-bold text-blue-700 dark:text-blue-400 whitespace-nowrap">
                    {log.action}
                  </td>

                  <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    {log.recordId}
                  </td>

                  <td className="px-4 py-3 font-sans text-slate-700 dark:text-slate-300 max-w-md">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
