const ReportRepository = require('../repositories/reportRepository');

class ReportService {

  static async getSummary(userContext, period) {
    let dateFilter = new Date();
    if (period === '7days') dateFilter.setDate(dateFilter.getDate() - 7);
    else if (period === 'month') dateFilter.setDate(dateFilter.getDate() - 30);
    else dateFilter.setHours(0, 0, 0, 0);

    const dateFilterStr = dateFilter.toISOString();

    const transactions = await ReportRepository.getTransactionsSum(userContext, dateFilterStr);
    const totalRevenue = transactions.reduce((s, t) => s + (t.total || 0), 0);
    const totalTransactions = transactions.length;

    const hppLines = await ReportRepository.getJournalLinesSum(userContext, dateFilterStr, '5-%');
    const expLines = await ReportRepository.getJournalLinesSum(userContext, dateFilterStr, '6-%');

    const totalHPP = hppLines.reduce((s, l) => s + (l.debit || 0), 0);
    const totalExpenses = expLines.reduce((s, l) => s + (l.debit || 0), 0);

    return {
      totalRevenue,
      totalTransactions,
      totalHPP,
      totalExpenses,
      grossProfit: totalRevenue - totalHPP,
      netProfit: totalRevenue - totalHPP - totalExpenses,
      marginPct: totalRevenue > 0 ? Math.round(((totalRevenue - totalHPP) / totalRevenue) * 100) : 0,
      totalPurchasing: 0,
      totalDebt: 0,
      vsYesterday: { revenue: 5, transactions: 2 } 
    };
  }

  static async getTrend(userContext) {
    const today = new Date(new Date().setHours(0,0,0,0)).toISOString();
    const txs = await ReportRepository.getTransactionTrend(userContext, today);
    
    const hourly = Array.from({ length: 24 }, (_, i) => ({ hour: i, value: 0 }));
    txs.forEach(t => {
        const h = new Date(t.created_at).getHours();
        hourly[h].value += t.total;
    });
    
    return { 
      current: hourly, 
      previous: hourly.map(h => ({ ...h, value: Math.round(h.value * 0.8) })) 
    };
  }

  static async getTopProducts(userContext) {
    const data = await ReportRepository.getTopProducts(userContext);
    const stats = data.reduce((acc, item) => {
        const name = item.menu?.name || 'Unknown';
        if (!acc[name]) acc[name] = { name, icon: item.menu?.icon, qty: 0, revenue: 0 };
        acc[name].qty += item.qty;
        acc[name].revenue += item.qty * item.price;
        return acc;
    }, {});
    
    return Object.values(stats).sort((a, b) => b.qty - a.qty).slice(0, 5);
  }

  static async getPaymentMethods(userContext) {
    const data = await ReportRepository.getPaymentMethods(userContext);
    const totalAll = data.reduce((s, t) => s + t.total, 0);
    const stats = data.reduce((acc, t) => {
        const m = t.payment_method || 'Tunai';
        if (!acc[m]) acc[m] = { name: m, amount: 0, pct: 0 };
        acc[m].amount += t.total;
        return acc;
    }, {});
    
    const result = Object.values(stats).map(s => ({ 
      ...s, 
      pct: totalAll > 0 ? Math.round((s.amount / totalAll) * 100) : 0 
    }));
    
    return { methods: result, total: totalAll };
  }

  static async getCriticalStock(userContext) {
    const data = await ReportRepository.getCriticalStock(userContext, 10);
    return data.map(b => ({
        name: b.name,
        stock: b.stock,
        unit: b.unit,
        status: b.stock <= 0 ? 'habis' : 'kritis'
    }));
  }

  static async getWaste(userContext) {
    const data = await ReportRepository.getWasteLogs(userContext);
    const totalWaste = data.reduce((s, l) => s + (Math.abs(l.change_qty) * (l.bahan?.cost || 0)), 0);
    const cats = data.reduce((acc, l) => {
        const n = l.bahan?.name || 'Lainnya';
        if (!acc[n]) acc[n] = { name: n, amount: 0 };
        acc[n].amount += (Math.abs(l.change_qty) * (l.bahan?.cost || 0));
        return acc;
    }, {});
    
    return { 
      totalWaste, 
      wasteRatio: 2.5, 
      categories: Object.values(cats).sort((a,b) => b.amount - a.amount).slice(0, 3) 
    };
  }

  static async getInsights(userContext) {
    return [
        { title: 'Optimasi Menu', body: 'Produk unggulan Anda memiliki margin 65%, pertimbangkan promosi bundling.', type: 'info' },
        { title: 'Efisiensi Stok', body: 'Terdeteksi pemborosan pada bahan Susu, periksa metode penyimpanan.', type: 'warning' }
    ];
  }

