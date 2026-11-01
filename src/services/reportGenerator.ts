/**
 * Report & Analytics Generator
 * Supports high-fidelity PDF and CSV downloads for all 10 school modules
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SCHOOL_INFO } from '../config/constants';

interface ReportConfig {
  title: string;
  subtitle?: string;
  filename: string;
  headers: string[];
  rows: (string | number)[][];
  summaryNotes?: string[];
}

export const reportGenerator = {
  /**
   * Export CSV with UTF-8 BOM for Excel / Google Sheets compatibility
   */
  exportToCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
    const escapeCell = (val: string | number) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headerLine = headers.map(escapeCell).join(',');
    const dataLines = rows.map((r) => r.map(escapeCell).join(',')).join('\n');
    const csvContent = '\uFEFF' + headerLine + '\n' + dataLines;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Export formal Papine High School PDF Report
   */
  exportToPdf(config: ReportConfig): void {
    const doc = new jsPDF({
      orientation: config.headers.length > 6 ? 'landscape' : 'portrait',
      unit: 'pt',
      format: 'letter',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const now = new Date().toLocaleString('en-US', { timeZone: 'America/Jamaica' });

    // Header Navy Banner
    doc.setFillColor(11, 37, 69); // #0B2545 Papine Navy
    doc.rect(0, 0, pageWidth, 55, 'F');

    // Gold decorative stripe
    doc.setFillColor(217, 119, 6); // #D97706 Amber/Gold
    doc.rect(0, 55, pageWidth, 4, 'F');

    // School Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text(SCHOOL_INFO.name.toUpperCase(), 30, 26);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(220, 230, 245);
    doc.text(
      `${SCHOOL_INFO.systemTitle} • ${SCHOOL_INFO.address}`,
      30,
      42
    );

    // Report Title & Meta
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(config.title, 30, 80);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Generated: ${now} (Jamaica Time) | Currency: ${SCHOOL_INFO.currency}`, 30, 95);

    if (config.subtitle) {
      doc.text(config.subtitle, 30, 108);
    }

    let startY = config.subtitle ? 118 : 108;

    // Summary Notes if present
    if (config.summaryNotes && config.summaryNotes.length > 0) {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(30, startY, pageWidth - 60, 20 + config.summaryNotes.length * 13, 4, 4, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 58, 138);
      doc.text('KEY SUMMARY METRICS:', 40, startY + 14);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      config.summaryNotes.forEach((note, idx) => {
        doc.text(`• ${note}`, 45, startY + 28 + idx * 13);
      });

      startY += 30 + config.summaryNotes.length * 13;
    }

    // AutoTable Data
    autoTable(doc, {
      startY: startY + 10,
      head: [config.headers],
      body: config.rows as any,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 4,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.5,
      },
      headStyles: {
        fillColor: [19, 62, 135], // #133E87 Navy
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'left',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 30, right: 30 },
      didDrawPage: (data) => {
        // Footer
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `${SCHOOL_INFO.name} — Confidential Internal Document • Page ${data.pageNumber}`,
          30,
          pageHeight - 20
        );
        doc.text('Papine High School Media Centre', pageWidth - 160, pageHeight - 20);
      },
    });

    doc.save(`${config.filename}.pdf`);
  },

  /**
   * Generate an official receipt slip for student printing transactions
   */
  generateReceiptPdf(payment: {
    receiptRef: string;
    date: string;
    studentName: string;
    studentId: string;
    description: string;
    pages: number;
    copies: number;
    rateJMD: number;
    amountPaidJMD: number;
    outstandingBalanceJMD: number;
    cashierName: string;
  }): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [400, 520], // Receipt card format
    });

    const w = 400;

    // Header banner
    doc.setFillColor(11, 37, 69);
    doc.rect(0, 0, w, 55, 'F');
    doc.setFillColor(217, 119, 6);
    doc.rect(0, 55, w, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text(SCHOOL_INFO.name.toUpperCase(), w / 2, 25, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(220, 230, 245);
    doc.text('OFFICIAL PRINTING PAYMENT RECEIPT', w / 2, 42, { align: 'center' });

    // Receipt details
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(`Receipt #: ${payment.receiptRef}`, 30, 85);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${payment.date}`, w - 30, 85, { align: 'right' });

    doc.setDrawColor(203, 213, 225);
    doc.line(30, 95, w - 30, 95);

    // Student Information
    doc.setFont('helvetica', 'bold');
    doc.text('Payer:', 30, 115);
    doc.setFont('helvetica', 'normal');
    doc.text(`${payment.studentName} (${payment.studentId || 'N/A'})`, 90, 115);

    doc.setFont('helvetica', 'bold');
    doc.text('Item:', 30, 135);
    doc.setFont('helvetica', 'normal');
    doc.text(`${payment.description}`, 90, 135);

    doc.line(30, 150, w - 30, 150);

    // Charges Table
    const totalPages = payment.pages * payment.copies;
    const totalCost = totalPages * payment.rateJMD;

    doc.text(`Pages Printed: ${payment.pages} × ${payment.copies} copies = ${totalPages} pages`, 30, 175);
    doc.text(`Rate Per Page: JMD $${payment.rateJMD.toFixed(2)}`, 30, 195);
    doc.text(`Total Charge: JMD $${totalCost.toFixed(2)}`, 30, 215);

    doc.setFillColor(241, 245, 249);
    doc.rect(30, 230, w - 60, 50, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`Amount Paid: JMD $${payment.amountPaidJMD.toFixed(2)}`, 45, 252);

    doc.setFontSize(10);
    doc.setTextColor(payment.outstandingBalanceJMD > 0 ? 185 : 22, payment.outstandingBalanceJMD > 0 ? 28 : 101, payment.outstandingBalanceJMD > 0 ? 28 : 52);
    doc.text(
      `Outstanding Balance: JMD $${payment.outstandingBalanceJMD.toFixed(2)} ${payment.outstandingBalanceJMD === 0 ? '(CLEARED)' : '(PENDING)'}`,
      45,
      270
    );

    // Cashier & Stamp Box
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Cashier / Officer: ${payment.cashierName}`, 30, 310);

    doc.setDrawColor(148, 163, 184);
    doc.setLineDashPattern([2, 2], 0);
    doc.rect(w - 140, 300, 110, 60);
    doc.text('OFFICIAL STAMP', w - 85, 335, { align: 'center' });

    doc.setLineDashPattern([], 0);
    doc.text('Thank you for supporting Papine High School!', w / 2, 390, { align: 'center' });
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Keep this receipt as proof of document printing payment.', w / 2, 405, { align: 'center' });

    doc.save(`Receipt-${payment.receiptRef}.pdf`);
  },
};
