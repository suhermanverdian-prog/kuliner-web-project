const OpnameService = require('../src/services/opnameService');
const OpnameRepository = require('../src/repositories/opnameRepository');
const InventoryRepository = require('../src/repositories/inventoryRepository');
const TransactionRepository = require('../src/repositories/transactionRepository');
const { supabase } = require('../src/supabase');

// Mock all internal dependency calls to ensure test independence and zero database state dependency
jest.mock('../src/repositories/opnameRepository');
jest.mock('../src/repositories/inventoryRepository');
jest.mock('../src/repositories/transactionRepository');
jest.mock('../src/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    insert: jest.fn().mockResolvedValue({ error: null })
  }
}));

describe('OpnameService Integration Suite (SCBD Grade Standards)', () => {
  const tenantId = '123e4567-e89b-12d3-a456-426614174000';
  const outletId = '987f6543-e89b-12d3-a456-426614174000';
  const userId = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('startOpname', () => {
    it('should throw error if there is already an active session', async () => {
      OpnameRepository.getSessions.mockResolvedValue([{ status: 'in_progress' }]);

      await expect(OpnameService.startOpname(tenantId, outletId, userId))
        .rejects.toThrow('Ada sesi Stok Opname yang sedang aktif');
    });

    it('should throw error if no active materials are found in database', async () => {
      OpnameRepository.getSessions.mockResolvedValue([]);
      InventoryRepository.getBahan.mockResolvedValue([]);

      await expect(OpnameService.startOpname(tenantId, outletId, userId))
        .rejects.toThrow('Tidak ada bahan baku aktif');
    });

    it('should create new active session and snapshot materials stock correctly', async () => {
      OpnameRepository.getSessions.mockResolvedValue([]);
      
      const mockMaterials = [
        { id: 'b1', name: 'Arabica Coffee Beans', stock: 100, is_active: true },
        { id: 'b2', name: 'Fresh Milk', stock: 50, is_active: true }
      ];
      InventoryRepository.getBahan.mockResolvedValue(mockMaterials);

      const mockSession = { id: 'session-uuid', tenant_id: tenantId, status: 'in_progress' };
      OpnameRepository.createSession.mockResolvedValue(mockSession);
      OpnameRepository.createSessionItems.mockResolvedValue(true);
      
      OpnameRepository.getSessionById.mockResolvedValue(mockSession);
      OpnameRepository.getSessionItems.mockResolvedValue(mockMaterials.map(m => ({
        id: `item-${m.id}`,
        bahan_id: m.id,
        stock_sistem: m.stock,
        stock_fisik: null,
        variance: null,
        bahan: m
      })));

      const result = await OpnameService.startOpname(tenantId, outletId, userId, 'blind');

      expect(result).toHaveProperty('id', 'session-uuid');
      expect(result).toHaveProperty('status', 'in_progress');
      expect(OpnameRepository.createSessionItems).toHaveBeenCalled();
    });
  });

  describe('recordCount', () => {
    it('should calculate variance and record count correctly', async () => {
      const sessionId = 'session-123';
      const itemId = 'item-123';
      const count = 92; // System had 100, variance should be -8

      OpnameRepository.getSessionById.mockResolvedValue({ id: sessionId, status: 'in_progress' });
      
      const mockItem = { id: itemId, stock_sistem: 100 };
      supabase.single.mockResolvedValue({ data: mockItem, error: null });

      OpnameRepository.updateItemCount.mockResolvedValue(true);

      const success = await OpnameService.recordCount(sessionId, itemId, count, 'Shrinkage beans', userId, tenantId);
      
      expect(success).toBe(true);
      expect(OpnameRepository.updateItemCount).toHaveBeenCalledWith(
        itemId,
        tenantId,
        expect.objectContaining({
          stock_fisik: 92,
          variance: -8,
          notes: 'Shrinkage beans'
        })
      );
    });
  });

  describe('getSessionById (Dynamic Neural Variance Analyzer)', () => {
    it('should dynamically calculate variance percentage and categorize on the fly', async () => {
      const mockSession = { id: 'session-123', status: 'in_progress' };
      const mockItems = [
        // 0% variance -> normal
        { id: 'i1', stock_sistem: 100, stock_fisik: 100, variance: 0, bahan: { name: 'Beans', cost: 100 } },
        // 6% variance -> minor
        { id: 'i2', stock_sistem: 100, stock_fisik: 94, variance: -6, bahan: { name: 'Milk', cost: 20 } },
        // 15% variance -> major
        { id: 'i3', stock_sistem: 100, stock_fisik: 115, variance: 15, bahan: { name: 'Matcha', cost: 400 } }
      ];

      OpnameRepository.getSessionById.mockResolvedValue(mockSession);
      OpnameRepository.getSessionItems.mockResolvedValue(mockItems);

      const result = await OpnameService.getSessionById('session-123', tenantId);

      expect(result.items[0]).toHaveProperty('variance_category', 'normal');
      expect(result.items[0]).toHaveProperty('variance_pct', 0);

      expect(result.items[1]).toHaveProperty('variance_category', 'minor');
      expect(result.items[1]).toHaveProperty('variance_pct', 6);

      expect(result.items[2]).toHaveProperty('variance_category', 'major');
      expect(result.items[2]).toHaveProperty('variance_pct', 15);
    });
  });

  describe('approveOpname', () => {
    it('should throw error if opname session is not in completed state', async () => {
      OpnameRepository.getSessionById.mockResolvedValue({ id: 'session-123', status: 'in_progress' });

      await expect(OpnameService.approveOpname('session-123', userId, tenantId))
        .rejects.toThrow('Hanya sesi opname berstatus "completed" yang dapat disetujui');
    });

    it('should write inventory logs and post double-entry adjustment journals on approved session', async () => {
      const sessionId = 'session-123';
      OpnameRepository.getSessionById.mockResolvedValue({ id: sessionId, status: 'completed' });

      const mockItems = [
        { id: 'i1', bahan_id: 'b1', stock_sistem: 100, stock_fisik: 90, variance: -10, bahan: { name: 'Beans', cost: 100 } }
      ];
      OpnameRepository.getSessionItems.mockResolvedValue(mockItems);

      TransactionRepository.updateStockDirect.mockResolvedValue({ error: null });
      TransactionRepository.getSettings.mockResolvedValue({
        accounting_map: { inventory: '1-2000', hpp: '5-1000' }
      });
      TransactionRepository.getAccountsByCodes.mockResolvedValue([
        { id: 'acc-inv', code: '1-2000' },
        { id: 'acc-hpp', code: '5-1000' }
      ]);
      TransactionRepository.insertJournalHeader.mockResolvedValue(true);
      TransactionRepository.insertJournalLines.mockResolvedValue(true);
      OpnameRepository.createApprovalLog.mockResolvedValue(true);
      
      OpnameRepository.updateSession.mockResolvedValue({ id: sessionId, status: 'approved' });

      const result = await OpnameService.approveOpname(sessionId, userId, tenantId, 'Adjust physical stock');

      expect(result).toHaveProperty('status', 'approved');
      expect(TransactionRepository.updateStockDirect).toHaveBeenCalledWith('b1', 90, tenantId);
      expect(TransactionRepository.insertJournalHeader).toHaveBeenCalled();
      expect(TransactionRepository.insertJournalLines).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ account_id: 'acc-hpp', debit: 1000 }),
          expect.objectContaining({ account_id: 'acc-inv', credit: 1000 })
        ])
      );
    });
  });
});
