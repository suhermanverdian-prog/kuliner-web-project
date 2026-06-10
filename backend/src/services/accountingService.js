const AccountingRepository = require('../repositories/accountingRepository');

class AccountingService {
  
  static async getSummary(tenantId, period) {
    let startDate = new Date();
    if (period === 'today') startDate.setHours(0,0,0,0);
    else if (period === '7days') startDate.setDate(startDate.getDate() - 7);
    else startDate.setDate(startDate.getDate() - 30); // Default 30 days

    const safeLines = await AccountingRepository.getJournalLines(tenantId);

    const getBalance = (filterFn) => safeLines.filter(filterFn).reduce((sum, l) => sum + (Number(l.debit) - Number(l.credit)), 0);
    const getBalanceAbsolute = (filterFn) => Math.abs(getBalance(filterFn));

    const periodLines = safeLines.filter(l => new Date(l.created_at) >= startDate);
    const getPeriodBalance = (filterFn) => periodLines.filter(filterFn).reduce((sum, l) => sum + (Number(l.debit) - Number(l.credit)), 0);

    const isRevenue = l => l.account_code?.startsWith('4-');
    const isHpp = l => l.account_code === '5-1000';
    const isOpex = l => l.account_code?.startsWith('5-') && l.account_code !== '5-1000'; 
    const isCash = l => l.account_code === '1-1000';
    const isInventory = l => l.account_code === '1-2000';
    const isAp = l => l.account_code === '2-1000';

    const revenue = Math.abs(getPeriodBalance(isRevenue));
    const hpp = getPeriodBalance(isHpp);
    const expenses = getPeriodBalance(isOpex);
    const grossProfit = revenue - hpp;
    const netProfit = grossProfit - expenses;

    const cashBalance = getBalance(isCash);
    const inventoryBalance = getBalance(isInventory);
    const apBalance = Math.abs(getBalance(isAp));

    return {
      incomeStatement: {
        revenue,
        hpp,
        grossProfit,
        expenses,
        netProfit,
        grossMargin: revenue > 0 ? (grossProfit / revenue) * 100 : 0
      },
      balanceSheet: {
        assets: {
          kas: cashBalance,
          persediaan: inventoryBalance,
          total: cashBalance + inventoryBalance
        },
        liabilities: {
          hutangDagang: apBalance,
          total: apBalance
        },
        equity: (cashBalance + inventoryBalance) - apBalance
      },
      cashFlow: {
        inflow: revenue,
        outflow: hpp + expenses,
        net: revenue - (hpp + expenses)
      }
    };
  }

  static async getAccounts(tenantId) {
    return await AccountingRepository.getAccounts(tenantId);
  }

  static async getJournals(tenantId) {
    const data = await AccountingRepository.getJournals(tenantId);
    
    return data.map(j => ({
      ...j,
      lines: j.journal_lines?.map(l => ({
          accountCode: l.account_code,
          accountName: l.account_name,
          debit: l.debit,
          credit: l.credit
      }))
    }));
  }

  static async saveJournalEntry(header, lines, tenantId) {
    // 1. Enforce Debit === Credit Validation
    const debitTotal = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
    const creditTotal = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
    
    const roundedDebit = Number(debitTotal.toFixed(2));
    const roundedCredit = Number(creditTotal.toFixed(2));
    
    if (Math.abs(roundedDebit - roundedCredit) > 0.01) {
      throw new Error(`Jurnal tidak seimbang: Total Debit (Rp ${roundedDebit.toLocaleString()}) harus sama dengan Total Kredit (Rp ${roundedCredit.toLocaleString()}).`);
    }

    // 2. Resolve or Validate Account structure
    for (const l of lines) {
      const isValidCode = /^[1-5]-[0-9]{4}$/.test(l.account_code);
      if (!isValidCode) {
        throw new Error(`Format Kode Akun tidak valid: ${l.account_code} harus mematuhi pola standarisasi Chart of Accounts (COA) [1-5]-XXXX.`);
      }
    }

    // 3. Approval Workflow Check with Toggle (Skipped header.status since general journals doesn't have status column in this schema version)
    const totalAmount = header.total_amount || roundedDebit;
    
    // 4. Create Header
    const journal = await AccountingRepository.createJournalHeader(header);

    // 5. Create Lines (with strict rounded decimals & dynamic linking)
    const journalLines = lines.map(l => ({
      ...l,
      journal_id: journal.id,
      debit: Number(Number(l.debit || 0).toFixed(2)),
      credit: Number(Number(l.credit || 0).toFixed(2))
    }));

    try {
      await AccountingRepository.createJournalLines(journalLines);
    } catch(e) {
      // Compensating Transaction (Rollback)
      await AccountingRepository.deleteJournal(journal.id).catch(() => {});
      throw new Error(`Gagal menyimpan detail transaksi jurnal. Jurnal dibatalkan (Rolled Back). Detail: ${e.message}`);
    }

    return journal;
  }

