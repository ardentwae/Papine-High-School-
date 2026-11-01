import React, { useState } from 'react';
import {
  Wrench,
  Plus,
  Search,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Printer,
  X,
} from 'lucide-react';
import {
  MaintenanceRecord,
  PrinterEquipment,
  UserProfile,
} from '../../types';
import { storageService } from '../../services/storageService';
import { googleSheetsService } from '../../services/googleSheetsService';

interface MaintenanceLogProps {
  records: MaintenanceRecord[];
  printers: PrinterEquipment[];
  currentUser: UserProfile;
  onRefresh: () => void;
  onShowMessage: (type: 'success' | 'error', text: string) => void;
  initialPrinterFilter?: string;
}

export const MaintenanceLogView: React.FC<MaintenanceLogProps> = ({
  records,
  printers,
  currentUser,
  onRefresh,
  onShowMessage,
  initialPrinterFilter = 'ALL',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [printerFilter, setPrinterFilter] = useState(initialPrinterFilter);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [selectedPrinterId, setSelectedPrinterId] = useState(printers[0]?.printerId || '');
  const [faultDescription, setFaultDescription] = useState('');
  const [maintenancePerformed, setMaintenancePerformed] = useState('');
  const [technician, setTechnician] = useState('');
  const [technicianContact, setTechnicianContact] = useState('');
  const [costJMD, setCostJMD] = useState<number>(0);
  const [partsReplaced, setPartsReplaced] = useState('None');
  const [nextMaintenanceDate, setNextMaintenanceDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d.toISOString().split('T')[0];
  });
  const [maintenanceStatus, setMaintenanceStatus] = useState<MaintenanceRecord['maintenanceStatus']>('Completed');
  const [notes, setNotes] = useState('');

  const canLogMaintenance =
    currentUser.role === 'System Administrator' ||
    currentUser.role === 'Printing Administrator' ||
    currentUser.role === 'Printing Staff';

  const totalMaintenanceCostJMD = records.reduce((acc, r) => acc + (r.costJMD || 0), 0);

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.printerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.faultDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.technician.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPrinter = printerFilter === 'ALL' || r.printerId === printerFilter;
    const matchesStatus = statusFilter === 'ALL' || r.maintenanceStatus === statusFilter;
    return matchesSearch && matchesPrinter && matchesStatus;
  });

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faultDescription.trim() || !technician.trim()) {
      onShowMessage('error', 'Please provide fault description and technician name.');
      return;
    }

    const currentRecords = storageService.getMaintenance();
    const newId = `MNT-2026-${String(currentRecords.length + 1).padStart(3, '0')}`;
    const targetPrinter = printers.find((p) => p.printerId === selectedPrinterId);
    const today = new Date().toISOString().split('T')[0];

    const newRecord: MaintenanceRecord = {
      logId: newId,
      printerId: selectedPrinterId,
      printerName: targetPrinter?.printerName || 'School Printer',
      maintenanceDate: today,
      faultDescription: faultDescription.trim(),
      maintenancePerformed: maintenancePerformed.trim() || 'Inspection & Cleaning',
      technician: technician.trim(),
      technicianContact: technicianContact.trim(),
      costJMD,
      partsReplaced: partsReplaced.trim(),
      nextMaintenanceDate,
      maintenanceStatus,
      notes,
    };

    const updated = [newRecord, ...currentRecords];
    storageService.setMaintenance(updated);

    // If maintenance status is In Progress, update printer equipment status
    if (targetPrinter) {
      const currentPrinters = storageService.getPrinters();
      const updatedPrinters = currentPrinters.map((p) => {
        if (p.printerId === targetPrinter.printerId) {
          const printerStatus =
            maintenanceStatus === 'Completed'
              ? 'Operational'
              : 'Under Maintenance';
          return {
            ...p,
            status: printerStatus as any,
            lastServiceDate: today,
          };
        }
        return p;
      });
      storageService.setPrinters(updatedPrinters);
    }

    await googleSheetsService.logAudit_(
      'Maintenance Log',
      'Log Maintenance',
      newId,
      `Logged ${maintenanceStatus} service for ${targetPrinter?.printerName} by ${technician} (Cost: JMD $${costJMD})`,
      currentUser
    );

    onShowMessage('success', `Maintenance record ${newId} logged!`);
    setIsAddModalOpen(false);
    resetForm();
    onRefresh();
  };

  const resetForm = () => {
    setFaultDescription('');
    setMaintenancePerformed('');
    setTechnician('');
    setTechnicianContact('');
    setCostJMD(0);
    setPartsReplaced('None');
    setNotes('');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-blue-700 dark:text-blue-400" />
            <span>Printer Fleet Maintenance Log</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track hardware breakdowns, technician service visits, replaced spare parts, and JMD maintenance expenditures.
          </p>
        </div>

        {canLogMaintenance && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Log Maintenance Event</span>
          </button>
        )}
      </div>

      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Service Expenditure
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
            JMD ${totalMaintenanceCostJMD.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Technicians and spare parts</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Active Maintenance Calls
          </span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-1">
            {records.filter((r) => r.maintenanceStatus !== 'Completed').length}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">In progress or parts pending</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Completed Servicings
          </span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
            {records.filter((r) => r.maintenanceStatus === 'Completed').length}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Hardware returned to operation</p>
        </div>
      </div>

      {/* Filter / Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search faults, technician, or parts..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white focus:outline-hidden"
          />
        </div>

        <div>
          <select
            value={printerFilter}
            onChange={(e) => setPrinterFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
          >
            <option value="ALL">All Printers</option>
            {printers.map((p) => (
              <option key={p.printerId} value={p.printerId}>
                {p.printerId} — {p.printerName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
          >
            <option value="ALL">All Maintenance Statuses</option>
            <option value="Completed">Completed</option>
            <option value="In Progress">In Progress</option>
            <option value="Pending Parts">Pending Parts</option>
            <option value="Scheduled">Scheduled</option>
          </select>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Log ID & Date</th>
                <th className="px-4 py-3">Printer</th>
                <th className="px-4 py-3">Fault Reported</th>
                <th className="px-4 py-3">Work Performed & Parts</th>
                <th className="px-4 py-3">Technician</th>
                <th className="px-4 py-3">Cost (JMD)</th>
                <th className="px-4 py-3">Next Due</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRecords.map((m) => (
                <tr
                  key={m.logId}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                >
                  <td className="px-4 py-3 font-mono">
                    <div className="font-bold text-blue-700 dark:text-blue-400">
                      {m.logId}
                    </div>
                    <div className="text-[10px] text-slate-400">{m.maintenanceDate}</div>
                  </td>

                  <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                    <div>{m.printerName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{m.printerId}</div>
                  </td>

                  <td className="px-4 py-3 max-w-xs text-slate-700 dark:text-slate-300">
                    {m.faultDescription}
                  </td>

                  <td className="px-4 py-3 max-w-xs">
                    <div className="text-slate-800 dark:text-slate-200">
                      {m.maintenancePerformed}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Parts: {m.partsReplaced}
                    </div>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {m.technician}
                    </div>
                    {m.technicianContact && (
                      <div className="text-[10px] text-slate-400">{m.technicianContact}</div>
                    )}
                  </td>

                  <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                    JMD ${m.costJMD.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap text-slate-500 dark:text-slate-400">
                    {m.nextMaintenanceDate || 'Not Scheduled'}
                  </td>

                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        m.maintenanceStatus === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : m.maintenanceStatus === 'In Progress'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : m.maintenanceStatus === 'Pending Parts'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {m.maintenanceStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Maintenance Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Record Equipment Maintenance & Service
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddRecord} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Printer Equipment *
                </label>
                <select
                  value={selectedPrinterId}
                  onChange={(e) => setSelectedPrinterId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                  required
                >
                  {printers.map((p) => (
                    <option key={p.printerId} value={p.printerId}>
                      {p.printerId} — {p.printerName} ({p.location})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Fault or Issue Description *
                </label>
                <textarea
                  rows={2}
                  value={faultDescription}
                  onChange={(e) => setFaultDescription(e.target.value)}
                  placeholder="e.g. Paper jam error 13.00, duplexer squeak"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Maintenance / Action Performed
                </label>
                <input
                  type="text"
                  value={maintenancePerformed}
                  onChange={(e) => setMaintenancePerformed(e.target.value)}
                  placeholder="e.g. Cleaned pickup rollers, replaced fuser film sleeve"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Technician / Company *
                  </label>
                  <input
                    type="text"
                    value={technician}
                    onChange={(e) => setTechnician(e.target.value)}
                    placeholder="e.g. Island Digital Systems Ltd."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={technicianContact}
                    onChange={(e) => setTechnicianContact(e.target.value)}
                    placeholder="(876) 929-3301"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cost (JMD $)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={costJMD}
                    onChange={(e) => setCostJMD(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Parts Replaced
                  </label>
                  <input
                    type="text"
                    value={partsReplaced}
                    onChange={(e) => setPartsReplaced(e.target.value)}
                    placeholder="e.g. Pickup roller kit"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={maintenanceStatus}
                    onChange={(e) => setMaintenanceStatus(e.target.value as any)}
                    className="w-full px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                  >
                    <option value="Completed">Completed</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Pending Parts">Pending Parts</option>
                    <option value="Scheduled">Scheduled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Next Scheduled Maintenance Date
                </label>
                <input
                  type="date"
                  value={nextMaintenanceDate}
                  onChange={(e) => setNextMaintenanceDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                />
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
                  Save Maintenance Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
