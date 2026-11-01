/**
 * Papine High School - Printing & Document Management System
 * Core Data Models & 11 Spreadsheet Tab Schemas
 */

export type UserRole =
  | 'System Administrator'
  | 'Printing Administrator'
  | 'Printing Staff'
  | 'Teacher'
  | 'Finance Officer'
  | 'Read-only Management';

export interface UserProfile {
  email: string;
  name: string;
  photoURL?: string;
  role: UserRole;
  department?: string;
  tokenBalance?: number;
}

export type DocumentCategory =
  | 'Examination Paper'
  | 'Class Quiz / Test'
  | 'Lesson Handout'
  | 'Homework Assignment'
  | 'Administrative Notice'
  | 'PTA Document'
  | 'Syllabus / Curriculum'
  | 'Student Worksheet'
  | 'Official School Letter'
  | 'Report Card / Form'
  | 'Other';

export type PrintingType = 'Black & White' | 'Full Color' | 'Spot Color';
export type PaperSize = 'Letter (8.5 x 11)' | 'Legal (8.5 x 14)' | 'Tabloid (11 x 17)' | 'A4';
export type PriorityLevel = 'Normal' | 'High' | 'Urgent';

export type DocumentStatus =
  | 'Registered'
  | 'Pending Queue'
  | 'Queued'
  | 'Printing'
  | 'Completed'
  | 'Delivered'
  | 'Cancelled';

export type QueueStatus =
  | 'Pending'
  | 'Printing'
  | 'Completed'
  | 'Delivered'
  | 'Cancelled';

// Tab 1: Documents (Document Register) - 17 required fields
export interface DocumentRecord {
  documentId: string;       // e.g. "DOC-2026-0001"
  dateReceived: string;     // YYYY-MM-DD
  timeReceived: string;     // HH:MM
  submittedBy: string;      // User email / name
  teacherName: string;
  department: string;
  documentTitle: string;
  documentCategory: DocumentCategory;
  numberOfPages: number;
  numberOfCopies: number;
  printingType: PrintingType;
  duplexPrinting: boolean;
  paperSize: PaperSize;
  dateNeeded: string;
  priority: PriorityLevel;
  pdfAttachment: string;    // Google Drive URL or File Name / ID
  pdfFileId?: string;       // Google Drive File ID
  status: DocumentStatus;
  notes: string;
}

// Tab 2: Printing_Queue
export interface QueueItem {
  queueId: string;          // e.g. "Q-001"
  position: number;         // 1, 2, 3...
  documentId: string;       // Foreign key to DocumentRecord
  documentTitle: string;
  teacherName: string;
  department: string;
  numberOfPages: number;
  numberOfCopies: number;
  totalSheets: number;      // Calculated pages * copies (or adjusted for duplex)
  printingType: PrintingType;
  paperSize: PaperSize;
  duplexPrinting: boolean;
  priority: PriorityLevel;
  status: QueueStatus;
  assignedPrinterId?: string;
  assignedPrinterName?: string;
  dateAdded: string;
  timeAdded: string;
  startTime?: string;
  completionTime?: string;
  staffAssigned?: string;
}

// Tab 3: Teachers (Teacher Accounts)
export interface TeacherAccount {
  teacherId: string;        // e.g. "TCH-001"
  teacherName: string;
  email: string;
  department: string;
  status: 'Active' | 'Inactive';
  tokenAllocation: number;  // Term allowance, e.g. 1000 pages
  tokensUsed: number;
  remainingBalance: number;
  warningThreshold: number; // e.g. 150 or 20%
  lastPrintingDate?: string;
  notes?: string;
}

// Tab 4: Student_Printing
export interface StudentPrintJob {
  jobId: string;            // e.g. "STU-2026-001"
  studentId: string;        // e.g. "PHS-2023-4819"
  studentName: string;
  grade: string;            // e.g. "Grade 7", "Grade 10", "Grade 11", "Grade 12", "Grade 13"
  schoolClass: string;      // e.g. "11-Science-1", "9A", "7B"
  requestDate: string;
  description: string;
  pagesPrinted: number;
  copies: number;
  totalPageCount: number;
  ratePerPageJMD: number;   // e.g. 15 JMD
  totalChargeJMD: number;   // pages * copies * rate
  amountPaidJMD: number;
  outstandingBalanceJMD: number;
  paymentStatus: 'Paid' | 'Partial' | 'Unpaid';
  receiptReference?: string;
  notes?: string;
}

// Tab 5: Payments (Printing Payments)
export interface PaymentRecord {
  paymentId: string;        // e.g. "PAY-2026-0042"
  paymentReference: string; // e.g. "REC-9402"
  paymentDate: string;      // YYYY-MM-DD
  paymentTime: string;      // HH:MM
  payerName: string;
  payerType: 'Student' | 'Teacher / Staff' | 'External' | 'Department';
  studentOrEmployeeId?: string;
  linkedJobId?: string;
  description: string;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'School Card' | 'Cheque';
  amountChargedJMD: number;
  amountPaidJMD: number;
  outstandingBalanceJMD: number;
  receivedBy: string;       // Staff member
  notes?: string;
}