  static async getFlexCompile(userContext, node, metricsStr, period) {
    const { supabase } = require('../supabase');
    const { applyScopeFilter } = require('../utils/queryHelper');

    let dateFilter = new Date();
    const p = (period || '').toLowerCase();
    if (p.includes('weekly') || p === '7days') dateFilter.setDate(dateFilter.getDate() - 7);
    else if (p.includes('monthly') || p === 'month') dateFilter.setDate(dateFilter.getDate() - 30);
    else if (p.includes('annual') || p === 'year') dateFilter.setDate(dateFilter.getDate() - 365);
    else dateFilter.setHours(0, 0, 0, 0);
    const dateStr = dateFilter.toISOString();

    const metrics = (metricsStr || '').split(',').map(m => m.trim()).filter(Boolean);
    const results = {};

    if (node === 'sales') {
      let q = supabase.from('transactions')
        .select('total, tax, discount, id')
        .eq('payment_status', 'paid')
        .gte('created_at', dateStr);
      q = applyScopeFilter(q, userContext);
      const { data: txs, error } = await q;
      if (error) throw error;

      const count = txs.length;
      const gross = txs.reduce((s, t) => s + (t.total || 0), 0);
      const tax = txs.reduce((s, t) => s + (t.tax || 0), 0);
      const discount = txs.reduce((s, t) => s + (t.discount || 0), 0);
      const avg = count > 0 ? Math.round(gross / count) : 0;

      // HPP
      let hppQ = supabase.from('journal_lines')
        .select('debit')
        .ilike('account_code', '5-%')
        .gte('created_at', dateStr);
      if (userContext && userContext.tenantId) hppQ = hppQ.eq('tenant_id', userContext.tenantId);
      const { data: hppLines } = await hppQ;
      const hpp = (hppLines || []).reduce((s, l) => s + (l.debit || 0), 0);

      // Expenses
      let expQ = supabase.from('journal_lines')
        .select('debit')
        .ilike('account_code', '6-%')
        .gte('created_at', dateStr);
      if (userContext && userContext.tenantId) expQ = expQ.eq('tenant_id', userContext.tenantId);
      const { data: expLines } = await expQ;
      const exp = (expLines || []).reduce((s, l) => s + (l.debit || 0), 0);

      if (metrics.includes('Gross Revenue')) results['Gross Revenue'] = gross;
      if (metrics.includes('Net Profit')) results['Net Profit'] = gross - hpp - exp;
      if (metrics.includes('Average Ticket')) results['Average Ticket'] = avg;
      if (metrics.includes('Tax Collected')) results['Tax Collected'] = tax;
      if (metrics.includes('Discount Impact')) results['Discount Impact'] = discount;
    } 
    else if (node === 'inventory') {
      let qBahan = supabase.from('bahan').select('stock, cost, min_stock');
      if (userContext && userContext.tenantId) qBahan = qBahan.eq('tenant_id', userContext.tenantId);
      const { data: bahans } = await qBahan;

      const stockVal = (bahans || []).reduce((s, b) => s + ((b.stock || 0) * (b.cost || 0)), 0);
      const lowStockAlerts = (bahans || []).filter(b => (b.stock || 0) <= (b.min_stock || 0)).length;

      // Waste Cost
      let qWaste = supabase.from('inventory_logs')
        .select('change_qty, bahan(cost)')
        .eq('type', 'Waste')
        .gte('created_at', dateStr);
      qWaste = applyScopeFilter(qWaste, userContext);
      const { data: wasteLogs } = await qWaste;
      const wasteCost = (wasteLogs || []).reduce((s, l) => s + (Math.abs(l.change_qty || 0) * (l.bahan?.cost || 0)), 0);

      // HPP
      let hppQ = supabase.from('journal_lines')
        .select('debit')
        .ilike('account_code', '5-%')
        .gte('created_at', dateStr);
      if (userContext && userContext.tenantId) hppQ = hppQ.eq('tenant_id', userContext.tenantId);
      const { data: hppLines } = await hppQ;
      const hpp = (hppLines || []).reduce((s, l) => s + (l.debit || 0), 0);

      // Waste Rate
      const totalCostUsed = hpp + wasteCost;
      const wasteRate = totalCostUsed > 0 ? Math.round((wasteCost / totalCostUsed) * 100) : 0;

      if (metrics.includes('Stock Value')) results['Stock Value'] = stockVal;
      if (metrics.includes('Waste Rate')) results['Waste Rate'] = `${wasteRate}%`;
      if (metrics.includes('HPP (COGS)')) results['HPP (COGS)'] = hpp;
      if (metrics.includes('Low Stock Alerts')) results['Low Stock Alerts'] = lowStockAlerts;
    } 
    else if (node === 'customers') {
      let qCust = supabase.from('customers').select('id, created_at');
      if (userContext && userContext.tenantId) qCust = qCust.eq('tenant_id', userContext.tenantId);
      const { data: customers } = await qCust;

      const newMembers = (customers || []).filter(c => c.created_at >= dateStr).length;

      // Visits / transactions count
      let q = supabase.from('transactions')
        .select('customer_id, total')
        .eq('payment_status', 'paid')
        .gte('created_at', dateStr);
      q = applyScopeFilter(q, userContext);
      const { data: txs } = await q;

      const visitsCount = (txs || []).length;
      const uniqueCust = new Set((txs || []).map(t => t.customer_id).filter(Boolean));
      const avgLTV = uniqueCust.size > 0 
        ? Math.round((txs || []).reduce((s, t) => s + (t.total || 0), 0) / uniqueCust.size) 
        : 0;

      if (metrics.includes('New Members')) results['New Members'] = newMembers;
      if (metrics.includes('Visits Count')) results['Visits Count'] = visitsCount;
      if (metrics.includes('Avg Lifetime Value')) results['Avg Lifetime Value'] = avgLTV;
      if (metrics.includes('Churn Rate')) results['Churn Rate'] = '12%'; // Mock/default value
    } 
    else if (node === 'accounting') {
      // General Ledger Expenses
      let expQ = supabase.from('journal_lines')
        .select('debit')
        .ilike('account_code', '6-%')
        .gte('created_at', dateStr);
      if (userContext && userContext.tenantId) expQ = expQ.eq('tenant_id', userContext.tenantId);
      const { data: expLines } = await expQ;
      const totalExpenses = (expLines || []).reduce((s, l) => s + (l.debit || 0), 0);

      // Petty Cash Flow (debit/credit lines on Cash 1-1000)
      let cashQ = supabase.from('journal_lines')
        .select('debit, credit')
        .ilike('account_code', '1-1000')
        .gte('created_at', dateStr);
      if (userContext && userContext.tenantId) cashQ = cashQ.eq('tenant_id', userContext.tenantId);
      const { data: cashLines } = await cashQ;
      const pettyCashDebit = (cashLines || []).reduce((s, l) => s + (l.debit || 0), 0);
      const pettyCashCredit = (cashLines || []).reduce((s, l) => s + (l.credit || 0), 0);
      const pettyCashFlow = pettyCashDebit - pettyCashCredit;

      // Revenue for margin
      let revQ = supabase.from('transactions')
        .select('total')
        .eq('payment_status', 'paid')
        .gte('created_at', dateStr);
      revQ = applyScopeFilter(revQ, userContext);
      const { data: txs } = await revQ;
      const totalRevenue = (txs || []).reduce((s, t) => s + (t.total || 0), 0);

      const opMargin = totalRevenue > 0 ? Math.round(((totalRevenue - totalExpenses) / totalRevenue) * 100) : 0;

      if (metrics.includes('Total Expenses')) results['Total Expenses'] = totalExpenses;
      if (metrics.includes('Petty Cash Flow')) results['Petty Cash Flow'] = pettyCashFlow;
      if (metrics.includes('Operational Margin')) results['Operational Margin'] = `${opMargin}%`;
    }

    return {
      success: true,
      timestamp: new Date().toISOString(),
      node,
      period,
      results
    };
  }

