/**
 * Papine High School - Printing & Document Management System
 * Production Administrative Web Application
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  UserRole,
  UserProfile,
  DocumentRecord,
  QueueItem,
  TeacherAccount,
  StudentPrintJob,
  PaymentRecord,
  PrinterEquipment,
  CartridgeInventory,
  MaintenanceRecord,
  AuditRecord,
  DashboardStats,
  SystemSettings,
  PriorityLevel,
} from './types';
import { storageService } from './services/storageService';
import { googleSheetsService } from './services/googleSheetsService';
import { initAuth, googleSignIn, logout, getAccessToken } from './config/firebase';
import { Header } from './components/common/Header';
import { Sidebar, NavTabId } from './components/common/Sidebar';
import { ConfirmationModal } from './components/common/ConfirmationModal';
import { PdfPreviewModal } from './components/common/PdfPreviewModal';
import { SpreadsheetSelectorModal } from './components/common/SpreadsheetSelectorModal';
import { DashboardView } from './components/dashboard/DashboardView';
import { DocumentRegisterView } from './components/documents/DocumentRegisterView';
import { PrintingQueueView } from './components/queue/PrintingQueueView';
import { TeacherAccountsView } from './components/teachers/TeacherAccountsView';
import { StudentPrintingView } from './components/students/StudentPrintingView';
import { PrintingPaymentsView } from './components/payments/PrintingPaymentsView';
import { PrinterRegisterView } from './components/printers/PrinterRegisterView';
import { TonerCartridgeView } from './components/inventory/TonerCartridgeView';
import { MaintenanceLogView } from './components/maintenance/MaintenanceLogView';
import { ReportsAnalyticsView } from './components/reports/ReportsAnalyticsView';
import { AuditLogView } from './components/audit/AuditLogView';
import { SettingsView } from './components/settings/SettingsView';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<NavTabId>('dashboard');

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('phs_dark_mode') === 'true';
  });

  // User Profile & Roles
  const [currentUser, setCurrentUser] = useState<UserProfile>({
    email: 'papinehsmc@gmail.com',
    name: 'Papine Media Centre',
    role: 'System Administrator',
    department: 'Media Centre & Administrative Services',
  });

  // Google Workspace Auth State
  const [isGoogleAuth, setIsGoogleAuth] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Spreadsheet State
  const [spreadsheetId, setSpreadsheetId] = useState<string>(() =>
    storageService.getSpreadsheetId()
  );
  const [isSpreadsheetModalOpen, setIsSpreadsheetModalOpen] = useState(false);

  // PDF Preview State
  const [pdfPreview, setPdfPreview] = useState<{
    isOpen: boolean;
    url: string;
    title: string;
    id: string;
  }>({
    isOpen: false,
    url: '',
    title: '',
    id: '',
  });

  // Confirmation Modal State (Mandatory Workspace user confirmation)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isDestructive: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    isDestructive: false,
    onConfirm: () => {},
  });

  // Toast Notification State
  const [toast, setToast] = useState<{
    id: number;
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Core Data States (11 modules)
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherAccount[]>([]);
  const [studentJobs, setStudentJobs] = useState<StudentPrintJob[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [printers, setPrinters] = useState<PrinterEquipment[]>([]);
  const [cartridges, setCartridges] = useState<CartridgeInventory[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(storageService.getSettings());
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>(
    storageService.calculateDashboardStats()
  );

  const showToast = useCallback((type: 'success' | 'error', text: string) => {
    setToast({ id: Date.now(), type, text });
    setTimeout(() => {
      setToast((prev) => (prev && Date.now() - prev.id >= 4000 ? null : prev));
    }, 4500);
  }, []);

  // Synchronize local states from storageService
  const loadAllDataFromCache = useCallback(() => {
    setDocuments(storageService.getDocuments());
    setQueue(storageService.getQueue());
    setTeachers(storageService.getTeachers());
    setStudentJobs(storageService.getStudentJobs());
    setPayments(storageService.getPayments());
    setPrinters(storageService.getPrinters());
    setCartridges(storageService.getCartridges());
    setMaintenance(storageService.getMaintenance());
    setAuditLogs(storageService.getAuditLogs());
    setSettings(storageService.getSettings());
    setDashboardStats(storageService.calculateDashboardStats());
  }, []);

  // Load and optionally sync with Google Sheets
  const refreshData = useCallback(async () => {
    const sid = storageService.getSpreadsheetId();
    if (sid && isGoogleAuth) {
      setIsSyncing(true);
      try {
        await googleSheetsService.fullSync(sid);
      } catch (e: any) {
        console.warn('Sheets sync notice:', e.message);
      } finally {
        setIsSyncing(false);
      }
    }
    loadAllDataFromCache();
  }, [isGoogleAuth, loadAllDataFromCache]);

  // Initial Auth Listener setup
  useEffect(() => {
    loadAllDataFromCache();

    const unsubscribe = initAuth(
      (user, token) => {
        setIsGoogleAuth(true);
        setCurrentUser((prev) => ({
          ...prev,
          email: user.email || prev.email,
          name: user.displayName || prev.name,
          photoURL: user.photoURL || undefined,
        }));
        showToast('success', `Signed in as ${user.displayName || user.email}`);
      },
      () => {
        setIsGoogleAuth(false);
      }
    );

    return () => unsubscribe();
  }, [loadAllDataFromCache, showToast]);

  // Dark Mode class synchronization
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('phs_dark_mode', String(isDarkMode));
  }, [isDarkMode]);

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setIsGoogleAuth(true);
        setCurrentUser((prev) => ({
          ...prev,
          email: result.user.email || prev.email,
          name: result.user.displayName || prev.name,
        }));
        showToast('success', 'Connected to Google Workspace!');
        refreshData();
      }
    } catch (e: any) {
      showToast('error', e.message || 'Google Sign-In was cancelled or failed.');
    }
  };

  // Handle Google Sign-Out
  const handleGoogleSignOut = async () => {
    await logout();
    setIsGoogleAuth(false);
    showToast('success', 'Signed out from Google Workspace.');
  };

  // Add document to Queue handler
  const handleAddToQueue = async (docId: string, priority: PriorityLevel) => {
    try {
      const result = await googleSheetsService.addToPrintingQueue(
        docId,
        priority,
        printers[0]?.printerId,
        currentUser
      );

      if (!result.success) {
        showToast('error', result.message || 'Could not add to queue.');
      } else {
        showToast(
          'success',
          `Document added to queue at position #${result.queueItem?.position} (${priority} priority)!`
        );
        refreshData();
      }
    } catch (e: any) {
      showToast('error', e.message || 'Queue operation failed.');
    }
  };

  // Badges calculations
  const badges = {
    pendingQueue: queue.filter((q) => q.status === 'Pending' || q.status === 'Printing').length,
    lowStock: cartridges.filter((c) => c.currentStock <= c.reorderThreshold).length,
    lowAllowances: teachers.filter((t) => t.remainingBalance <= t.warningThreshold).length,
    maintenanceNeeded: printers.filter((p) => p.status === 'Under Maintenance' || p.status === 'Faulty').length,
    outstandingPayments: studentJobs.filter((j) => j.outstandingBalanceJMD > 0).length,
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors">
      {/* App Header */}
      <Header
        currentUser={currentUser}
        onRoleChange={(role: UserRole) => {
          setCurrentUser((prev) => ({ ...prev, role }));
          showToast('success', `Active session role switched to: ${role}`);
        }}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        isGoogleAuthenticated={isGoogleAuth}
        onGoogleSignIn={handleGoogleSignIn}
        onGoogleSignOut={handleGoogleSignOut}
        spreadsheetId={spreadsheetId}
        onOpenSpreadsheetModal={() => setIsSpreadsheetModalOpen(true)}
        isSyncing={isSyncing}
      />

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          userRole={currentUser.role}
          badges={badges}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardView
                stats={dashboardStats}
                recentDocs={documents}
                activeQueue={queue.filter((q) => q.status === 'Pending' || q.status === 'Printing')}
                recentMaintenance={maintenance}
                onNavigate={(tab) => setActiveTab(tab)}
                onRefresh={refreshData}
                isSyncing={isSyncing}
                userRole={currentUser.role}
              />
            )}

            {activeTab === 'documents' && (
              <DocumentRegisterView
                documents={documents}
                currentUser={currentUser}
                onRefresh={refreshData}
                onPreviewPdf={(url, title, id) =>
                  setPdfPreview({ isOpen: true, url, title, id })
                }
                onAddToQueue={handleAddToQueue}
                onShowMessage={showToast}
              />
            )}

            {activeTab === 'queue' && (
              <PrintingQueueView
                queue={queue}
                printers={printers}
                currentUser={currentUser}
                onRefresh={refreshData}
                onShowMessage={showToast}
                onRequestConfirm={({ title, message, isDestructive, onConfirm }) =>
                  setConfirmDialog({
                    isOpen: true,
                    title,
                    message,
                    isDestructive: Boolean(isDestructive),
                    onConfirm,
                  })
                }
              />
            )}

            {activeTab === 'teachers' && (
              <TeacherAccountsView
                teachers={teachers}
                currentUser={currentUser}
                onRefresh={refreshData}
                onShowMessage={showToast}
                onRequestConfirm={({ title, message, isDestructive, onConfirm }) =>
                  setConfirmDialog({
                    isOpen: true,
                    title,
                    message,
                    isDestructive: Boolean(isDestructive),
                    onConfirm,
                  })
                }
              />
            )}

            {activeTab === 'students' && (
              <StudentPrintingView
                jobs={studentJobs}
                currentUser={currentUser}
                onRefresh={refreshData}
                onShowMessage={showToast}
              />
            )}

            {activeTab === 'payments' && (
              <PrintingPaymentsView
                payments={payments}
                currentUser={currentUser}
                onRefresh={refreshData}
                onShowMessage={showToast}
              />
            )}

            {activeTab === 'printers' && (
              <PrinterRegisterView
                printers={printers}
                currentUser={currentUser}
                onRefresh={refreshData}
                onShowMessage={showToast}
                onRequestConfirm={({ title, message, isDestructive, onConfirm }) =>
                  setConfirmDialog({
                    isOpen: true,
                    title,
                    message,
                    isDestructive: Boolean(isDestructive),
                    onConfirm,
                  })
                }
                onNavigateToMaintenance={(printerId) => setActiveTab('maintenance')}
              />
            )}

            {activeTab === 'cartridges' && (
              <TonerCartridgeView
                cartridges={cartridges}
                printers={printers}
                currentUser={currentUser}
                onRefresh={refreshData}
                onShowMessage={showToast}
                onRequestConfirm={({ title, message, isDestructive, onConfirm }) =>
                  setConfirmDialog({
                    isOpen: true,
                    title,
                    message,
                    isDestructive: Boolean(isDestructive),
                    onConfirm,
                  })
                }
              />
            )}

            {activeTab === 'maintenance' && (
              <MaintenanceLogView
                records={maintenance}
                printers={printers}
                currentUser={currentUser}
                onRefresh={refreshData}
                onShowMessage={showToast}
              />
            )}

            {activeTab === 'reports' && <ReportsAnalyticsView />}

            {activeTab === 'audit' && (
              <AuditLogView logs={auditLogs} currentUser={currentUser} />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                settings={settings}
                currentUser={currentUser}
                onRefresh={refreshData}
                onShowMessage={showToast}
                onOpenSpreadsheetModal={() => setIsSpreadsheetModalOpen(true)}
              />
            )}
          </div>
        </main>
      </div>

      {/* PDF Document Preview Modal */}
      <PdfPreviewModal
        isOpen={pdfPreview.isOpen}
        title={pdfPreview.title}
        pdfUrl={pdfPreview.url}
        documentId={pdfPreview.id}
        onClose={() => setPdfPreview({ isOpen: false, url: '', title: '', id: '' })}
      />

      {/* Spreadsheet Connection Modal */}
      <SpreadsheetSelectorModal
        isOpen={isSpreadsheetModalOpen}
        onClose={() => setIsSpreadsheetModalOpen(false)}
        onConnected={(id) => {
          setSpreadsheetId(id);
          refreshData();
          showToast('success', 'Google Spreadsheet connected and synchronized!');
        }}
      />

      {/* Mandatory User Confirmation Dialog */}
      <ConfirmationModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        isDestructive={confirmDialog.isDestructive}
        onConfirm={() => {
          confirmDialog.onConfirm();
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-3 duration-200">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span className="text-xs font-medium">{toast.text}</span>
          <button
            onClick={() => setToast(null)}
            className="p-1 text-slate-400 hover:text-white ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