  static async recordExpense(payload, tenantId) {
    const { description, amount, category, payment_method, paymentMethod, date } = payload;
    const activePaymentMethod = payment_method || paymentMethod;
    const expenseCode = '5-2000'; 
    const paymentCode = activePaymentMethod === 'Tunai' ? '1-1000' : '1-1010'; 

    let expenseAccount = await AccountingRepository.getAccountByCode(tenantId, expenseCode);
    let paymentAccount = await AccountingRepository.getAccountByCode(tenantId, paymentCode);

    if (!expenseAccount) {
        try {
            expenseAccount = await AccountingRepository.createAccount({
                tenant_id: tenantId,
                code: expenseCode,
                name: 'Beban Operasional / Waste',
                category: 'Expense',
                normal_balance: 'Debit'
            });
        } catch(e) {
            expenseAccount = { id: null, code: expenseCode, name: `Beban Operasional (${category})` };
        }
    }

    if (!paymentAccount) {
        try {
            paymentAccount = await AccountingRepository.createAccount({
                tenant_id: tenantId,
                code: paymentCode,
                name: payment_method === 'Tunai' ? 'Kas Tunai' : 'Rekening Bank',
                category: 'Asset',
                normal_balance: 'Debit'
            });
        } catch(e) {
            paymentAccount = { id: null, code: paymentCode, name: payment_method === 'Tunai' ? 'Kas Tunai' : 'Rekening Bank' };
        }
    }

    const journalRef = `EXP-${Date.now()}`;
    const journalDesc = `[${category} - ${payment_method}] ${description}`;

    const header = {
      tenant_id: tenantId,
      reference: journalRef,
      description: journalDesc,
      date: date || new Date().toISOString(),
      total_amount: amount
    };

    const lines = [
      {
        tenant_id: tenantId,
        account_id: expenseAccount.id,
        account_code: expenseAccount.code,
        account_name: expenseAccount.name,
        debit: amount,
        credit: 0
      },
      {
        tenant_id: tenantId,
        account_id: paymentAccount.id,
        account_code: paymentAccount.code,
        account_name: paymentAccount.name,
        debit: 0,
        credit: amount
      }
    ];

    const journal = await this.saveJournalEntry(header, lines, tenantId);
    return journal.id;
  }

  static async recordTopup(payload, tenantId) {
    const { description, amount, source, date } = payload;
    const cashCode = '1-1000'; // Kas Tunai / Kas Kecil
    const bankCode = '1-1010'; // Rekening Bank
    const equityCode = '3-1000'; // Modal Pemilik

    const sourceCode = source === 'Modal' ? equityCode : bankCode;

    let cashAccount = await AccountingRepository.getAccountByCode(tenantId, cashCode);
    let sourceAccount = await AccountingRepository.getAccountByCode(tenantId, sourceCode);

    if (!cashAccount) {
        try {
            cashAccount = await AccountingRepository.createAccount({
                tenant_id: tenantId,
                code: cashCode,
                name: 'Kas Tunai / Kas Kecil',
                category: 'Asset',
                normal_balance: 'Debit'
            });
        } catch(e) {
            cashAccount = { id: null, code: cashCode, name: 'Kas Tunai' };
        }
    }

    if (!sourceAccount) {
        try {
            sourceAccount = await AccountingRepository.createAccount({
                tenant_id: tenantId,
                code: sourceCode,
                name: source === 'Modal' ? 'Modal Pemilik (Ekuitas)' : 'Rekening Bank',
                category: source === 'Modal' ? 'Equity' : 'Asset',
                normal_balance: source === 'Modal' ? 'Credit' : 'Debit'
            });
        } catch(e) {
            sourceAccount = { id: null, code: sourceCode, name: source === 'Modal' ? 'Modal Pemilik' : 'Rekening Bank' };
        }
    }

    const journalRef = `TOP-${Date.now()}`;
    const journalDesc = `[Top-up Kas - ${source}] ${description}`;

    const header = {
      tenant_id: tenantId,
      reference: journalRef,
      description: journalDesc,
      date: date || new Date().toISOString(),
      total_amount: amount
    };

    const lines = [
      {
        tenant_id: tenantId,
        account_id: cashAccount.id,
        account_code: cashAccount.code,
        account_name: cashAccount.name,
        debit: amount,
        credit: 0
      },
      {
        tenant_id: tenantId,
        account_id: sourceAccount.id,
        account_code: sourceAccount.code,
        account_name: sourceAccount.name,
        debit: 0,
        credit: amount
      }
    ];

    const journal = await this.saveJournalEntry(header, lines, tenantId);
    return journal.id;
  }