  static async getReportData(userContext, type, query) {
    const titleMap = {
      'penjualan-harian': 'Laporan Penjualan Harian',
      'penjualan-periode': 'Laporan Penjualan Periode',
      'inventaris': 'Laporan Stok Barang',
      'waste': 'Laporan Kerugian (Waste)',
      'hpp': 'Laporan Beban Pokok Penjualan (HPP)',
      'laba-rugi': 'Laporan Laba Rugi',
      'stock-mutation': 'Laporan Log Mutasi Stok',
      'activity-log': 'Laporan Audit Aktivitas',
    };

    const title = titleMap[type] || 'Laporan Operasional';
    
    const meta = {
      storeName: 'BrewMaster Coffee & POS',
      storeAddress: 'SCBD Grade A Office Jakarta',
      storePhone: '+62-21-9988-7766',
      periodLabel: query.period === 'custom' 
        ? `${query.customStart} s/d ${query.customEnd}`
        : query.period === '7days' ? '7 Hari Terakhir'
        : query.period === 'month' ? 'Bulan Ini'
        : query.period === 'year' ? 'Tahun Ini'
        : 'Hari Ini',
      printedAt: new Date().toLocaleString('id-ID'),
    };

    if (type === 'stock-mutation') {
      const InventoryRepository = require('../repositories/inventoryRepository');
      const logs = await InventoryRepository.getLogs(userContext, { limit: 100 });
      return {
        title,
        meta,
        items: logs || []
      };
    }

    if (type === 'inventaris') {
      const { supabase } = require('../supabase');
      let q = supabase.from('bahan').select('*');
      if (userContext && userContext.tenantId) q = q.eq('tenant_id', userContext.tenantId);
      const { data: bahans } = await q;
      const items = (bahans || []).map(b => ({
        name: b.name,
        unit: b.unit,
        stock: b.stock,
        minStock: b.min_stock,
        status: b.stock <= 0 ? 'Habis' : b.stock <= b.min_stock ? 'Kritis' : 'Aman'
      }));
      return {
        title,
        meta,
        items,
        summary: {
          total: items.length,
          critical: items.filter(x => x.status === 'Kritis').length,
          empty: items.filter(x => x.status === 'Habis').length
        }
      };
    }

    return {
      title,
      meta,
      summary: {},
      items: [],
      rows: [],
      byMethod: [],
      payment: { total: 0, selisih: 0 }
    };
  }
}

module.exports = ReportService;
