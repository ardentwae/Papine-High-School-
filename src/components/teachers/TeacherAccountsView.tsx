import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Coins,
  History,
  Edit2,
  X,
  RefreshCw,
  Mail,
  Shield,
} from 'lucide-react';
import { TeacherAccount, UserProfile, UserRole } from '../../types';
import { DEPARTMENTS } from '../../config/constants';
import { storageService } from '../../services/storageService';
import { googleSheetsService } from '../../services/googleSheetsService';

interface TeacherAccountsProps {
  teachers: TeacherAccount[];
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

export const TeacherAccountsView: React.FC<TeacherAccountsProps> = ({
  teachers,
  currentUser,
  onRefresh,
  onShowMessage,
  onRequestConfirm,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherAccount | null>(null);
  const [topUpAmount, setTopUpAmount] = useState<number>(500);

  // New Teacher form
  const [teacherName, setTeacherName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [tokenAllocation, setTokenAllocation] = useState<number>(1000);
  const [warningThreshold, setWarningThreshold] = useState<number>(200);

  const canManageTeachers =
    currentUser.role === 'System Administrator' ||
    currentUser.role === 'Printing Administrator';

  const filteredTeachers = teachers.filter((t) => {
    const matchesSearch =
      t.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.teacherId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === 'ALL' || t.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName.trim() || !email.trim()) {
      onShowMessage('error', 'Please enter teacher name and valid school email.');
      return;
    }

    const currentTeachers = storageService.getTeachers();
    const newId = `TCH-${String(currentTeachers.length + 1).padStart(3, '0')}`;
    const newAccount: TeacherAccount = {
      teacherId: newId,
      teacherName,
      email,
      department,
      status: 'Active',
      tokenAllocation,
      tokensUsed: 0,
      remainingBalance: tokenAllocation,
      warningThreshold,
      notes: 'New account provisioned',
    };

    const updated = [...currentTeachers, newAccount];
    storageService.setTeachers(updated);

    await googleSheetsService.logAudit_(
      'Teacher Accounts',
      'Create Teacher',
      newId,
      `Created teacher account for ${teacherName} (${department}) with ${tokenAllocation} tokens`,
      currentUser
    );

    onShowMessage('success', `Teacher account ${newId} created for ${teacherName}.`);
    setIsAddModalOpen(false);
    setTeacherName('');
    setEmail('');
    onRefresh();
  };

  const handleTopUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher) return;

    const currentTeachers = storageService.getTeachers();
    const updated = currentTeachers.map((t) => {
      if (t.teacherId === selectedTeacher.teacherId) {
        const newAlloc = t.tokenAllocation + topUpAmount;
        const newBalance = t.remainingBalance + topUpAmount;
        return {
          ...t,
          tokenAllocation: newAlloc,
          remainingBalance: newBalance,
        };
      }
      return t;
    });

    storageService.setTeachers(updated);

    await googleSheetsService.logAudit_(
      'Teacher Accounts',
      'Adjust Allowance',
      selectedTeacher.teacherId,
      `Allocated +${topUpAmount} print tokens to ${selectedTeacher.teacherName}`,
      currentUser
    );

    onShowMessage(
      'success',
      `Allocated +${topUpAmount} tokens to ${selectedTeacher.teacherName}. New balance: ${selectedTeacher.remainingBalance + topUpAmount}.`
    );
    setIsTopUpModalOpen(false);
    setSelectedTeacher(null);
    onRefresh();
  };

  const handleToggleStatus = (teacher: TeacherAccount) => {
    const newStatus = teacher.status === 'Active' ? 'Inactive' : 'Active';
    onRequestConfirm({
      title: `${newStatus === 'Active' ? 'Activate' : 'Deactivate'} Teacher Account`,
      message: `Are you sure you want to change ${teacher.teacherName}'s account status to ${newStatus}?`,
      isDestructive: newStatus === 'Inactive',
      onConfirm: async () => {
        const currentTeachers = storageService.getTeachers();
        const updated = currentTeachers.map((t) =>
          t.teacherId === teacher.teacherId ? { ...t, status: newStatus as any } : t
        );
        storageService.setTeachers(updated);
        await googleSheetsService.logAudit_(
          'Teacher Accounts',
          'Update Teacher',
          teacher.teacherId,
          `Account status updated to ${newStatus}`,
          currentUser
        );
        onShowMessage('success', `Teacher ${teacher.teacherName} is now ${newStatus}.`);
        onRefresh();
      },
    });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-700 dark:text-blue-400" />
            <span>Teacher Printing Quotas & Allowances</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Per-term paper token allocations, usage monitoring, and low balance threshold alerts.
          </p>
        </div>

        {canManageTeachers && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Teacher Account</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center gap-3 justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search teacher by name or email..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
            Department:
          </label>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
          >
            <option value="ALL">All Departments</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Teachers Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Teacher & ID</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Quota Allocated</th>
                <th className="px-4 py-3">Pages Used</th>
                <th className="px-4 py-3">Remaining Balance</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTeachers.map((teacher) => {
                const isLow = teacher.remainingBalance <= teacher.warningThreshold;
                const percentUsed =
                  teacher.tokenAllocation > 0
                    ? Math.round((teacher.tokensUsed / teacher.tokenAllocation) * 100)
                    : 0;

                return (
                  <tr
                    key={teacher.teacherId}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                  >
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {teacher.teacherName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                        <span>{teacher.teacherId}</span> • <span>{teacher.email}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      {teacher.department}
                    </td>

                    <td className="px-4 py-3 font-mono font-bold text-slate-800 dark:text-white">
                      {teacher.tokenAllocation.toLocaleString()} tokens
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-mono text-slate-700 dark:text-slate-300">
                        {teacher.tokensUsed.toLocaleString()} ({percentUsed}%)
                      </div>
                      <div className="w-24 bg-slate-100 dark:bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
                        <div
                          className={`h-full ${
                            isLow ? 'bg-rose-500' : 'bg-blue-600'
                          }`}
                          style={{ width: `${Math.min(100, percentUsed)}%` }}
                        />
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-mono font-bold text-sm ${
                            isLow
                              ? 'text-rose-600 dark:text-rose-400 font-black'
                              : 'text-emerald-700 dark:text-emerald-400'
                          }`}
                        >
                          {teacher.remainingBalance.toLocaleString()}
                        </span>
                        {isLow && (
                          <span
                            className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-[10px] font-bold flex items-center gap-1"
                            title={`Below warning limit of ${teacher.warningThreshold} tokens`}
                          >
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Low
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          teacher.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {teacher.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {canManageTeachers && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedTeacher(teacher);
                              setIsTopUpModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] font-bold rounded-lg transition"
                            title="Top-up Printing Quota"
                          >
                            <Coins className="w-3 h-3" />
                            <span>Top Up</span>
                          </button>

                          <button
                            onClick={() => handleToggleStatus(teacher)}
                            className={`p-1.5 rounded-lg text-xs font-semibold ${
                              teacher.status === 'Active'
                                ? 'text-slate-400 hover:text-rose-600'
                                : 'text-slate-400 hover:text-emerald-600'
                            }`}
                            title={teacher.status === 'Active' ? 'Deactivate' : 'Activate'}
                          >
                            {teacher.status === 'Active' ? 'Disable' : 'Enable'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Up Modal */}
      {isTopUpModalOpen && selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Replenish Printing Allowance
                </h3>
              </div>
              <button
                onClick={() => setIsTopUpModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTopUpSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <span className="text-slate-400">Teacher:</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {selectedTeacher.teacherName}
                </p>
                <p className="text-slate-500">
                  Current Balance: {selectedTeacher.remainingBalance.toLocaleString()} tokens
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Additional Tokens to Credit:
                </label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {[250, 500, 1000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTopUpAmount(amt)}
                      className={`py-1.5 rounded-lg border font-bold ${
                        topUpAmount === amt
                          ? 'bg-amber-500 text-slate-950 border-amber-500'
                          : 'border-slate-200 dark:border-slate-700 dark:text-white'
                      }`}
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min={50}
                  max={5000}
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTopUpModalOpen(false)}
                  className="px-3 py-1.5 text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg shadow-xs"
                >
                  Confirm Credit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Teacher Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Register New Teacher Account
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTeacher} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Teacher Name *
                </label>
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="e.g. Mr. Rohan Higgins"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  School Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="r.higgins@papinehigh.edu.jm"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Initial Allowance
                  </label>
                  <input
                    type="number"
                    value={tokenAllocation}
                    onChange={(e) => setTokenAllocation(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Warning Threshold
                  </label>
                  <input
                    type="number"
                    value={warningThreshold}
                    onChange={(e) => setWarningThreshold(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white font-bold rounded-lg shadow-xs"
                >
                  Save Teacher Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
