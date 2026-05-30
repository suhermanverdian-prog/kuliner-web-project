const AssetRepository = require('../repositories/assetRepository');
const TransactionRepository = require('../repositories/transactionRepository');
const crypto = require('crypto');

class AssetService {
  async getAssets(tenantId) {
    return await AssetRepository.getAssets(tenantId);
  }

  async registerAsset(tenantId, payload) {
    const { 
      name, 
      purchase_cost, 
      purchase_date, 
      useful_life_months, 
      residual_value,
      asset_account_id,
      depreciation_account_id,
      expense_account_id
    } = payload;

    if (!name || !purchase_cost || !purchase_date || !useful_life_months) {
      throw new Error('Name, purchase_cost, purchase_date, and useful_life_months are required.');
    }

    const assetData = {
      tenant_id: tenantId,
      name,
      purchase_cost: Number(purchase_cost),
      purchase_date,
      useful_life_months: Number(useful_life_months),
      residual_value: Number(residual_value || 0),
      accumulated_depreciation: 0,
      asset_account_id: asset_account_id || null,
      depreciation_account_id: depreciation_account_id || null,
      expense_account_id: expense_account_id || null,
      status: 'active'
    };

    return await AssetRepository.createAsset(assetData);
  }

  /**
   * Run depreciation for active assets for a specific month/period.
   * e.g., period = '2026-05'
   */
  async runDepreciationForPeriod(tenantId, period) {
    const assets = await AssetRepository.getAssets(tenantId);
    const activeAssets = assets.filter(a => a.status === 'active');

    let totalDepreciationAmount = 0;
    const journalLines = [];
    const journalId = crypto.randomUUID();

    // Akun default jika tidak ditentukan pada level aset
    const defaultExpenseCode = '5-2000'; // Beban Operasional / Waste (fallback)
    const defaultDepreciationCode = '1-2000'; // Persediaan / Kontra-Aset (fallback)
    
    // Cari detail akun fallback
    const accounts = await TransactionRepository.getAccountsByCodes([defaultExpenseCode, defaultDepreciationCode]);
    const getAccountId = (code) => accounts?.find(ac => ac.code === code)?.id;

    for (const asset of activeAssets) {
      const depreciableAmount = Number(asset.purchase_cost) - Number(asset.residual_value);
      const monthlyDepreciation = Math.round(depreciableAmount / Number(asset.useful_life_months));

      if (monthlyDepreciation <= 0) continue;

      const newAccumulated = Number(asset.accumulated_depreciation) + monthlyDepreciation;
      const isFullyDepreciated = newAccumulated >= depreciableAmount;
      
      const actualDepreciation = isFullyDepreciated 
        ? (depreciableAmount - Number(asset.accumulated_depreciation)) 
        : monthlyDepreciation;

      if (actualDepreciation <= 0) continue;

      totalDepreciationAmount += actualDepreciation;

      // Persiapkan update aset
      const updatePayload = {
        accumulated_depreciation: Number(asset.accumulated_depreciation) + actualDepreciation,
        status: isFullyDepreciated ? 'fully_depreciated' : 'active'
      };
      await AssetRepository.updateAsset(asset.id, tenantId, updatePayload);

      // Baris Jurnal
      const expenseAccId = asset.expense_account_id || getAccountId(defaultExpenseCode);
      const accumAccId = asset.depreciation_account_id || getAccountId(defaultDepreciationCode);

      if (expenseAccId && accumAccId) {
        journalLines.push(
          {
            journal_id: journalId,
            account_id: expenseAccId,
            account_code: asset.expense_account_id ? undefined : defaultExpenseCode,
            account_name: `Beban Penyusutan: ${asset.name}`,
            debit: actualDepreciation,
            credit: 0,
            tenant_id: tenantId
          },
          {
            journal_id: journalId,
            account_id: accumAccId,
            account_code: asset.depreciation_account_id ? undefined : defaultDepreciationCode,
            account_name: `Akumulasi Penyusutan: ${asset.name}`,
            debit: 0,
            credit: actualDepreciation,
            tenant_id: tenantId
          }
        );
      }
    }

    if (totalDepreciationAmount > 0 && journalLines.length > 0) {
      const journalHeader = {
        id: journalId,
        tenant_id: tenantId,
        date: new Date().toISOString(),
        reference: `DEP-${period}`,
        description: `Jurnal Penyusutan Aset Otomatis Periode ${period}`,
        total_amount: totalDepreciationAmount
      };

      await TransactionRepository.insertJournalHeader(journalHeader);
      await TransactionRepository.insertJournalLines(journalLines);
      
      return {
        success: true,
        depreciated_amount: totalDepreciationAmount,
        journal_id: journalId
      };
    }

    return {
      success: true,
      depreciated_amount: 0,
      message: 'Tidak ada aset aktif yang perlu disusutkan untuk periode ini.'
    };
  }
}

module.exports = new AssetService();
