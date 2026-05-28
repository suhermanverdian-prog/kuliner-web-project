import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';

export function useProcurement() {
  const [activeTab, setActiveTab] = useState('create');
  const [bahanList, setBahanList] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [conversions, setConversions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [pendingPOs, setPendingPOs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [poItems, setPoItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ name: '', contact: '', address: '' });
  const [receivingPo, setReceivingPo] = useState(null);
  const [receivingItems, setReceivingItems] = useState([]);
  const [cancelConfirmPO, setCancelConfirmPO] = useState(null); // PO yang akan dibatalkan

  const loadBaseData = useCallback(async () => {
    setLoading(true);
    try {
      const [b, s, inv, pos, convs] = await Promise.all([
        api.getBahan(),
        api.getSuppliers(),
        api.getPurchaseInvoices().catch(() => []),
        api.getPOs().catch(() => []),
        api.getConversions().catch(() => [])
      ]);
      setBahanList(b || []);
      setSuppliers(s || []);
      setInvoices(inv || []);
      setPendingPOs(pos || []);
      setConversions(convs || []);
    } catch (err) {
      console.error("Audit Fail:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBaseData(); }, [loadBaseData]);

  // Hanya tambah baris kosong saat PERTAMA KALI tab 'create' dibuka, bukan setiap render
  useEffect(() => {
    if (activeTab === 'create' && poItems.length === 0) addItemToPo();
  }, [activeTab]); // Sengaja tidak include poItems.length agar tidak loop

  const handlePrintPO = useCallback((po) => {
    const printWindow = window.open('', '_blank');
    const itemsHtml = (po.items || []).map(item => {
      const bahan = bahanList.find(b => b.id === (item.bahanId || item.bahan_id)) || {};
      return `
        <tr style="border-bottom: 1px solid #e4e4e7;">
          <td style="padding: 12px; font-family: 'Inter', sans-serif;">${bahan.name || item.bahanName || 'Bahan Baku'}</td>
          <td style="padding: 12px; text-align: center; font-family: 'JetBrains Mono', monospace;">${item.qty || item.purchaseQty || item.purchase_qty || 0}</td>
          <td style="padding: 12px; text-align: center; font-family: 'Inter', sans-serif; text-transform: uppercase;">${item.unit || item.purchaseUnit || item.purchase_unit || 'Unit'}</td>
          <td style="padding: 12px; text-align: right; font-family: 'JetBrains Mono', monospace;">Rp ${(item.price || item.unitPrice || item.unit_price || 0).toLocaleString('id-ID')}</td>
          <td style="padding: 12px; text-align: right; font-family: 'JetBrains Mono', monospace; font-weight: bold;">Rp ${((item.qty || item.purchaseQty || item.purchase_qty || 0) * (item.price || item.unitPrice || item.unit_price || 0)).toLocaleString('id-ID')}</td>
        </tr>
      `;
    }).join('');

    const totalAmount = (po.items || []).reduce((acc, item) => acc + ((item.qty || item.purchaseQty || item.purchase_qty || 0) * (item.price || item.unitPrice || item.unit_price || 0)), 0);

    printWindow.document.write(`
      <html>
        <head>
          <title>Purchase Order - ${po.po_number || po.poNumber || 'PO-REQ'}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=JetBrains+Mono:wght@400;700&display=swap');
            body { font-family: 'Inter', sans-serif; color: #18181b; margin: 40px; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; border-bottom: 4px solid #f59e0b; padding-bottom: 20px; margin-bottom: 30px; }
            .logo-area { display: flex; flex-direction: column; }
            .company-name { font-size: 28px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; }
            .document-title { font-size: 32px; font-weight: 900; color: #f59e0b; text-align: right; }
            .details { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .details-col { width: 48%; }
            .details-title { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: #71717a; margin-bottom: 8px; }
            .details-val { font-size: 14px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            th { background-color: #f4f4f5; padding: 12px; text-align: left; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: #71717a; border-bottom: 2px solid #e4e4e7; }
            .total-section { display: flex; justify-content: flex-end; margin-bottom: 60px; }
            .total-box { background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px; padding: 20px; width: 300px; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .total-label { font-size: 12px; color: #71717a; font-weight: bold; }
            .total-val { font-family: 'JetBrains Mono', monospace; font-weight: bold; font-size: 14px; }
            .grand-total { font-size: 18px; font-weight: 900; color: #f59e0b; }
            .footer { text-align: center; font-size: 10px; color: #a1a1aa; border-top: 1px solid #e4e4e7; padding-top: 20px; position: absolute; bottom: 40px; left: 40px; right: 40px; }
            @media print { body { margin: 0; } .footer { position: fixed; bottom: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo-area">
              <span class="company-name">☕ KEN ENTERPRISE</span>
              <span style="font-size: 10px; color: #71717a; font-weight: bold;">SCBD Grade Premium ERP Cockpit</span>
            </div>
            <div>
              <div class="document-title">PURCHASE ORDER</div>
              <div style="text-align: right; font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: bold;">
                No: ${po.po_number || po.poNumber || 'PO-REQ'}
              </div>
            </div>
          </div>
          <div class="details">
            <div class="details-col">
              <div class="details-title">Order From:</div>
              <div class="details-val" style="font-size: 18px; color: #18181b;">KEN COFFEE SHOP HQ</div>
              <div style="font-size: 12px; color: #71717a; font-weight: bold; margin-top: 4px;">
                SCBD Sudirman Kav 21<br>Jakarta Selatan, DKI Jakarta
              </div>
            </div>
            <div class="details-col" style="text-align: right;">
              <div class="details-title">Authorized Vendor:</div>
              <div class="details-val" style="font-size: 18px; color: #18181b;">${po.supplier?.name || 'Authorized Supplier'}</div>
              <div style="font-size: 12px; color: #71717a; font-weight: bold; margin-top: 4px;">
                Tanggal Order: ${new Date(po.created_at || po.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br>
                Status: <span style="text-transform: uppercase; color: #f59e0b;">${po.status}</span>
              </div>
            </div>
          </div>
          <table>
            <thead><tr><th>Bahan Baku</th><th style="text-align: center;">Kuantitas</th><th style="text-align: center;">Satuan</th><th style="text-align: right;">Harga Satuan</th><th style="text-align: right;">Subtotal</th></tr></thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <div class="total-section">
            <div class="total-box">
              <div class="total-row"><span class="total-label">Subtotal</span><span class="total-val">Rp ${totalAmount.toLocaleString('id-ID')}</span></div>
              <div class="total-row" style="border-top: 1px solid #e4e4e7; padding-top: 10px; margin-top: 10px;">
                <span class="total-label" style="font-size: 14px; color: #18181b; font-weight: 900;">GRAND TOTAL</span>
                <span class="total-val grand-total">Rp ${totalAmount.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
          <div class="footer">
            Dokumen ini dibuat secara otomatis oleh sistem ERP KEN Enterprise dan sah sebagai komitmen pembelian legal.<br>
            <strong>KEN ENTERPRISE • PREMIUM ERP COCKPIT</strong>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }, [bahanList]);

  const addItemToPo = useCallback(() => {
    setPoItems(prev => [...prev, { bahanId: '', purchaseQty: 1, purchaseUnit: 'Box', unitPrice: 0 }]);
  }, []);

  const updateItem = useCallback((index, field, value) => {
    setPoItems(prev => {
      const newItems = [...prev];
      newItems[index][field] = value;
      if (field === 'bahanId') {
        const selectedBahan = bahanList.find(b => String(b.id) === String(value));
        if (selectedBahan) {
          newItems[index].purchaseUnit = selectedBahan.unit || 'Box';
          newItems[index].unitPrice = selectedBahan.cost || 0;
        }
      }
      return newItems;
    });
  }, [bahanList]);

  const handleAutoReplenish = async () => {
    try {
      setActionLoading(true);
      const lowStock = await api.getLowStock();
      if (lowStock.length === 0) {
        alert("Semua stok aman! Tidak ada bahan di bawah batas minimum.");
        return;
      }
      const newItems = lowStock.map(b => ({
        bahanId: b.id,
        purchaseQty: Math.max(10, b.min_stock * 2), // Suggestion: 2x min stock
        purchaseUnit: b.unit || 'Unit',
        unitPrice: b.cost || 0
      }));
      setPoItems(newItems);
    } catch (err) {
      alert("Auto-Scan Fail: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSavePO = async () => {
    const validItems = poItems.filter(i => i.bahanId);
    if (!selectedSupplier || validItems.length === 0) return;
    setActionLoading(true);
    try {
      await api.addPO({ supplierId: selectedSupplier, items: validItems, notes: notes });
      setPoItems([]); setSelectedSupplier(''); setNotes('');
      loadBaseData();
      setActiveTab('grn');
    } catch (err) {
      alert("PO Error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSimplePurchase = async () => {
    const validItems = poItems.filter(i => i.bahanId);
    if (!selectedSupplier || validItems.length === 0) {
      alert('Pilih supplier dan tambahkan item terlebih dahulu.');
      return;
    }
    
    setActionLoading(true);
    try {
      const payload = {
        supplierId: selectedSupplier,
        items: validItems.map(i => ({
          bahanId: i.bahanId,
          qtyReceived: Number(i.purchaseQty),
          unitPrice: Number(i.unitPrice),
          purchaseUnit: i.purchaseUnit || 'Unit'
        }))
      };
      
      await api.addSimplePurchase(payload);
      alert('Pembelian Langsung berhasil diproses! Stok terupdate & Kas Kecil (1-1000) terpotong.');
      
      setPoItems([]); 
      setSelectedSupplier(''); 
      setNotes('');
      loadBaseData();
      setActiveTab('finance'); // Pindah ke tab Payables/Finance untuk melihat invoice
    } catch (err) {
      alert("Gagal melakukan pembelian langsung: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReceivePO = (po) => {
    // Guard: pastikan po.items ada dan bukan array kosong
    const rawItems = Array.isArray(po.items) ? po.items : [];
    const validItems = rawItems.filter(i => i && (i.bahan_id || i.bahanId) && (Number(i.purchase_qty) || 0) > 0);

    if (validItems.length === 0) {
      alert(`PO ${po.po_number || ''} tidak memiliki item yang valid (qty > 0). Tidak bisa diproses.`);
      return;
    }

    setReceivingPo(po);
    setReceivingItems(validItems.map(i => {
      const ordered = Number(i.purchase_qty) || 0;
      const receivedSoFar = Number(i.received_qty) || 0;
      const remaining = Math.max(0, ordered - receivedSoFar);
      return { ...i, qtyReceived: remaining };
    }));
  };

  const confirmReceipt = async () => {
    if (!receivingPo) return;

    // ✅ VALIDASI KETAT: Blokir jika semua item qty = 0
    const validItems = receivingItems.filter(i => (Number(i.qtyReceived) || 0) > 0);
    if (validItems.length === 0) {
      alert('Tidak dapat memproses GRN: Semua item memiliki jumlah terima = 0. Masukkan jumlah barang yang diterima terlebih dahulu.');
      return;
    }

    // ✅ VALIDASI: Blokir jika item tidak punya bahan_id valid
    const itemsWithBahan = validItems.filter(i => i.bahan_id || i.bahanId);
    if (itemsWithBahan.length === 0) {
      alert('Tidak dapat memproses GRN: Item tidak memiliki referensi bahan yang valid.');
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        po_id: receivingPo.id,
        supplier_id: receivingPo.supplier_id,
        items: itemsWithBahan.map(i => ({
          bahanId: i.bahan_id || i.bahanId,
          qtyReceived: Number(i.qtyReceived),
          unitPrice: Number(i.unit_price) || 0,
          purchaseUnit: i.purchase_unit || i.purchaseUnit || i.unit
        }))
      };
      await api.addGRN(payload);
      setReceivingPo(null);
      loadBaseData();
      setActiveTab('finance');
    } catch (err) {
      alert('GRN Gagal: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const [payConfirmInvoice, setPayConfirmInvoice] = useState(null); // Invoice yang akan dibayar

  // --- Cancel PO ----------------------------------------------------------
  // Langkah 1: Tampilkan modal konfirmasi cancel PO
  const handleCancelPO = (po) => {
    setCancelConfirmPO(po);
  };

  // Langkah 2: User konfirmasi → eksekusi cancel ke API
  const doConfirmCancel = async () => {
    if (!cancelConfirmPO) return;
    setActionLoading(true);
    try {
      await api.request(
        `${api.url}/p/pos/${cancelConfirmPO.id}/cancel`,
        'PATCH',
        { status: 'cancelled' }
      );
      setCancelConfirmPO(null);
      loadBaseData();
    } catch (err) {
      alert('Gagal membatalkan PO: ' + (err.message || 'Terjadi kesalahan pada server'));
    } finally {
      setActionLoading(false);
    }
  };

  // --- Pay Invoice --------------------------------------------------------
  // Buka modal konfirmasi pembayaran
  const handlePayInvoice = (invoice) => {
    setPayConfirmInvoice(invoice);
  };

  const doConfirmPay = async () => {
    if (!payConfirmInvoice) return;
    setActionLoading(true);
    try {
      await api.request(
        `${api.url}/p/invoices/${payConfirmInvoice.id}/pay`,
        'POST'
      );
      setPayConfirmInvoice(null);
      loadBaseData();
    } catch (err) {
      alert('Gagal membayar invoice: ' + (err.message || 'Terjadi kesalahan pada server'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveSupplier = async () => {
    if (!newSupplier.name) return;
    setActionLoading(true);
    try {
      await api.addSupplier(newSupplier);
      setShowSupplierModal(false);
      setNewSupplier({ name: '', contact: '', address: '' });
      loadBaseData();
    } catch (err) {
      alert("Error adding vendor: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return {
    activeTab, setActiveTab,
    bahanList, setBahanList,
    suppliers, setSuppliers,
    conversions, setConversions,
    invoices, setInvoices,
    pendingPOs, setPendingPOs,
    loading, setLoading,
    actionLoading, setActionLoading,
    selectedSupplier, setSelectedSupplier,
    poItems, setPoItems,
    notes, setNotes,
    showSupplierModal, setShowSupplierModal,
    newSupplier, setNewSupplier,
    receivingPo, setReceivingPo,
    receivingItems, setReceivingItems,
    cancelConfirmPO, setCancelConfirmPO,
    payConfirmInvoice, setPayConfirmInvoice,
    loadBaseData,
    handlePrintPO,
    addItemToPo,
    updateItem,
    handleAutoReplenish,
    handleSavePO,
    handleReceivePO,
    confirmReceipt,
    handlePayInvoice,
    handleCancelPO,
    doConfirmCancel,
    doConfirmPay,
    handleSaveSupplier,
    handleSimplePurchase
  };
}
