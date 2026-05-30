process.env.NODE_ENV = 'test';
const request = require('supertest');
const shiftRepository = require('../src/repositories/shiftRepository');

// We do not mock '../src/server' completely because supertest needs the actual express app instance.
// Instead, we let the real server.js load. Since process.env.NODE_ENV is set to 'test' at the very top,
// the server.listen() won't be called.
// Mock tierGuard to bypass feature checks
jest.mock('../src/middleware/tierGuard', () => ({
  requireFeature: () => (req, res, next) => next()
}));
jest.mock('../src/middleware/activityLog', () => (req, res, next) => next());
jest.mock('../src/supabase', () => {
  const mockFrom = jest.fn().mockImplementation(() => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: { tier: 'enterprise', feature_overrides: {} }, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    insert: jest.fn().mockResolvedValue({ data: null, error: null })
  }));
  return { supabase: { from: mockFrom }, getTenantClient: jest.fn() };
});


const app = require('../src/server');

describe('GET /api/shifts/:id/audit', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return audit data with proper fields', async () => {
    const tenantId = '00000000-0000-0000-0000-000000000000'; // guest master tenant
    const shiftId = 'test-shift-id'; // assume a shift exists in DB

    // Use jest.spyOn to mock shiftRepository methods
    jest.spyOn(shiftRepository, 'getById').mockResolvedValue({
      id: shiftId,
      tenant_id: tenantId,
      start_time: '2023-01-01T00:00:00.000Z',
      initial_cash: 100000,
      closing_cash: 150000,
      notes: ''
    });

    jest.spyOn(shiftRepository, 'getSalesAggregation').mockResolvedValue({
      currentSales: 50000,
      currentSalesCount: 10,
      currentCash: 50000,
      currentQris: 0,
      currentDebit: 0
    });

    const res = await request(app)
      .get(`/api/shifts/${shiftId}/audit`)
      .set('x-tenant-id', tenantId);

    if (res.status !== 200) {
      console.error("Test failed with status:", res.status, "Body:", res.body);
    }
    expect(res.status).toBe(200);

    expect(res.body).toMatchObject({
      shiftId: shiftId,
      tenantId: tenantId,
      startTime: expect.any(String),
      endTime: null,
      initialCash: 100000,
      actualSales: 50000,
      expectedCash: 150000,
      closingCash: 150000,
      difference: 0,
      notes: ''
    });
  });
});


