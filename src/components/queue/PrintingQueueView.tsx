import React, { useState } from 'react';
import {
  ListOrdered,
  Printer,
  ArrowUp,
  ArrowDown,
  Play,
  CheckCircle,
  Truck,
  XCircle,
  Clock,
  Layers,
  Search,
  Filter,
  AlertTriangle,
  User,
} from 'lucide-react';
import {
  QueueItem,
  QueueStatus,
  PrinterEquipment,
  UserProfile,
  UserRole,
} from '../../types';
import { googleSheetsService } from '../../services/googleSheetsService';

interface PrintingQueueProps {
  queue: QueueItem[];
  printers: PrinterEquipment[];
  currentUser: UserProfile;
  onRefresh: () => void;
  onShowMessage: (type: 'success' | 'error', text: string) => void;
  onRequestConfirm: (action: {
    title: string;
    message: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }) => void;
}

export const PrintingQueueView: React.FC<PrintingQueueProps> = ({
  queue,
  printers,
  currentUser,
  onRefresh,
  onShowMessage,
  onRequestConfirm,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | QueueStatus>('ALL');

  const canManageQueue =
    currentUser.role === 'System Administrator' ||
    currentUser.role === 'Printing Administrator' ||
    currentUser.role === 'Printing Staff';

  // Sort queue by position ascending
  const sortedQueue = [...queue].sort((a, b) => a.position - b.position);

  const filteredQueue = sortedQueue.filter((item) => {
    const matchesSearch =
      item.documentTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.documentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.teacherName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleMovePosition = async (item: QueueItem, direction: 'UP' | 'DOWN') => {
    if (!canManageQueue) {
      onShowMessage('error', 'Only printing administrators and staff may adjust queue order.');
      return;
    }

    const currentPos = item.position;
    const targetPos = direction === 'UP' ? currentPos - 1 : currentPos + 1;
    if (targetPos < 1) return;

    try {
      await googleSheetsService.updateQueuePosition(item.queueId, targetPos, currentUser);
      onShowMessage('success', `Moved #${item.queueId} to position ${targetPos}.`);
      onRefresh();
    } catch (err: any) {
      onShowMessage('error', err.message || 'Failed to update queue position.');
    }
  };

  const handleStatusChange = (item: QueueItem, newStatus: QueueStatus) => {
    if (!canManageQueue) {
      onShowMessage('error', 'Unauthorized: Insufficient permissions to modify printing status.');
      return;
    }

    const isDestructive = newStatus === 'Cancelled';
    const message =
      newStatus === 'Printing'
        ? `Start printing job for "${item.documentTitle}" (${item.totalSheets} sheets)? This will record the start timestamp and notify staff.`
        : newStatus === 'Completed'
        ? `Mark "${item.documentTitle}" as Completed? This will deduct ${item.numberOfPages * item.numberOfCopies} pages from ${item.teacherName}'s token allowance and log printed sheets to the assigned printer.`
        : newStatus === 'Delivered'
        ? `Confirm that "${item.documentTitle}" has been collected/delivered to ${item.teacherName}?`
        : `Are you sure you want to cancel print job #${item.queueId}?`;

    onRequestConfirm({
      title: `Update Print Job Status: ${newStatus}`,
      message,
      isDestructive,
      onConfirm: async () => {
        try {
          await googleSheetsService.updateQueueStatus(
            item.queueId,
            newStatus,
            item.assignedPrinterId,
            currentUser
          );
          onShowMessage('success', `Queue job #${item.queueId} updated to ${newStatus}.`);
          onRefresh();
        } catch (e: any) {
          onShowMessage('error', e.message || 'Status update failed.');
        }
      },
    });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-blue-700 dark:text-blue-400" />
            <span>Printing Queue Management</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time queue sequencing, duplicate prevention, and automated status synchronization.
          </p>
        </div>

        {/* Queue Metrics Bar */}
        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 rounded-lg font-bold">
            Pending: {queue.filter((q) => q.status === 'Pending').length}
          </span>
          <span className="px-3 py-1 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 rounded-lg font-bold">
            Printing: {queue.filter((q) => q.status === 'Printing').length}
          </span>
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-lg font-bold">
            Completed: {queue.filter((q) => q.status === 'Completed').length}
          </span>
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
            placeholder="Search queue jobs..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
            Filter Status:
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Printing">Printing</option>
            <option value="Completed">Completed</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3 text-center">Pos</th>
                <th className="px-4 py-3">Document & Dept</th>
                <th className="px-4 py-3">Teacher</th>
                <th className="px-4 py-3">Sheets & Specs</th>
                <th className="px-4 py-3">Assigned Printer</th>
                <th className="px-4 py-3">Priority / Added</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Workflow Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No printing jobs found.
                  </td>
                </tr>
              ) : (
                filteredQueue.map((item, idx) => {
                  const isFirst = idx === 0;
                  const isLast = idx === filteredQueue.length - 1;
                  const isCompletedOrClosed =
                    item.status === 'Completed' ||
                    item.status === 'Delivered' ||
                    item.status === 'Cancelled';

                  return (
                    <tr
                      key={item.queueId}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                    >
                      {/* Position & Re-order Controls */}
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {canManageQueue && !isCompletedOrClosed && (
                            <div className="flex flex-col gap-0.5">
                              <button
                                onClick={() => handleMovePosition(item, 'UP')}
                                disabled={isFirst}
                                className="p-0.5 text-slate-400 hover:text-blue-600 disabled:opacity-20"
                                title="Move Up"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleMovePosition(item, 'DOWN')}
                                disabled={isLast}
                                className="p-0.5 text-slate-400 hover:text-blue-600 disabled:opacity-20"
                                title="Move Down"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                          <span className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-300 font-mono font-bold text-xs flex items-center justify-center">
                            #{item.position}
                          </span>
                        </div>
                      </td>

                      {/* Document Title & Foreign ID */}
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 dark:text-white max-w-xs truncate">
                          {item.documentTitle}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {item.documentId} • {item.department.split('(')[0].trim()}
                        </div>
                      </td>

                      {/* Teacher */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {item.teacherName}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Staff: {item.staffAssigned || 'Media Centre'}
                        </div>
                      </td>

                      {/* Sheets & Specs */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {item.totalSheets} sheets
                        </span>
                        <div className="text-[10px] text-slate-400">
                          {item.numberOfPages}p × {item.numberOfCopies}c • {item.duplexPrinting ? 'Duplex' : 'Single'}
                        </div>
                      </td>

                      {/* Assigned Printer */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                          <Printer className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate max-w-[130px]">
                            {item.assignedPrinterName || 'Primary Media Centre'}
                          </span>
                        </div>
                      </td>

                      {/* Priority / Added Date */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            item.priority === 'Urgent'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : item.priority === 'High'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {item.priority}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {item.dateAdded} {item.timeAdded}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === 'Printing'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 animate-pulse'
                              : item.status === 'Completed'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : item.status === 'Delivered'
                              ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                              : item.status === 'Cancelled'
                              ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      {/* Workflow Actions */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {canManageQueue && (
                          <div className="flex items-center justify-end gap-1.5">
                            {item.status === 'Pending' && (
                              <button
                                onClick={() => handleStatusChange(item, 'Printing')}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-700 hover:bg-blue-800 text-white text-[11px] font-bold rounded-lg transition"
                                title="Start Printing"
                              >
                                <Play className="w-3 h-3 fill-current" />
                                <span>Print</span>
                              </button>
                            )}

                            {item.status === 'Printing' && (
                              <button
                                onClick={() => handleStatusChange(item, 'Completed')}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition"
                                title="Mark as Completed"
                              >
                                <CheckCircle className="w-3 h-3" />
                                <span>Complete</span>
                              </button>
                            )}

                            {item.status === 'Completed' && (
                              <button
                                onClick={() => handleStatusChange(item, 'Delivered')}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg transition"
                                title="Mark as Delivered"
                              >
                                <Truck className="w-3 h-3" />
                                <span>Deliver</span>
                              </button>
                            )}

                            {!isCompletedOrClosed && (
                              <button
                                onClick={() => handleStatusChange(item, 'Cancelled')}
                                className="p-1 text-slate-400 hover:text-rose-600 transition"
                                title="Cancel Job"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
