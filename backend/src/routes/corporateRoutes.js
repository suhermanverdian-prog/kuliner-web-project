const express = require('express');
const router = express.Router();
const corporateController = require('../controllers/corporateController');
const permissionGuard = require('../middleware/permissionGuard');

router.get('/', permissionGuard('system', 'view'), corporateController.getPartners);
router.post('/', permissionGuard('system', 'edit'), corporateController.createPartner);
router.put('/:id', permissionGuard('system', 'edit'), corporateController.updatePartner);
router.delete('/:id', permissionGuard('system', 'edit'), corporateController.deletePartner);

module.exports = router;
