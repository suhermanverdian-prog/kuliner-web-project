require('dotenv').config();
const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');

console.log('✅ [System] User Routes Loaded (v2.0 - Clean Architecture)');

/**
 * @route POST /api/login
 * @desc Optimized Enterprise Login with Prefetched Context
 */
router.post('/login', userController.login);

/**
 * @route GET /api/users
 */
router.get('/users', userController.getUsers);

/**
 * @route GET /api/employees
 * @desc Get all users for active tenant with payroll profiles mapped from JSONB permissions
 */
router.get('/employees', userController.getEmployees);

/**
 * @route POST /api/employeeprofile/:id
 * @desc Save employee payroll profile inside the user's permissions JSONB column
 */
router.post('/employeeprofile/:id', userController.updateEmployeeProfile);

/**
 * @route POST /api/users
 */
router.post('/users', userController.createUser);

/**
 * @route PUT /api/users/:id
 */
router.put('/users/:id', userController.updateUser);

/**
 * @route DELETE /api/users/:id
 */
router.delete('/users/:id', userController.deleteUser);

/**
 * @route GET /api/roles/permissions
 */
router.get('/roles/permissions', userController.getRolePermissions);

/**
 * @route POST /api/roles/permissions
 */
router.post('/roles/permissions', userController.saveRolePermissions);

/**
 * @route GET /api/tenants
 * @desc Get all tenants (SuperAdmin Only)
 */
router.get('/tenants', userController.getTenants);

/**
 * @route PUT /api/tenants/:id
 * @desc Update tenant data (SuperAdmin Only)
 */
router.put('/tenants/:id', userController.updateTenant);

/**
 * @route PUT /api/tenant/me/features
 * @desc Update tenant feature_overrides (Owner Only)
 */
router.put('/tenant/me/features', userController.updateTenantFeatures);

/**
 * @route POST /api/tenants
 * @desc Register new client (SuperAdmin Only)
 */
router.post('/tenants', userController.createTenant);

/**
 * @route GET /api/customers
 */
router.get('/customers', userController.getCustomers);

/**
 * @route GET /api/paymentmethods
 */
router.get('/paymentmethods', userController.getPaymentMethods);
router.post('/paymentmethods', userController.addPaymentMethod);
router.put('/paymentmethods/:id', userController.updatePaymentMethod);
router.put('/paymentmethods', userController.updatePaymentMethod);
router.delete('/paymentmethods/:id', userController.deletePaymentMethod);

/**
 * @route POST /api/system-logs
 * @desc Receive and store page navigation logs or other system logs in activity_logs
 */
router.post('/system-logs', userController.logSystemActivity);

module.exports = router;
