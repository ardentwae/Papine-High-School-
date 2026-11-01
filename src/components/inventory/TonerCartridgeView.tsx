import React, { useState } from 'react';
import {
  Package,
  Plus,
  AlertTriangle,
  CheckCircle2,
  MinusCircle,
  Truck,
  ArrowRight,
  Printer,
  DollarSign,
  X,
} from 'lucide-react';
import {
  CartridgeInventory,
  PrinterEquipment,
  UserProfile,
} from '../../types';
import { storageService } from '../../services/storageService';
import { googleSheetsService } from '../../services/googleSheetsService';

interface TonerCartridgeProps {
  cartridges: CartridgeInventory[];
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
}

export const TonerCartridgeView: React.FC<TonerCartridgeProps> = ({
  cartridges,
  printers,
  currentUser,
  onRefresh,
  onShowMessage,
  onRequestConfirm,
}) => {
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [selectedCartridge, setSelectedCartridge] = useState<CartridgeInventory | null>(null);

  // Issue Form State
  const [assignedPrinterId, setAssignedPrinterId] = useState(printers[0]?.printerId || '');
  const [issueQuantity, setIssueQuantity] = useState<number>(1);
  const [issueNotes, setIssueNotes] = useState('');

  // Restock Form State
  const [restockQty, setRestockQty] = useState<number>(4);
  const [unitCostJMD, setUnitCostJMD] = useState<number>(12500);

  const canManageStock =
    currentUser.role === 'System Administrator' ||
    currentUser.role === 'Printing Administrator' ||
    currentUser.role === 'Printing Staff';

  const handleIssueCartridge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCartridge) return;

    if (issueQuantity > selectedCartridge.currentStock) {
      onShowMessage('error', 'Cannot issue more cartridges than available stock.');
      return;
    }

    const currentStockList = storageService.getCartridges();
    const targetPrinter = printers.find((p) => p.printerId === assignedPrinterId);

    const updated = currentStockList.map((c) => {
      if (c.cartridgeId === selectedCartridge.cartridgeId) {
        const newStock = c.currentStock - issueQuantity;
        const newIssued = c.quantityIssued + issueQuantity;
        const newStatus =
          newStock <= 0 ? 'Out of Stock' : newStock <= c.reorderThreshold ? 'Low Stock' : 'Normal';

        return {
          ...c,
          currentStock: newStock,
          quantityIssued: newIssued,
          stockStatus: newStatus as any,
        };
      }
      return c;
    });

    storageService.setCartridges(updated);

    await googleSheetsService.logAudit_(
      'Toner Management',
      'Issue Toner',
      selectedCartridge.cartridgeId,
      `Issued ${issueQuantity}x ${selectedCartridge.modelNumber} to ${targetPrinter?.printerName || 'Printer'}. Notes: ${issueNotes}`,
      currentUser
    );

    onShowMessage(
      'success',
      `Issued ${issueQuantity} unit(s) of ${selectedCartridge.modelNumber} to ${targetPrinter?.printerName}.`
    );
    setIsIssueModalOpen(false);
    setSelectedCartridge(null);
    onRefresh();
  };

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCartridge) return;

    const currentStockList = storageService.getCartridges();
    const updated = currentStockList.map((c) => {
      if (c.cartridgeId === selectedCartridge.cartridgeId) {
        const newStock = c.currentStock + restockQty;
        const newReceived = c.quantityReceived + restockQty;
        const newStatus =
          newStock <= 0 ? 'Out of Stock' : newStock <= c.reorderThreshold ? 'Low Stock' : 'Normal';

        return {
          ...c,
          currentStock: newStock,
          quantityReceived: newReceived,
          stockStatus: newStatus as any,
          unitCostJMD,
        };
      }
      return c;
    });

    storageService.setCartridges(updated);

    await googleSheetsService.logAudit_(
      'Toner Management',
      'Restock Toner',
      selectedCartridge.cartridgeId,
      `Restocked +${restockQty} units of ${selectedCartridge.modelNumber} at JMD $${unitCostJMD}/unit`,
      currentUser
    );

    onShowMessage(
      'success',
      `Restocked +${restockQty} units of ${selectedCartridge.modelNumber}.`
    );
    setIsRestockModalOpen(false);
    setSelectedCartridge(null);
    onRefresh();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-700 dark:text-blue-400" />
            <span>Toner & Cartridge Consumables Inventory</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Stock ledger, reorder thresholds, equipment compatibility, and replacement issuances.
          </p>
        </div>
      </div>

      {/* Cartridge Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cartridges.map((cartridge) => {
          const isLow = cartridge.stockStatus === 'Low Stock';
          const isOut = cartridge.stockStatus === 'Out of Stock';

          return (
            <div
              key={cartridge.cartridgeId}
              className={`bg-white dark:bg-slate-900 rounded-xl border p-5 shadow-2xs flex flex-col justify-between transition ${
                isOut
                  ? 'border-rose-400 dark:border-rose-800'
                  : isLow
                  ? 'border-amber-400 dark:border-amber-800'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-slate-400">
                      {cartridge.cartridgeId}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {cartridge.modelNumber}
                    </h3>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isOut
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        : isLow
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}
                  >
                    {isOut && <AlertTriangle className="w-2.5 h-2.5" />}
                    {isLow && <AlertTriangle className="w-2.5 h-2.5" />}
                    {!isLow && !isOut && <CheckCircle2 className="w-2.5 h-2.5" />}
                    <span>{cartridge.stockStatus}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`w-3 h-3 rounded-full border border-slate-300 shrink-0 ${
                      cartridge.color === 'Black'
                        ? 'bg-black'
                        : cartridge.color === 'Cyan'
                        ? 'bg-cyan-500'
                        : cartridge.color === 'Magenta'
                        ? 'bg-pink-500'
                        : 'bg-yellow-400'
                    }`}
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {cartridge.color} Cartridge
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs space-y-1 mb-3">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span>Compatible:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                      {cartridge.compatiblePrinters}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span>Supplier:</span>
                    <span className="truncate max-w-[140px]">{cartridge.supplier}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span>Unit Cost:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      JMD ${cartridge.unitCostJMD.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Stock Level Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      Current In-Stock:
                    </span>
                    <span
                      className={`font-mono font-black text-sm ${
                        isLow || isOut ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {cartridge.currentStock} units
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Reorder Threshold: {cartridge.reorderThreshold} units | Issued: {cartridge.quantityIssued}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {canManageStock && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      setSelectedCartridge(cartridge);
                      setIsRestockModalOpen(true);
                    }}
                    className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition"
                  >
                    Restock
                  </button>

                  <button
                    onClick={() => {
                      setSelectedCartridge(cartridge);
                      setIsIssueModalOpen(true);
                    }}
                    disabled={cartridge.currentStock <= 0}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-800 hover:bg-blue-900 text-white text-xs font-bold rounded-lg shadow-2xs transition disabled:opacity-40"
                  >
                    <MinusCircle className="w-3.5 h-3.5" />
                    <span>Issue to Printer</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Issue Modal */}
      {isIssueModalOpen && selectedCartridge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Issue Cartridge to Equipment
              </h3>
              <button
                onClick={() => setIsIssueModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIssueCartridge} className="p-5 space-y-3.5 text-xs">
              <div>
                <span className="text-slate-400">Selected Item:</span>
                <p className="font-bold text-slate-900 dark:text-white text-sm">
                  {selectedCartridge.modelNumber} ({selectedCartridge.color})
                </p>
                <p className="text-slate-500">
                  Available in Stock: {selectedCartridge.currentStock} units
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Destination Printer *
                </label>
                <select
                  value={assignedPrinterId}
                  onChange={(e) => setAssignedPrinterId(e.target.value)}
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
                  Quantity to Issue
                </label>
                <input
                  type="number"
                  min={1}
                  max={selectedCartridge.currentStock}
                  value={issueQuantity}
                  onChange={(e) => setIssueQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Issuance Notes
                </label>
                <input
                  type="text"
                  value={issueNotes}
                  onChange={(e) => setIssueNotes(e.target.value)}
                  placeholder="e.g. Replaced spent toner during exam prep"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(false)}
                  className="px-3 py-1.5 text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white font-bold rounded-lg shadow-xs"
                >
                  Confirm Issuance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {isRestockModalOpen && selectedCartridge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Restock Consumable Cartridges
              </h3>
              <button
                onClick={() => setIsRestockModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRestock} className="p-5 space-y-3.5 text-xs">
              <div>
                <span className="text-slate-400">Item:</span>
                <p className="font-bold text-slate-900 dark:text-white text-sm">
                  {selectedCartridge.modelNumber}
                </p>
                <p className="text-slate-500">
                  Current In Stock: {selectedCartridge.currentStock} units
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Units Received
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={restockQty}
                    onChange={(e) => setRestockQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Unit Cost (JMD $)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={unitCostJMD}
                    onChange={(e) => setUnitCostJMD(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRestockModalOpen(false)}
                  className="px-3 py-1.5 text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-xs"
                >
                  Add to Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
