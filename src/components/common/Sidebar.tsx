import React from 'react';
import {
  LayoutDashboard,
  FileText,
  ListOrdered,
  Users,
  GraduationCap,
  CreditCard,
  Printer,
  Package,
  Wrench,
  BarChart3,
  History,
  Settings,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { UserRole } from '../../types';

export type NavTabId =
  | 'dashboard'
  | 'documents'
  | 'queue'
  | 'teachers'
  | 'students'
  | 'payments'
  | 'printers'
  | 'cartridges'
  | 'maintenance'
  | 'reports'
  | 'audit'
  | 'settings';

interface SidebarProps {
  activeTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  userRole: UserRole;
  badges: {
    pendingQueue: number;
    lowStock: number;
    lowAllowances: number;
    maintenanceNeeded: number;
    outstandingPayments: number;
  };
}

interface NavItem {
  id: NavTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeCount?: number;
  badgeColor?: string;
  allowedRoles: UserRole[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  userRole,
  badges,
}) => {
  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Executive Dashboard',
      icon: LayoutDashboard,
      allowedRoles: [
        'System Administrator',
        'Printing Administrator',
        'Printing Staff',
        'Teacher',
        'Finance Officer',
        'Read-only Management',
      ],
    },
    {
      id: 'documents',
      label: 'Document Register',
      icon: FileText,
      allowedRoles: [
        'System Administrator',
        'Printing Administrator',
        'Printing Staff',
        'Teacher',
        'Read-only Management',
      ],
    },
    {
      id: 'queue',
      label: 'Printing Queue',
      icon: ListOrdered,
      badgeCount: badges.pendingQueue,
      badgeColor: 'bg-blue-600 text-white',
      allowedRoles: [
        'System Administrator',
        'Printing Administrator',
        'Printing Staff',
        'Teacher',
        'Read-only Management',
      ],
    },
    {
      id: 'teachers',
      label: 'Teacher Quotas',
      icon: Users,
      badgeCount: badges.lowAllowances,
      badgeColor: 'bg-amber-500 text-white',
      allowedRoles: [
        'System Administrator',
        'Printing Administrator',
        'Teacher',
        'Read-only Management',
      ],
    },
    {
      id: 'students',
      label: 'Student Printing',
      icon: GraduationCap,
      badgeCount: badges.outstandingPayments > 0 ? badges.outstandingPayments : undefined,
      badgeColor: 'bg-rose-500 text-white',
      allowedRoles: [
        'System Administrator',
        'Printing Administrator',
        'Printing Staff',
        'Finance Officer',
        'Read-only Management',
      ],
    },
    {
      id: 'payments',
      label: 'Printing Payments',
      icon: CreditCard,
      allowedRoles: [
        'System Administrator',
        'Printing Administrator',
        'Finance Officer',
        'Read-only Management',
      ],
    },
    {
      id: 'printers',
      label: 'Printer Fleet',
      icon: Printer,
      badgeCount: badges.maintenanceNeeded,
      badgeColor: 'bg-amber-600 text-white',
      allowedRoles: [
        'System Administrator',
        'Printing Administrator',
        'Printing Staff',
        'Read-only Management',
      ],
    },
    {
      id: 'cartridges',
      label: 'Toner & Consumables',
      icon: Package,
      badgeCount: badges.lowStock,
      badgeColor: 'bg-rose-600 text-white',
      allowedRoles: [
        'System Administrator',
        'Printing Administrator',
        'Printing Staff',
        'Read-only Management',
      ],
    },
    {
      id: 'maintenance',
      label: 'Maintenance Log',
      icon: Wrench,
      allowedRoles: [
        'System Administrator',
        'Printing Administrator',
        'Printing Staff',
        'Read-only Management',
      ],
    },
    {
      id: 'reports',
      label: 'Reports & Exports',
      icon: BarChart3,
      allowedRoles: [
        'System Administrator',
        'Printing Administrator',
        'Finance Officer',
        'Read-only Management',
      ],
    },
    {
      id: 'audit',
      label: 'Audit Trail',
      icon: History,
      allowedRoles: [
        'System Administrator',
        'Printing Administrator',
        'Finance Officer',
        'Read-only Management',
      ],
    },
    {
      id: 'settings',
      label: 'System Settings',
      icon: Settings,
      allowedRoles: ['System Administrator', 'Printing Administrator'],
    },
  ];

  return (
    <aside className="w-64 shrink-0 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 select-none">
      {/* Sidebar Top Mini-Label */}
      <div className="px-5 py-3 border-b border-slate-800/80 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
        <span>Administration Modules</span>
        <span className="flex items-center gap-1 text-[10px] text-amber-400 normal-case font-normal">
          <Shield className="w-3 h-3 text-amber-500" />
          {userRole}
        </span>
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {navItems.map((item) => {
          const isAllowed = item.allowedRoles.includes(userRole);
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          if (!isAllowed) {
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 px-3 py-2 text-xs text-slate-600 rounded-lg cursor-not-allowed opacity-50"
                title={`Module restricted for ${userRole}`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </div>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition group ${
                isActive
                  ? 'bg-blue-800 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    isActive
                      ? 'text-amber-400 scale-110'
                      : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {item.badgeCount !== undefined && item.badgeCount > 0 && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                      item.badgeColor || 'bg-blue-600 text-white'
                    }`}
                  >
                    {item.badgeCount}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-amber-400" />}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Footer Info Box */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-400">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-slate-400">Papine High School</span>
          <span className="text-emerald-400 font-mono">v2.4 Production</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-0.5">
          Primary DB: Google Sheets (11 tabs)
        </p>
      </div>
    </aside>
  );
};
