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
}

module.exports = ReportService;
