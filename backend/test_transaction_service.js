/**
 * 👑 KEN ENTERPRISE - STRICT TRANSACTION SERVICE UNIT TESTS
 * Memenuhi Kepatuhan: Clean Code, SOLID, DRY, KISS, YAGNI.
 * Menggunakan assertion bawaan Node.js untuk performa dan kestabilan maksimal.
 */

const assert = require('assert');
const TransactionService = require('./src/services/transactionService');
const TransactionRepository = require('./src/repositories/transactionRepository');

// State untuk menyimpan data mock yang dikirim
const mockDb = {
  transactions: [],
  transactionItems: [],
  inventoryLogs: [],
  journalHeaders: [],
  journalLines: [],
  audits: []
};

// ==========================================
// MOCKING LAYER (SOLID Interface Segregation)
// ==========================================
TransactionRepository.insertTransactionHeader = async (payload) => {
  mockDb.transactions.push(payload);
  return { data: payload, error: null };
};

TransactionRepository.insertTransactionItems = async (items) => {
  mockDb.transactionItems.push(...items);
  return { data: items, error: null };
};

TransactionRepository.getMenuBOM = async (menuId, tenantId) => {
  // Mock BOM untuk Kopi Susu Ken
  if (menuId === 'menu-kopi-susu') {
    return [
      { bahan_id: 'bahan-kopi', qty_needed: 15, unit: 'Gram' },
      { bahan_id: 'bahan-susu', qty_needed: 120, unit: 'Ml' }
    ];
  }
  return [];
};

TransactionRepository.getBahanByIdOrName = async (id, name, tenantId) => {
  if (id === 'bahan-kopi') {
    return { id: 'bahan-kopi', name: 'Biji Kopi', stock: 1000, cost: 200, unit: 'Gram' };
  }
  if (id === 'bahan-susu') {
    return { id: 'bahan-susu', name: 'Susu Segar', stock: 5000, cost: 50, unit: 'Ml' };
  }
  return null;
};

TransactionRepository.decrementStockAtomic = async (id, qty, tenantId) => {
  return { data: true, error: null };
};

TransactionRepository.insertInventoryLog = async (payload) => {
  mockDb.inventoryLogs.push(payload);
  return { data: payload, error: null };
};

TransactionRepository.getSettings = async (tenantId) => {
  return {
    accounting_map: {
      cash: '1-1000',
      sales: '4-1000',
      hpp: '5-1000',
      inventory: '1-2000',
      tax: '2-2000'
    }
  };
};

TransactionRepository.getAccountsByCodes = async (codes) => {
  return [
    { id: 'acc-cash', code: '1-1000', name: 'Kas/Bank' },
    { id: 'acc-sales', code: '4-1000', name: 'Pendapatan' },
    { id: 'acc-hpp', code: '5-1000', name: 'HPP' },
    { id: 'acc-inv', code: '1-2000', name: 'Persediaan' },
    { id: 'acc-tax', code: '2-2000', name: 'Hutang Pajak (PPN)' }
  ];
};

TransactionRepository.insertJournalHeader = async (payload) => {
  mockDb.journalHeaders.push(payload);
  return { data: payload, error: null };
};

TransactionRepository.insertJournalLines = async (lines) => {
  mockDb.journalLines.push(...lines);
  return { data: lines, error: null };
};

TransactionRepository.logAudit = async (payload) => {
  mockDb.audits.push(payload);
  return { data: payload, error: null };
};