// Tab 6: Printers (Printer Register)
export type PrinterStatus = 'Operational' | 'Faulty' | 'Under Maintenance' | 'Retired';

export interface PrinterEquipment {
  printerId: string;        // e.g. "PRN-01"
  printerName: string;      // e.g. "Media Centre HP LaserJet Pro M404n"
  manufacturer: string;     // HP, Canon, Konica Minolta, Epson
  model: string;
  serialNumber: string;
  location: string;         // "Media Centre Room 2", "Main Office", "Staff Room"
  installationDate: string;
  status: PrinterStatus;
  isColor: boolean;
  supportsDuplex: boolean;
  maxPaperSize: string;
  ipAddress?: string;
  totalPrintedPages: number;
  lastServiceDate?: string;
  notes?: string;
}

// Tab 7: Toner_Cartridges (Toner & Cartridge Management)
export interface CartridgeInventory {
  cartridgeId: string;      // e.g. "TON-01"
  modelNumber: string;      // e.g. "HP 58A (CF258A)"
  compatiblePrinters: string; // e.g. "PRN-01 (HP LaserJet M404n)"
  color: 'Black' | 'Cyan' | 'Magenta' | 'Yellow';
  supplier: string;         // e.g. "Kingston Office Supplies Ltd."
  purchaseDate: string;
  quantityReceived: number;
  quantityIssued: number;
  currentStock: number;
  reorderThreshold: number; // e.g. 2
  stockStatus: 'Normal' | 'Low Stock' | 'Out of Stock';
  unitCostJMD: number;
  notes?: string;
}

// Tab 8: Maintenance_Log
export interface MaintenanceRecord {
  logId: string;            // e.g. "MNT-2026-001"
  printerId: string;
  printerName: string;
  maintenanceDate: string;
  faultDescription: string;
  maintenancePerformed: string;
  technician: string;       // Name or Service Company
  technicianContact?: string;
  costJMD: number;
  partsReplaced: string;
  nextMaintenanceDate: string;
  maintenanceStatus: 'Scheduled' | 'In Progress' | 'Completed' | 'Pending Parts';
  notes?: string;
}

// Tab 9: Audit_Log
export interface AuditRecord {
  auditId: string;          // e.g. "AUD-10023"
  timestamp: string;        // ISO string or YYYY-MM-DD HH:MM:SS
  userEmail: string;
  userName: string;
  userRole: UserRole;
  module:
    | 'Dashboard'
    | 'Document Register'
    | 'Printing Queue'
    | 'Teacher Accounts'
    | 'Student Printing'
    | 'Printing Payments'
    | 'Printer Register'
    | 'Toner Management'
    | 'Maintenance Log'
    | 'Reports'
    | 'Settings'
    | 'Authentication';
  action:
    | 'Login'
    | 'Logout'
    | 'Register Document'
    | 'Update Document Status'
    | 'Add to Queue'
    | 'Update Queue Status'
    | 'Reorder Queue'
    | 'Adjust Allowance'
    | 'Create Teacher'
    | 'Update Teacher'
    | 'Create Student Job'
    | 'Record Payment'
    | 'Add Printer'
    | 'Update Printer Status'
    | 'Issue Toner'
    | 'Restock Toner'
    | 'Log Maintenance'
    | 'Update Settings'
    | 'Export Report';
  recordId: string;
  details: string;
}

// Tab 10: Dashboard_Data (Administrative Snapshot / Apps Script Cache)
export interface DashboardStats {
  totalDocumentsReceived: number;
  documentsPending: number;
  documentsPrinting: number;
  documentsCompleted: number;
  documentsDelivered: number;
  activeTeachers: number;
  totalTeacherAllowanceAllocated: number;
  totalTeacherAllowanceUsed: number;
  teachersApproachingLimit: number;
  totalStudentTransactions: number;
  studentRevenueJMD: number;
  outstandingStudentPaymentsJMD: number;
  operationalPrinters: number;
  printersUnderMaintenance: number;
  lowStockCartridges: number;
  lastUpdated: string;
}

// Tab 11: Settings (School Config & Policies)
export interface SystemSettings {
  schoolName: string;
  motto: string;
  address: string;
  phone: string;
  email: string;
  currency: string;             // JMD
  timeZone: string;             // America/Jamaica
  studentRatePerPageJMD: number;// default 15
  studentColorRateJMD: number;  // default 40
  defaultTeacherAllowance: number; // default 1000 pages
  warningThresholdPercent: number; // default 20%
  driveFolderId: string;
  driveFolderName: string;
  spreadsheetId: string;
  allowSelfRegistration: boolean;
  enableDuplicateQueueCheck: boolean;
  departments: string[];
}
