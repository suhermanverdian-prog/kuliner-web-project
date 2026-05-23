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

  static async recordExpense(payload, tenantId) {
    const { description, amount, category, payment_method, date } = payload;
    const expenseCode = '5-2000'; 
    const paymentCode = payment_method === 'Tunai' ? '1-1000' : '1-1010'; 

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

    const journal = await AccountingRepository.createJournalHeader({
      tenant_id: tenantId,
      reference: journalRef,
      description: journalDesc,
      date: date || new Date().toISOString(),
      total_amount: amount
    });

    const journalLines = [
      {
        tenant_id: tenantId,
        journal_id: journal.id,
        account_id: expenseAccount.id,
        account_code: expenseAccount.code,
        account_name: expenseAccount.name,
        debit: amount,
        credit: 0
      },
      {
        tenant_id: tenantId,
        journal_id: journal.id,
        account_id: paymentAccount.id,
        account_code: paymentAccount.code,
        account_name: paymentAccount.name,
        debit: 0,
        credit: amount
      }
    ];

    try {
        await AccountingRepository.createJournalLines(journalLines);
    } catch(e) {
        await AccountingRepository.deleteJournal(journal.id);
        throw new Error(`Gagal membuat garis jurnal (Rolled Back): ${e.message}`);
    }

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

    const journal = await AccountingRepository.createJournalHeader({
      tenant_id: tenantId,
      reference: journalRef,
      description: journalDesc,
      date: new Date().toISOString(),
      total_amount: totalSalary
    });

    const journalLines = [
      {
        tenant_id: tenantId,
        journal_id: journal.id,
        account_id: expenseAccount.id,
        account_code: expenseAccount.code,
        account_name: expenseAccount.name,
        debit: totalSalary,
        credit: 0
      },
      {
        tenant_id: tenantId,
        journal_id: journal.id,
        account_id: paymentAccount.id,
        account_code: paymentAccount.code,
        account_name: paymentAccount.name,
        debit: 0,
        credit: totalSalary
      }
    ];

    try {
        await AccountingRepository.createJournalLines(journalLines);
    } catch (e) {
        await AccountingRepository.deleteJournal(journal.id);
        throw new Error(`Gagal membuat garis jurnal (Rolled Back): ${e.message}`);
    }

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

}

module.exports = AccountingService;
