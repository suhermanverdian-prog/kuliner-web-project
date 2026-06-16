import { useState, useMemo } from 'react';
import { useShifts, useAddShift, useCloseShift } from './queries/useShifts';

const formatCurrency = (n) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n || 0);

export function useShiftPage({ user }) {
  // React-Query Hooks
  const { data: shiftsData, isLoading, isError, refetch } = useShifts();
  const { mutateAsync: addShift, isPending: isAdding } = useAddShift();
  const { mutateAsync: closeShift, isPending: isClosing } = useCloseShift();

  // Local State for Modals
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);

  // Form State
  const [initialCash, setInitialCash] = useState('');
  const [closingCash, setClosingCash] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  
  // Validation State
  const [closingCashError, setClosingCashError] = useState('');

  // Derived State
  const shifts = Array.isArray(shiftsData) ? shiftsData : [];
  const activeShift = useMemo(() => {
    return shifts.find((s) => s?.status === 'open') || null;
  }, [shifts]);

  const handleOpenShift = async () => {
    if (!user) return alert('Sesi berakhir, silakan login kembali.');
    const u = user.user || user;
    const uId = u.id || 'unknown';
    const uName = u.name || u.username || 'Kasir';

    try {
      await addShift({
        userId: uId,
        userName: uName,
        kasir: uName,
        openTime: new Date().toISOString(),
        openCash: Number(initialCash || 0),
        status: 'open',
      });
      setShowOpenModal(false);
      setInitialCash('');
    } catch (err) {
      alert('Gagal membuka shift');
    }
  };

  const handleCloseShift = async () => {
    if (!activeShift) return;

    // Strict positive number validation
    const cashValue = Number(closingCash);
    if (!closingCash || isNaN(cashValue) || cashValue < 0) {
      setClosingCashError('Uang fisik harus berupa angka valid (minimal 0).');
      return;
    }
    
    setClosingCashError('');

    try {
      await closeShift({
        id: activeShift.id,
        data: {
          closingCash: cashValue,
          notes: closingNotes,
        },
      });

      setClosingCash('');
      setClosingNotes('');
      setShowCloseModal(false);
    } catch (err) {
      alert('Gagal menutup shift: ' + err.message);
    }
  };

  const getKasirName = (s) => s?.userName || s?.kasir || 'Kasir';
  
  const generatePDF = async (s) => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text('KEN ENTERPRISE - SHIFT AUDIT', 14, 22);
    doc.setFontSize(10);
    doc.text(`ID Sesi: ${s.id}`, 14, 30);
    doc.text(`Dicetak pada: ${new Date().toLocaleString()}`, 14, 35);

    doc.line(14, 40, 196, 40);

    doc.setFontSize(12);
    doc.text('DETAIL SESI', 14, 50);
    doc.setFontSize(10);
    doc.text(`Operator: ${getKasirName(s)}`, 14, 60);
    doc.text(`Waktu Buka: ${new Date(s.openTime || s.start_time || s.created_at).toLocaleString()}`, 14, 65);
    doc.text(`Waktu Tutup: ${s.closeTime ? new Date(s.closeTime).toLocaleString() : 'Masih Terbuka'}`, 14, 70);

    doc.setFontSize(12);
    doc.text('AUDIT FINANSIAL', 14, 85);
    doc.setFontSize(10);
    doc.text(`Modal Awal: ${formatCurrency(s.openCash || s.initial_cash)}`, 14, 95);
    doc.text(`Total Penjualan: ${formatCurrency(s.totalSales || s.total_sales)}`, 14, 100);
    doc.text(`Saldo Seharusnya (Expected): ${formatCurrency(s.expected_cash)}`, 14, 105);
    doc.text(`Uang Fisik di Laci (Actual): ${formatCurrency(s.closing_cash)}`, 14, 110);

    const diff = s.difference || 0;
    doc.setFont(undefined, 'bold');
    doc.text(`Selisih: ${formatCurrency(diff)} ${diff === 0 ? '(MATCH)' : '(DISCREPANCY)'}`, 14, 120);
    doc.setFont(undefined, 'normal');

    doc.text('Catatan Auditor:', 14, 135);
    doc.text(s.notes || '-', 14, 140, { maxWidth: 180 });

    doc.setFontSize(8);
    doc.text('Dokumen ini dihasilkan secara otomatis oleh KEN Enterprise ERP.', 14, 280);

    doc.save(`Shift_Report_${s.id.slice(-6)}.pdf`);
  };

  const getInitials = (name) =>
    name
      ?.split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2) || '??';

  return {
    shiftsData, isLoading, isError, refetch,
    isAdding, isClosing,
    showOpenModal, setShowOpenModal,
    showCloseModal, setShowCloseModal,
    initialCash, setInitialCash,
    closingCash, setClosingCash,
    closingNotes, setClosingNotes,
    closingCashError, setClosingCashError,
    shifts, activeShift,
    handleOpenShift,
    handleCloseShift,
    generatePDF,
    getKasirName,
    getInitials,
    formatCurrency
  };
}