  static async recordPayroll(payload, tenantId, currentUserId, currentUserName) {
    const { employee_id, base_salary, allowances, month, year } = payload;
    const totalSalary = base_salary + allowances;
    
    if (totalSalary <= 0) throw new Error('Total gaji harus lebih besar dari Rp 0');

    const employee = await AccountingRepository.getUserById(tenantId, employee_id);
    if (!employee) throw new Error('Pegawai tidak ditemukan');

    const expenseCode = '5-2000'; 
    const paymentCode = '1-1010'; 

    let expenseAccount = await AccountingRepository.getAccountByCode(tenantId, expenseCode);
    let paymentAccount = await AccountingRepository.getAccountByCode(tenantId, paymentCode);

    if (!expenseAccount) {
        try {
            expenseAccount = await AccountingRepository.createAccount({
                tenant_id: tenantId,
                code: expenseCode,
                name: 'Beban Gaji Pegawai',
                category: 'Expense',
                normal_balance: 'Debit'
            });
        } catch(e) {
            expenseAccount = { id: null, code: expenseCode, name: 'Beban Gaji Pegawai' };
        }
    }

    if (!paymentAccount) {
        try {
            paymentAccount = await AccountingRepository.createAccount({
                tenant_id: tenantId,
                code: paymentCode,
                name: 'Rekening Bank Clearing',
                category: 'Asset',
                normal_balance: 'Debit'
            });
        } catch(e) {
            paymentAccount = { id: null, code: paymentCode, name: 'Rekening Bank Clearing' };
        }
    }

    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const monthName = monthNames[month - 1] || 'Bulan';
    const journalRef = `PAY-${Date.now()}`;
    const journalDesc = `[Payroll - ${employee.name}] Gaji Periode ${monthName} ${year}`;

    const header = {
      tenant_id: tenantId,
      reference: journalRef,
      description: journalDesc,
      date: new Date().toISOString(),
      total_amount: totalSalary
    };

    const lines = [
      {
        tenant_id: tenantId,
        account_id: expenseAccount.id,
        account_code: expenseAccount.code,
        account_name: expenseAccount.name,
        debit: totalSalary,
        credit: 0
      },
      {
        tenant_id: tenantId,
        account_id: paymentAccount.id,
        account_code: paymentAccount.code,
        account_name: paymentAccount.name,
        debit: 0,
        credit: totalSalary
      }
    ];

    const journal = await this.saveJournalEntry(header, lines, tenantId);

    await AccountingRepository.createActivityLog({
      tenant_id: tenantId,
      user_id: currentUserId,
      user_name: currentUserName,
      role: 'owner',
      activity_type: 'PAYROLL',
      description: `Pemrosesan pembayaran gaji senilai Rp ${totalSalary.toLocaleString('id-ID')} kepada pegawai ${employee.name} (${employee.role})`,
      payload: { employee_id, base_salary, allowances, month, year, journalId: journal.id }
    });

    return { journalId: journal.id, totalSalary };
  }

  static async getLedgerDetails(tenantId, accountCode, period) {
    let startDate = null;
    let endDate = new Date().toISOString();
    
    if (period === 'today') {
      const d = new Date();
      d.setHours(0,0,0,0);
      startDate = d.toISOString();
    } else if (period === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      startDate = d.toISOString();
    } else if (period === '30days') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      startDate = d.toISOString();
    }

    const lines = await AccountingRepository.getLedgerByAccount(tenantId, accountCode, startDate, endDate);
    const account = await AccountingRepository.getAccountByCode(tenantId, accountCode);
    
    if (!account) throw new Error('Akun tidak ditemukan');

    // Calculate running balance
    let runningBalance = 0;
    const isDebitNormal = account.normal_balance === 'Debit';

    const enrichedLines = lines.map(l => {
      const debit = Number(l.debit) || 0;
      const credit = Number(l.credit) || 0;
      
      if (isDebitNormal) {
        runningBalance += (debit - credit);
      } else {
        runningBalance += (credit - debit);
      }
      
      return {
        ...l,
        running_balance: runningBalance
      };
    });

    return {
      account,
      period,
      mutations: enrichedLines,
      ending_balance: runningBalance
    };
  }
}

module.exports = AccountingService;
