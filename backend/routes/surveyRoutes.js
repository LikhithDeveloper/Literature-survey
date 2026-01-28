const express = require('express');
const router = express.Router();
const {
  createSurvey,
  getSurveys,
  getSurvey,
  deleteSurvey,
  exportSurvey
} = require('../controllers/surveyController');
const { protect } = require('../middleware/auth');
const { upload, handleMulterError } = require('../middleware/upload');

// All routes are protected
router.use(protect);

// Survey CRUD
router.post('/create', upload.array('documents', 10), handleMulterError, createSurvey);
router.get('/', getSurveys);
router.get('/:id', getSurvey);
router.delete('/:id', deleteSurvey);
router.get('/:id/export', exportSurvey);

module.exports = router;
