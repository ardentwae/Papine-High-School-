import React, { useState } from 'react';
import {
  Printer,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  XCircle,
  Activity,
  Layers,
  MapPin,
  Calendar,
  X,
} from 'lucide-react';
import { PrinterEquipment, PrinterStatus, UserProfile } from '../../types';
import { storageService } from '../../services/storageService';
import { googleSheetsService } from '../../services/googleSheetsService';

interface PrinterRegisterProps {
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
  onNavigateToMaintenance?: (printerId: string) => void;
}

export const PrinterRegisterView: React.FC<PrinterRegisterProps> = ({
  printers,
  currentUser,
  onRefresh,
  onShowMessage,
  onRequestConfirm,
  onNavigateToMaintenance,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [printerName, setPrinterName] = useState('');
  const [manufacturer, setManufacturer] = useState('HP');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [location, setLocation] = useState('Media Centre - Print Bay');
  const [isColor, setIsColor] = useState(false);
  const [supportsDuplex, setSupportsDuplex] = useState(true);
  const [maxPaperSize, setMaxPaperSize] = useState('Letter (8.5 x 11)');
  const [ipAddress, setIpAddress] = useState('192.168.10.');

  const canManageFleet =
    currentUser.role === 'System Administrator' ||
    currentUser.role === 'Printing Administrator' ||
    currentUser.role === 'Printing Staff';

  const handleStatusChange = (printer: PrinterEquipment, newStatus: PrinterStatus) => {
    if (!canManageFleet) {
      onShowMessage('error', 'Unauthorized: Insufficient permissions to change printer status.');
      return;
    }

    const isDestructive = newStatus === 'Retired' || newStatus === 'Faulty';

    onRequestConfirm({
      title: `Update Printer Status: ${printer.printerName}`,
      message: `Change hardware status to "${newStatus}"? This will alert operators and update the live queue availability.`,
      isDestructive,
      onConfirm: async () => {
        const currentPrinters = storageService.getPrinters();
        const updated = currentPrinters.map((p) =>
          p.printerId === printer.printerId ? { ...p, status: newStatus } : p
        );
        storageService.setPrinters(updated);

        await googleSheetsService.logAudit_(
          'Printer Register',
          'Update Printer Status',
          printer.printerId,
          `Hardware status of ${printer.printerName} changed to ${newStatus}`,
          currentUser
        );

        onShowMessage('success', `${printer.printerName} status updated to ${newStatus}.`);
        onRefresh();
      },
    });
  };

  const handleAddPrinter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!printerName.trim() || !model.trim()) {
      onShowMessage('error', 'Please provide a printer name and model number.');
      return;
    }

    const currentPrinters = storageService.getPrinters();
    const newId = `PRN-${String(currentPrinters.length + 1).padStart(2, '0')}`;
    const today = new Date().toISOString().split('T')[0];

    const newPrinter: PrinterEquipment = {
      printerId: newId,
      printerName: printerName.trim(),
      manufacturer,
      model: model.trim(),
      serialNumber: serialNumber.trim() || `SN-${Date.now().toString().slice(-6)}`,
      location: location.trim(),
      installationDate: today,
      status: 'Operational',
      isColor,
      supportsDuplex,
      maxPaperSize,
      ipAddress: ipAddress.trim(),
      totalPrintedPages: 0,
      notes: 'Hardware registered into school inventory',
    };

    const updated = [...currentPrinters, newPrinter];
    storageService.setPrinters(updated);

    await googleSheetsService.logAudit_(
      'Printer Register',
      'Add Printer',
      newId,
      `Registered new hardware ${newPrinter.printerName} (${newPrinter.manufacturer} ${newPrinter.model})`,
      currentUser
    );

    onShowMessage('success', `Printer ${newId} registered into the fleet!`);
    setIsAddModalOpen(false);
    resetForm();
    onRefresh();
  };

  const resetForm = () => {
    setPrinterName('');
    setModel('');
    setSerialNumber('');
    setIpAddress('192.168.10.');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-700 dark:text-blue-400" />
            <span>Printer Fleet Register & Hardware Assets</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Papine High School print bays, operational status, specifications, and total sheet counters.
          </p>
        </div>

        {canManageFleet && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Printer</span>
          </button>
        )}
      </div>

      {/* Fleet Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {printers.map((printer) => {
          const isOperational = printer.status === 'Operational';
          const isMaintenance = printer.status === 'Under Maintenance';
          const isFaulty = printer.status === 'Faulty';

          return (
            <div
              key={printer.printerId}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs hover:border-blue-400 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-2.5 rounded-xl ${
                        isOperational
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : isMaintenance
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      <Printer className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-slate-400">
                          {printer.printerId}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {printer.printerName}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {printer.manufacturer} {printer.model} • S/N: {printer.serialNumber}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isOperational
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : isMaintenance
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : isFaulty
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {isOperational && <CheckCircle2 className="w-3 h-3" />}
                    {isMaintenance && <Wrench className="w-3 h-3" />}
                    {isFaulty && <AlertTriangle className="w-3 h-3" />}
                    <span>{printer.status}</span>
                  </span>
                </div>

                {/* Specs Pill List */}
                <div className="flex flex-wrap gap-1.5 mt-3 text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {printer.isColor ? 'Full Color' : 'Monochrome'}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {printer.supportsDuplex ? 'Auto-Duplex' : 'Manual Duplex'}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    Max: {printer.maxPaperSize}
                  </span>
                  {printer.ipAddress && (
                    <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono">
                      IP: {printer.ipAddress}
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{printer.location}</span>
                </div>
              </div>

              {/* Footer Stats & Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Total Printed</span>
                  <div className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                    {printer.totalPrintedPages.toLocaleString()} pages
                  </div>
                </div>

                {canManageFleet && (
                  <div className="flex items-center gap-1.5">
                    <select
                      value={printer.status}
                      onChange={(e) =>
                        handleStatusChange(printer, e.target.value as PrinterStatus)
                      }
                      className="text-xs px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                    >
                      <option value="Operational">Operational</option>
                      <option value="Under Maintenance">Under Maintenance</option>
                      <option value="Faulty">Faulty</option>
                      <option value="Retired">Retired</option>
                    </select>

                    {onNavigateToMaintenance && (
                      <button
                        onClick={() => onNavigateToMaintenance(printer.printerId)}
                        className="p-1.5 text-slate-400 hover:text-amber-500 rounded-lg"
                        title="View Maintenance Records"
                      >
                        <Wrench className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Printer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Register New Printer Asset
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPrinter} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Printer Friendly Name *
                </label>
                <input
                  type="text"
                  value={printerName}
                  onChange={(e) => setPrinterName(e.target.value)}
                  placeholder="e.g. Media Centre Fast Laser 2"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Manufacturer
                  </label>
                  <select
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                  >
                    <option value="HP">HP</option>
                    <option value="Konica Minolta">Konica Minolta</option>
                    <option value="Canon">Canon</option>
                    <option value="Epson">Epson</option>
                    <option value="Brother">Brother</option>
                    <option value="Xerox">Xerox</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Model Number *
                  </label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g. LaserJet Pro M404dw"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="e.g. VNB3K9012"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Location / Room
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Staff Common Room"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Color Capable
                  </label>
                  <select
                    value={isColor ? 'true' : 'false'}
                    onChange={(e) => setIsColor(e.target.value === 'true')}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                  >
                    <option value="false">Mono Only</option>
                    <option value="true">Full Color</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Duplex Support
                  </label>
                  <select
                    value={supportsDuplex ? 'true' : 'false'}
                    onChange={(e) => setSupportsDuplex(e.target.value === 'true')}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    IP Address
                  </label>
                  <input
                    type="text"
                    value={ipAddress}
                    onChange={(e) => setIpAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white font-mono"
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
                  Save Printer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