// ==========================================
// TEST SUITE (EXCELLENT ASSURANCE)
// ==========================================
async function runTests() {
  console.log("🚀 Running TransactionService Unit Tests...\n");

  try {
    // ----------------------------------------
    // TEST CASE 1: Financial Integrity and Calculation Check
    // ----------------------------------------
    console.log("➡️ Test Case 1: Financial Integrity & Calculation");
    
    const trxPayload = {
      customer_name: 'Budi Santoso',
      payment_method: 'QRIS',
      cashier_name: 'Lionel Messi',
      table_type: 'Dine In',
      discountAmount: 5000,
      taxAmount: 2500,
      uniqueCode: 123,
      total: 37623, // 40000 - 5000 + 2500 + 123 = 37623
      items: [
        { id: 'menu-kopi-susu', qty: 2, price: 20000 }
      ]
    };

    const tenantId = 'tenant-uuid-123';
    const outletId = 'outlet-uuid-456';

    const result = await TransactionService.createTransaction(trxPayload, tenantId, outletId, false);
    
    // Validasi hasil return
    assert.strictEqual(result.payment_status, 'paid', 'Status pembayaran kasir harus paid');
    assert.strictEqual(result.total, 37623, 'Kalkulasi total transaksi di backend harus tepat (37623)');
    assert.strictEqual(mockDb.transactions.length, 1, 'Header transaksi harus tersimpan di repository');
    assert.strictEqual(mockDb.transactionItems.length, 1, 'Item transaksi detail harus tersimpan');
    
    console.log("  ✓ createTransaction successfully completed and validated calculations.");

    // ----------------------------------------
    // TEST CASE 2: Inventory reduction & BOM decrementing
    // ----------------------------------------
    console.log("\n➡️ Test Case 2: Stock reduction via Bill of Materials (BOM)");
    
    // Kopi Susu Ken qty = 2, requires:
    // Gram needed: 15g * 2 = 30g kopi. Cost: 200/g = 6000 HPP
    // Ml needed: 120ml * 2 = 240ml susu. Cost: 50/ml = 12000 HPP
    // Total HPP expected: 6000 + 12000 = 18000
    assert.strictEqual(result.total_hpp, 18000, 'HPP total harus terhitung akurat sesuai biaya bahan (18000)');
    assert.strictEqual(mockDb.inventoryLogs.length, 2, 'Harus mencatat log pengurangan bahan untuk kopi dan susu');
    
    const kopiLog = mockDb.inventoryLogs.find(l => l.bahan_id === 'bahan-kopi');
    assert.strictEqual(kopiLog.change_qty, -30, 'Biji kopi harus berkurang 30 Gram');
    
    const susuLog = mockDb.inventoryLogs.find(l => l.bahan_id === 'bahan-susu');
    assert.strictEqual(susuLog.change_qty, -240, 'Susu segar harus berkurang 240 Ml');

    console.log("  ✓ processStockReduction accurately decremented stock and logged audit footprints.");

    // ----------------------------------------
    // TEST CASE 3: Financial Double-Entry Accounting Balance
    // ----------------------------------------
    console.log("\n➡️ Test Case 3: Double-Entry Journal Matching");
    
    assert.strictEqual(result.journal_status, true, 'Status penulisan jurnal harus sukses');
    assert.strictEqual(mockDb.journalHeaders.length, 1, 'Harus menyimpan 1 Journal Header');
    
    // Validasi Debit vs Kredit harus Balance
    const journalHeader = mockDb.journalHeaders[0];
    const relatedLines = mockDb.journalLines.filter(l => l.journal_id === journalHeader.id);
    let totalDebit = 0;
    let totalCredit = 0;

    relatedLines.forEach(l => {
      totalDebit += l.debit;
      totalCredit += l.credit;
    });

    // Debit Kas = 37623
    // Kredit Pendapatan Net = 35123 (37623 - 2500 pajak)
    // Kredit Hutang Pajak = 2500
    // Total Sales Debit (37623) == Credit (37623)
    // Debit HPP = 18000
    // Kredit Persediaan = 18000
    // Total Combined Debit (55623) == Credit (55623)
    assert.strictEqual(totalDebit, totalCredit, 'Debit & Kredit jurnal harus berimbang (Balance)');
    assert.strictEqual(totalDebit, 55623, 'Total jurnal debit harus seimbang di angka 55623');

    console.log("  ✓ saveTransactionJournal successfully verified balanced double-entry accounting.");

    console.log("\n🎉 ALL UNIT TESTS PASSED EXCELLENTLY! 100% SYSTEM INTEGRITY SECURED.");
    process.exit(0);

  } catch (err) {
    console.error("\n🚨 TEST CASE FAILURE:", err);
    process.exit(1);
  }
}

runTests();
