const { z } = require('zod');

/**
 * @function normalizeKeys
 * @description Mengonversi kunci objek camelCase menjadi snake_case secara rekursif agar sesuai dengan skema database
 */
function normalizeKeys(obj) {
    if (Array.isArray(obj)) {
        return obj.map(normalizeKeys);
    } else if (obj !== null && typeof obj === 'object') {
        const newObj = {};
        for (const key of Object.keys(obj)) {
            // Ubah camelCase ke snake_case (misal: customerName -> customer_name)
            const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
            newObj[snakeKey] = normalizeKeys(obj[key]);
        }
        return newObj;
    }
    return obj;
}

/**
 * @function validateBody
 * @description Middleware Express universal untuk memvalidasi req.body menggunakan skema Zod
 * @param {z.ZodSchema} schema - Skema Zod untuk validasi
 * @returns {Function} Express middleware handler
 */
function validateBody(schema) {
    return (req, res, next) => {
        // 1. Normalisasi otomatis camelCase dari frontend ke snake_case
        const normalizedData = normalizeKeys(req.body);

        // 2. Lakukan validasi Zod
        const result = schema.safeParse(normalizedData);

        if (!result.success) {
            console.error('❌ [Validation] Zod Validation Failed:', result.error.format());
            return res.status(400).json({
                error: 'Validasi input gagal',
                details: result.error.issues.map(err => ({
                    path: err.path.join('.'),
                    message: err.message
                }))
            });
        }

        // 3. Ganti req.body dengan data yang telah disanitasi & memiliki tipe data yang benar dari Zod
        req.body = result.data;
        next();
    };
}

module.exports = {
    validateBody,
    normalizeKeys
};
