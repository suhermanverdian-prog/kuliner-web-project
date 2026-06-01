// backend/src/routes/customisationRoutes.js
const router = require('express').Router();
const { getCustomisations, upsertCustomisation } = require('../controllers/customisationController');

// All routes are protected by auth middleware globally (app.js).
router.get('/', getCustomisations);
router.post('/', upsertCustomisation);

module.exports = router;
