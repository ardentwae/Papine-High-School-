import React, { useState } from 'react';
import {
  Settings,
  Building,
  DollarSign,
  Clock,
  Folder,
  Shield,
  Save,
  CheckCircle2,
  Table,
  HelpCircle,
} from 'lucide-react';
import { SystemSettings, UserProfile } from '../../types';
import { storageService } from '../../services/storageService';
import { googleSheetsService } from '../../services/googleSheetsService';
import { SCHOOL_INFO, SPREADSHEET_TABS } from '../../config/constants';

interface SettingsViewProps {
  settings: SystemSettings;
  currentUser: UserProfile;
  onRefresh: () => void;
  onShowMessage: (type: 'success' | 'error', text: string) => void;
  onOpenSpreadsheetModal: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  currentUser,
  onRefresh,
  onShowMessage,
  onOpenSpreadsheetModal,
}) => {
  const [formState, setFormState] = useState<SystemSettings>({ ...settings });
  const [isSaving, setIsSaving] = useState(false);

  const canEditSettings =
    currentUser.role === 'System Administrator' ||
    currentUser.role === 'Printing Administrator';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditSettings) {
      onShowMessage('error', 'Only System Administrators may alter core institutional settings.');
      return;
    }

    setIsSaving(true);
    try {
      storageService.setSettings(formState);

      await googleSheetsService.logAudit_(
        'Settings',
        'Update Settings',
        'SYS-CONFIG',
        `Institutional settings updated by ${currentUser.name}`,
        currentUser
      );

      onShowMessage('success', 'System settings updated successfully!');
      onRefresh();
    } catch (err: any) {
      onShowMessage('error', err.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-700 dark:text-blue-400" />
            <span>School Administration & System Preferences</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Institutional parameters, Jamaican currency configuration, Google Drive repository, and RBAC matrix.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: School Identity */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Building className="w-4 h-4 text-blue-700 dark:text-blue-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Institutional Profile
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                School Name
              </label>
              <input
                type="text"
                value={formState.schoolName}
                onChange={(e) => setFormState({ ...formState, schoolName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                disabled={!canEditSettings}
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Official Motto
              </label>
              <input
                type="text"
                value={formState.motto}
                onChange={(e) => setFormState({ ...formState, motto: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                disabled={!canEditSettings}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Campus Location
              </label>
              <input
                type="text"
                value={formState.address}
                onChange={(e) => setFormState({ ...formState, address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                disabled={!canEditSettings}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Currency & Rates */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Financial & Printing Rates
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Currency
              </label>
              <input
                type="text"
                value={formState.currency}
                disabled
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Timezone
              </label>
              <input
                type="text"
                value={formState.timeZone}
                disabled
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Student B&W Rate (JMD)
              </label>
              <input
                type="number"
                min={1}
                value={formState.studentRatePerPageJMD}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    studentRatePerPageJMD: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white font-mono"
                disabled={!canEditSettings}
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Student Color Rate (JMD)
              </label>
              <input
                type="number"
                min={1}
                value={formState.studentColorRateJMD}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    studentColorRateJMD: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white font-mono"
                disabled={!canEditSettings}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Quotas & Google Drive */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Folder className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Storage & Teacher Quota Policies
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Default Teacher Term Quota
              </label>
              <input
                type="number"
                value={formState.defaultTeacherAllowance}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    defaultTeacherAllowance: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white font-mono"
                disabled={!canEditSettings}
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Warning Threshold (%)
              </label>
              <input
                type="number"
                value={formState.warningThresholdPercent}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    warningThresholdPercent: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white font-mono"
                disabled={!canEditSettings}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Designated Google Drive Storage Folder Name
              </label>
              <input
                type="text"
                value={formState.driveFolderName}
                onChange={(e) =>
                  setFormState({ ...formState, driveFolderName: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white font-mono"
                disabled={!canEditSettings}
              />
              <p className="text-[11px] text-slate-400 mt-1">
                PDF attachments uploaded during registration will be stored in this Google Drive folder.
              </p>
            </div>
          </div>
        </div>

        {/* Section 4: Spreadsheet 11 Tabs Integration */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Table className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Google Sheets Database Status
              </h3>
            </div>
            <button
              type="button"
              onClick={onOpenSpreadsheetModal}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Configure Spreadsheet ID
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {Object.values(SPREADSHEET_TABS).map((tab) => (
              <div
                key={tab}
                className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-mono text-[11px] truncate text-slate-700 dark:text-slate-300">
                  {tab}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Save Bar */}
        {canEditSettings && (
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-800 hover:bg-blue-900 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save System Settings'}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
