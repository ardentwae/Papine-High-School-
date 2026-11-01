import React, { useState } from 'react';
import { Table, CheckCircle2, AlertCircle, RefreshCw, X, Link as LinkIcon, ShieldCheck } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { googleSheetsService } from '../../services/googleSheetsService';
import { SPREADSHEET_TABS } from '../../config/constants';

interface SpreadsheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: (spreadsheetId: string) => void;
}

export const SpreadsheetSelectorModal: React.FC<SpreadsheetModalProps> = ({
  isOpen,
  onClose,
  onConnected,
}) => {
  const currentId = storageService.getSpreadsheetId();
  const [inputValue, setInputValue] = useState(currentId);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  if (!isOpen) return null;

  const extractSpreadsheetId = (input: string): string => {
    const trimmed = input.trim();
    const match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      return match[1];
    }
    return trimmed;
  };

  const handleValidateAndConnect = async () => {
    const sheetId = extractSpreadsheetId(inputValue);
    if (!sheetId) {
      setStatusMessage({
        type: 'error',
        text: 'Please enter a valid Google Spreadsheet URL or Spreadsheet ID.',
      });
      return;
    }

    setLoading(true);
    setStatusMessage({ type: 'info', text: 'Validating 11 required tabs and columns in Google Sheets...' });

    try {
      const result = await googleSheetsService.validateOrInitializeSpreadsheet(sheetId);
      storageService.setSpreadsheetId(sheetId);
      setStatusMessage({
        type: 'success',
        text: `Connected to "${result.spreadsheetTitle}". All 11 tabs verified!`,
      });
      onConnected(sheetId);
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (e: any) {
      setStatusMessage({
        type: 'error',
        text: e.message || 'Failed to connect to Google Sheets. Verify permissions and spreadsheet ID.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Google Sheets Database Connection
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Primary data repository with 11 validated tabs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Google Spreadsheet URL or ID
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <LinkIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XR.../edit"
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 dark:text-white transition font-mono text-xs"
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
              Paste the link or ID of your existing Papine High School spreadsheet.
            </p>
          </div>

          {/* Tab Checklist */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-800 dark:text-slate-200">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>11 Required System Tabs:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px] font-mono text-slate-600 dark:text-slate-400">
              {Object.values(SPREADSHEET_TABS).map((tab) => (
                <div key={tab} className="flex items-center gap-1.5 truncate">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">{tab}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status Alert */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                  : 'bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
              }`}
            >
              {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
              {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0" />}
              {statusMessage.type === 'info' && <RefreshCw className="w-4 h-4 animate-spin shrink-0" />}
              <span>{statusMessage.text}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleValidateAndConnect}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-800 hover:bg-blue-900 rounded-xl shadow-xs transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Validating...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Validate & Connect Sheets</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
