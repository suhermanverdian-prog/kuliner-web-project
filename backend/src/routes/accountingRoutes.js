const express = require('express');
const router = express.Router();
const { z } = require('zod');
const permissionGuard = require('../middleware/permissionGuard');
const { validateBody } = require('../middleware/validate');
const accountingController = require('../controllers/accountingController');

// ============================================================
// VALIDATION SCHEMAS (ZOD ENTERPRISE HARDENING)
// ============================================================
const expenseSchema = z.object({
  description: z.string().min(1, 'Deskripsi biaya wajib diisi'),
  amount: z.number().positive('Jumlah biaya harus lebih besar dari 0'),
  category: z.string().min(1, 'Kategori biaya wajib diisi'),
  paymentMethod: z.string().optional().nullable(),
  payment_method: z.string().optional().nullable(),
  date: z.string().optional().nullable()
}).refine(data => data.paymentMethod || data.payment_method, {
  message: 'Metode pembayaran wajib diisi',
  path: ['payment_method']
});

const payrollSchema = z.object({
  employee_id: z.string().uuid('ID Pegawai harus dalam format UUID yang valid'),
  base_salary: z.number().nonnegative('Gaji pokok tidak boleh negatif'),
  allowances: z.number().nonnegative('Tunjangan tidak boleh negatif'),
  month: z.number().min(1).max(12),
  year: z.number().min(2000)
});
// ============================================================

/**
 * @route GET /api/accounting/summary
 * @desc Get financial summary (Laba Rugi, Neraca)
 */
router.get('/summary', permissionGuard('keuangan', 'view'), accountingController.getSummary);

/**
 * @route GET /api/accounting/accounts
 * @desc Get Chart of Accounts
 */
router.get('/accounts', accountingController.getAccounts);

/**
 * @route GET /api/accounting/ledger/:accountCode
 * @desc Get General Ledger drill-down details for a specific account
 */
router.get('/ledger/:accountCode', accountingController.getLedgerDetails);

/**
 * @route GET /api/accounting/journals
 * @desc Get Journal Entries
 */
router.get('/journals', accountingController.getJournals);

/**
 * @route POST /api/accounting/expenses
 * @desc Record a manual opex expense with balanced double-entry journals
 */
router.post('/expenses', validateBody(expenseSchema), accountingController.recordExpense);

/**
 * @route POST /api/accounting/payroll
 * @desc Pay employee salary and record double-entry accounting journals automatically
 */
router.post('/payroll', validateBody(payrollSchema), accountingController.recordPayroll);

/**
 * @route POST /api/accounting/topup
 * @desc Record a petty cash top-up
 */
router.post('/topup', accountingController.recordTopup);

// ============================================================
// BUDGETING ROUTES
// ============================================================

/**
 * @route GET /api/accounting/budgets
 * @desc Get all budgets for tenant (filter: ?year=2026&month=6)
 */
router.get('/budgets', permissionGuard('keuangan', 'view'), accountingController.getBudgets);

/**
 * @route GET /api/accounting/budgets/variance
 * @desc Get variance report: Budget vs Actual for a specific period
 */
router.get('/budgets/variance', permissionGuard('keuangan', 'view'), accountingController.getVarianceReport);

/**
 * @route POST /api/accounting/budgets
 * @desc Create or update budget entry (supports single object or array for batch)
 */
router.post('/budgets', permissionGuard('keuangan', 'create'), accountingController.saveBudget);

/**
 * @route DELETE /api/accounting/budgets/:id
 * @desc Delete a budget entry
 */
router.delete('/budgets/:id', permissionGuard('keuangan', 'delete'), accountingController.deleteBudget);

module.exports = router;
