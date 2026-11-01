import React from 'react';
import {
  Sun,
  Moon,
  Clock,
  Shield,
  Table,
  CheckCircle2,
  AlertCircle,
  LogOut,
  UserCheck,
} from 'lucide-react';
import { PapineCrest } from './PapineCrest';
import { UserProfile, UserRole } from '../../types';
import { SCHOOL_INFO } from '../../config/constants';

interface HeaderProps {
  currentUser: UserProfile;
  onRoleChange: (role: UserRole) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  isGoogleAuthenticated: boolean;
  onGoogleSignIn: () => void;
  onGoogleSignOut: () => void;
  spreadsheetId: string;
  onOpenSpreadsheetModal: () => void;
  isSyncing: boolean;
}

const ALL_ROLES: UserRole[] = [
  'System Administrator',
  'Printing Administrator',
  'Printing Staff',
  'Teacher',
  'Finance Officer',
  'Read-only Management',
];

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onRoleChange,
  isDarkMode,
  onToggleTheme,
  isGoogleAuthenticated,
  onGoogleSignIn,
  onGoogleSignOut,
  spreadsheetId,
  onOpenSpreadsheetModal,
  isSyncing,
}) => {
  const [jamaicaTime, setJamaicaTime] = React.useState('');

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setJamaicaTime(
        now.toLocaleTimeString('en-US', {
          timeZone: 'America/Jamaica',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
      <div className="px-4 lg:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Papine Crest & School Title */}
        <div className="flex items-center gap-3">
          <PapineCrest size={40} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                {SCHOOL_INFO.name}
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                KINGSTON, JA
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Printing & Document Management Platform
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5">
          {/* Jamaica Time Clock */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="font-mono text-[11px]">{jamaicaTime}</span>
            <span className="text-[9px] uppercase font-bold text-slate-400">EST/JA</span>
          </div>

          {/* Spreadsheet Connection Badge */}
          <button
            onClick={onOpenSpreadsheetModal}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
              spreadsheetId
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 hover:bg-amber-100'
            }`}
            title="Configure Google Spreadsheet ID"
          >
            <Table className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {spreadsheetId ? 'Google Sheets (11 Tabs)' : 'Connect Google Sheet'}
            </span>
            {spreadsheetId ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            )}
          </button>

          {/* Role Switcher (RBAC) */}
          <div className="relative flex items-center">
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <Shield className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
              <label htmlFor="role-select" className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">
                Role:
              </label>
              <select
                id="role-select"
                value={currentUser.role}
                onChange={(e) => onRoleChange(e.target.value as UserRole)}
                className="bg-transparent font-bold text-slate-800 dark:text-white focus:outline-hidden cursor-pointer text-xs"
              >
                {ALL_ROLES.map((role) => (
                  <option key={role} value={role} className="dark:bg-slate-900 text-slate-900 dark:text-white">
                    {role}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dark / Light Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-900" />}
          </button>

          {/* Google Workspace Sign-In Button */}
          {isGoogleAuthenticated ? (
            <div className="flex items-center gap-2 pl-1">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[130px]">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-end gap-1">
                  <UserCheck className="w-2.5 h-2.5" /> Workspace Connected
                </span>
              </div>
              <button
                onClick={onGoogleSignOut}
                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                title="Sign out of Google"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onGoogleSignIn}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs transition"
            >
              {/* Official Google 'G' icon */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
              </svg>
              <span className="hidden sm:inline">Sign in with Google</span>
              <span className="sm:hidden">Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
