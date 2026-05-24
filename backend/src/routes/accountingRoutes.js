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
  payment_method: z.string().min(1, 'Metode pembayaran wajib diisi'),
  date: z.string().optional().nullable()
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

module.exports = router;
