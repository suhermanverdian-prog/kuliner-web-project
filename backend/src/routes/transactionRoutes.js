const express = require('express');
const router = express.Router();
const { z } = require('zod');
const { validateBody } = require('../middleware/validate');
const transactionController = require('../controllers/transactionController');

// ====================================================================
// Zod Schema for POS Transaction Validation (KEN Enterprise Standard)
// ====================================================================
// NOTE: normalizeKeys() di validate.js mengubah camelCase → snake_case
// sebelum validasi, jadi schema ini harus FULL snake_case.
const transactionItemSchema = z.object({
    id: z.string().uuid("ID Menu harus berupa UUID yang valid"),
    qty: z.number().positive("Kuantitas barang harus lebih besar dari 0"),
    price: z.number().nonnegative("Harga barang tidak boleh bernilai negatif"),
    name: z.string().optional(),
    category: z.string().optional(),
    custom_recipe: z.any().optional(),
    customRecipe: z.any().optional(),
    notes: z.string().nullable().optional(),
}).passthrough(); // izinkan field tambahan dari cart

const posTransactionSchema = z.object({
    customer_name:    z.string().nullable().optional().default('Tamu'),
    customer_phone:   z.string().nullable().optional().default(null),
    promo_code:       z.string().nullable().optional().default(null),
    payment_method:   z.string().optional().default('Tunai'),
    cashier_name:     z.string().optional().default('System'),
    table_type:       z.string().optional().default('Take Away'),
    discount_amount:  z.number().nonnegative().optional().default(0),  // discountAmount → snake
    tax_amount:       z.number().nonnegative().optional().default(0),   // taxAmount → snake
    tax:              z.number().nonnegative().optional().default(0),   // alias dari frontend
    unique_code:      z.number().optional().default(0),
    total:            z.number().nonnegative('Total transaksi tidak boleh negatif'),
    items:            z.array(transactionItemSchema).min(1, 'Transaksi minimal 1 barang'),
    cash_received:    z.number().nonnegative().optional(),
    tenant_id:        z.string().uuid().nullable().optional(),
    created_at:       z.string().optional(),
}).passthrough(); // toleransi field tambahan


/**
 * @route GET /api/transactions
 */
router.get('/', transactionController.getTransactions);

/**
 * @route GET /api/transactions/laporantrend
 */
router.get('/laporantrend', transactionController.getTrendReport);

/**
 * @route POST /api/transactions
 */
router.post('/', validateBody(posTransactionSchema), transactionController.createTransaction);

/**
 * @route PUT /api/transactions/:id/confirm
 */
router.put('/:id/confirm', transactionController.confirmPayment);

/**
 * @route PUT /api/transactions/:id/kds
 */
router.put('/:id/kds', transactionController.updateKdsStatus);

/**
 * @route POST /api/transactions/:id/request-void
 */
router.post('/:id/request-void', transactionController.requestVoid);

/**
 * @route POST /api/transactions/:id/approve-void
 */
router.post('/:id/approve-void', transactionController.approveVoid);

/**
 * @route GET /api/transactions/top-selling
 */
router.get('/top-selling', transactionController.getTopSelling);

module.exports = router;
