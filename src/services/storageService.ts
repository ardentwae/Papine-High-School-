/**
 * Local Data Storage Service
 * Provides instantaneous caching, offline fallback, and synchronization
 * for Papine High School's 11 system tabs.
 */
import {
  DocumentRecord,
  QueueItem,
  TeacherAccount,
  StudentPrintJob,
  PaymentRecord,
  PrinterEquipment,
  CartridgeInventory,
  MaintenanceRecord,
  AuditRecord,
  SystemSettings,
  DashboardStats,
} from '../types';
import {
  INITIAL_DOCUMENTS,
  INITIAL_QUEUE,
  INITIAL_TEACHERS,
  INITIAL_STUDENT_JOBS,
  INITIAL_PAYMENTS,
  INITIAL_PRINTERS,
  INITIAL_CARTRIDGES,
  INITIAL_MAINTENANCE,
  INITIAL_AUDIT,
  DEFAULT_SETTINGS,
} from '../config/constants';

const KEYS = {
  DOCUMENTS: 'phs_print_documents_v1',
  QUEUE: 'phs_print_queue_v1',
  TEACHERS: 'phs_print_teachers_v1',
  STUDENT_PRINTING: 'phs_print_students_v1',
  PAYMENTS: 'phs_print_payments_v1',
  PRINTERS: 'phs_print_printers_v1',
  CARTRIDGES: 'phs_print_cartridges_v1',
  MAINTENANCE: 'phs_print_maintenance_v1',
  AUDIT: 'phs_print_audit_v1',
  SETTINGS: 'phs_print_settings_v1',
  SPREADSHEET_ID: 'phs_spreadsheet_id_v1',
  THEME: 'phs_theme_v1',
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`Failed to parse cache for ${key}:`, e);
    return fallback;
  }
}

function save<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to write cache for ${key}:`, e);
  }
}

export const storageService = {
  getSpreadsheetId: (): string => {
    return localStorage.getItem(KEYS.SPREADSHEET_ID) || '';
  },
  setSpreadsheetId: (id: string): void => {
    localStorage.setItem(KEYS.SPREADSHEET_ID, id.trim());
  },

  getDocuments: (): DocumentRecord[] => load(KEYS.DOCUMENTS, INITIAL_DOCUMENTS),
  setDocuments: (docs: DocumentRecord[]) => save(KEYS.DOCUMENTS, docs),

  getQueue: (): QueueItem[] => load(KEYS.QUEUE, INITIAL_QUEUE),
  setQueue: (q: QueueItem[]) => save(KEYS.QUEUE, q),

  getTeachers: (): TeacherAccount[] => load(KEYS.TEACHERS, INITIAL_TEACHERS),
  setTeachers: (teachers: TeacherAccount[]) => save(KEYS.TEACHERS, teachers),

  getStudentJobs: (): StudentPrintJob[] => load(KEYS.STUDENT_PRINTING, INITIAL_STUDENT_JOBS),
  setStudentJobs: (jobs: StudentPrintJob[]) => save(KEYS.STUDENT_PRINTING, jobs),

  getPayments: (): PaymentRecord[] => load(KEYS.PAYMENTS, INITIAL_PAYMENTS),
  setPayments: (payments: PaymentRecord[]) => save(KEYS.PAYMENTS, payments),

  getPrinters: (): PrinterEquipment[] => load(KEYS.PRINTERS, INITIAL_PRINTERS),
  setPrinters: (printers: PrinterEquipment[]) => save(KEYS.PRINTERS, printers),

  getCartridges: (): CartridgeInventory[] => load(KEYS.CARTRIDGES, INITIAL_CARTRIDGES),
  setCartridges: (c: CartridgeInventory[]) => save(KEYS.CARTRIDGES, c),

  getMaintenance: (): MaintenanceRecord[] => load(KEYS.MAINTENANCE, INITIAL_MAINTENANCE),
  setMaintenance: (m: MaintenanceRecord[]) => save(KEYS.MAINTENANCE, m),

  getAuditLogs: (): AuditRecord[] => load(KEYS.AUDIT, INITIAL_AUDIT),
  setAuditLogs: (logs: AuditRecord[]) => save(KEYS.AUDIT, logs),

  getSettings: (): SystemSettings => load(KEYS.SETTINGS, DEFAULT_SETTINGS),
  setSettings: (settings: SystemSettings) => save(KEYS.SETTINGS, settings),

  calculateDashboardStats: (): DashboardStats => {
    const docs = storageService.getDocuments();
    const queue = storageService.getQueue();
    const teachers = storageService.getTeachers();
    const students = storageService.getStudentJobs();
    const printers = storageService.getPrinters();
    const cartridges = storageService.getCartridges();

    const activeTeachers = teachers.filter((t) => t.status === 'Active');
    const totalAllocated = activeTeachers.reduce((acc, t) => acc + (t.tokenAllocation || 0), 0);
    const totalUsed = activeTeachers.reduce((acc, t) => acc + (t.tokensUsed || 0), 0);
    const approachingLimit = activeTeachers.filter(
      (t) => t.remainingBalance <= (t.warningThreshold || 200)
    ).length;

    const studentRevenue = students.reduce((acc, s) => acc + (s.amountPaidJMD || 0), 0);
    const outstanding = students.reduce((acc, s) => acc + (s.outstandingBalanceJMD || 0), 0);

    const operationalPrinters = printers.filter((p) => p.status === 'Operational').length;
    const maintenancePrinters = printers.filter((p) => p.status === 'Under Maintenance' || p.status === 'Faulty').length;
    const lowStock = cartridges.filter((c) => c.currentStock <= c.reorderThreshold).length;

    const nowStr = new Date().toLocaleString('en-US', { timeZone: 'America/Jamaica' });

    return {
      totalDocumentsReceived: docs.length,
      documentsPending: queue.filter((q) => q.status === 'Pending').length,
      documentsPrinting: queue.filter((q) => q.status === 'Printing').length,
      documentsCompleted: docs.filter((d) => d.status === 'Completed').length,
      documentsDelivered: docs.filter((d) => d.status === 'Delivered').length,
      activeTeachers: activeTeachers.length,
      totalTeacherAllowanceAllocated: totalAllocated,
      totalTeacherAllowanceUsed: totalUsed,
      teachersApproachingLimit: approachingLimit,
      totalStudentTransactions: students.length,
      studentRevenueJMD: studentRevenue,
      outstandingStudentPaymentsJMD: outstanding,
      operationalPrinters,
      printersUnderMaintenance: maintenancePrinters,
      lowStockCartridges: lowStock,
      lastUpdated: nowStr,
    };
  },
};
