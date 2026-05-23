/**
 * ShiftRepository Unit Tests
 * Menggunakan Supabase mock client untuk menguji lapisan data tanpa koneksi database asli.
 */

// --- Mock Supabase Client ---
const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockEq = jest.fn();
const mockGte = jest.fn();
const mockOrder = jest.fn();
const mockSingle = jest.fn();
const mockMaybeSingle = jest.fn();

// Chainable mock builder
function createChain() {
  const chain = {
    select: jest.fn(() => chain),
    insert: jest.fn(() => chain),
    update: jest.fn(() => chain),
    eq: jest.fn(() => chain),
    gte: jest.fn(() => chain),
    order: jest.fn(() => chain),
    single: jest.fn(() => Promise.resolve({ data: null, error: null })),
    maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: null })),
  };
  return chain;
}

let mockChain;

jest.mock('../../src/supabase', () => ({
  supabase: {
    from: jest.fn(() => mockChain),
  },
}));

const AppError = require('../../src/utils/AppError');

// Re-require after mock
let shiftRepository;

beforeEach(() => {
  jest.clearAllMocks();
  mockChain = createChain();
  // Re-require to get fresh module with mocks
  jest.isolateModules(() => {
    shiftRepository = require('../../src/repositories/shiftRepository');
  });
});

describe('ShiftRepository', () => {
  // =============================================
  // findByTenant
  // =============================================
  describe('findByTenant(tenantId)', () => {
    it('should return all shifts for a given tenant', async () => {
      const mockShifts = [
        { id: 'shift-1', tenant_id: 'tenant-a', status: 'open' },
        { id: 'shift-2', tenant_id: 'tenant-a', status: 'closed' },
      ];

      mockChain.order.mockResolvedValue({ data: mockShifts, error: null });

      const result = await shiftRepository.findByTenant('tenant-a');

      expect(result).toEqual(mockShifts);
      expect(mockChain.eq).toHaveBeenCalledWith('tenant_id', 'tenant-a');
      expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should throw AppError on database failure', async () => {
      mockChain.order.mockResolvedValue({
        data: null,
        error: { message: 'connection failed' },
      });

      await expect(shiftRepository.findByTenant('tenant-a'))
        .rejects
        .toThrow(AppError);
    });
  });

  // =============================================
  // findActiveShift
  // =============================================
  describe('findActiveShift(tenantId)', () => {
    it('should return the active (open) shift', async () => {
      const openShift = { id: 'shift-1', tenant_id: 'tenant-a', status: 'open' };

      mockChain.maybeSingle.mockResolvedValue({ data: openShift, error: null });

      const result = await shiftRepository.findActiveShift('tenant-a');

      expect(result).toEqual(openShift);
      // Should filter by tenant_id AND status='open'
      expect(mockChain.eq).toHaveBeenCalledWith('tenant_id', 'tenant-a');
      expect(mockChain.eq).toHaveBeenCalledWith('status', 'open');
    });

    it('should return null if no active shift exists', async () => {
      mockChain.maybeSingle.mockResolvedValue({ data: null, error: null });

      const result = await shiftRepository.findActiveShift('tenant-a');

      expect(result).toBeNull();
    });

    it('should throw AppError on database failure', async () => {
      mockChain.maybeSingle.mockResolvedValue({
        data: null,
        error: { message: 'db error' },
      });

      await expect(shiftRepository.findActiveShift('tenant-a'))
        .rejects
        .toThrow(AppError);
    });
  });

  // =============================================
  // create
  // =============================================
  describe('create(tenantId, shiftData)', () => {
    it('should create a new shift with tenant_id injected', async () => {
      const newShift = {
        id: 'shift-new',
        tenant_id: 'tenant-a',
        status: 'open',
        initial_cash: 500000,
      };

      mockChain.single.mockResolvedValue({ data: newShift, error: null });

      const result = await shiftRepository.create('tenant-a', {
        status: 'open',
        initial_cash: 500000,
      });

      expect(result).toEqual(newShift);
      expect(mockChain.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          tenant_id: 'tenant-a',
          status: 'open',
          initial_cash: 500000,
        }),
      ]);
    });

    it('should throw AppError on insert failure', async () => {
      mockChain.single.mockResolvedValue({
        data: null,
        error: { message: 'insert failed' },
      });

      await expect(
        shiftRepository.create('tenant-a', { status: 'open' })
      ).rejects.toThrow(AppError);
    });
  });

  // =============================================
  // update
  // =============================================
  describe('update(tenantId, shiftId, updateData)', () => {
    it('should update shift and enforce tenant isolation', async () => {
      const updatedShift = {
        id: 'shift-1',
        tenant_id: 'tenant-a',
        status: 'closed',
        closing_cash: 1500000,
      };

      mockChain.single.mockResolvedValue({ data: updatedShift, error: null });

      const result = await shiftRepository.update('tenant-a', 'shift-1', {
        status: 'closed',
        closing_cash: 1500000,
      });

      expect(result).toEqual(updatedShift);
      // Must filter by BOTH id and tenant_id (Zero-Trust Multi-Tenancy)
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'shift-1');
      expect(mockChain.eq).toHaveBeenCalledWith('tenant_id', 'tenant-a');
    });

    it('should throw AppError on update failure', async () => {
      mockChain.single.mockResolvedValue({
        data: null,
        error: { message: 'update failed' },
      });

      await expect(
        shiftRepository.update('tenant-a', 'shift-1', { status: 'closed' })
      ).rejects.toThrow(AppError);
    });
  });

  // =============================================
  // getSalesAggregation
  // =============================================
  describe('getSalesAggregation(tenantId, startTime)', () => {
    it('should aggregate sales correctly by payment method', async () => {
      const mockTxs = [
        { total: 25000, payment_method: 'Tunai' },
        { total: 35000, payment_method: 'QRIS' },
        { total: 50000, payment_method: 'Tunai' },
        { total: 18000, payment_method: 'Debit BCA' },
      ];

      // The last chained call before resolution
      mockChain.gte.mockResolvedValue({ data: mockTxs, error: null });

      const result = await shiftRepository.getSalesAggregation(
        'tenant-a',
        '2026-05-22T08:00:00Z'
      );

      expect(result.currentSalesCount).toBe(4);
      expect(result.currentSales).toBe(128000);
      expect(result.currentCash).toBe(75000); // 25000 + 50000
      expect(result.currentQris).toBe(35000);
      expect(result.currentDebit).toBe(18000);
    });

    it('should return zeros when no transactions exist', async () => {
      mockChain.gte.mockResolvedValue({ data: [], error: null });

      const result = await shiftRepository.getSalesAggregation(
        'tenant-a',
        '2026-05-22T08:00:00Z'
      );

      expect(result.currentSalesCount).toBe(0);
      expect(result.currentSales).toBe(0);
      expect(result.currentCash).toBe(0);
    });

    it('should throw AppError on query failure', async () => {
      mockChain.gte.mockResolvedValue({
        data: null,
        error: { message: 'query failed' },
      });

      await expect(
        shiftRepository.getSalesAggregation('tenant-a', '2026-05-22T08:00:00Z')
      ).rejects.toThrow(AppError);
    });
  });
});
