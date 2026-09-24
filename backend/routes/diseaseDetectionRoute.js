import express from 'express';
import { detectDisease, upload } from '../controllers/diseaseDetectionController.js';

const router = express.Router();

// POST /api/disease/detect
// Body: multipart/form-data  →  field name: "image"
router.post('/detect', upload.single('image'), detectDisease);

export default router;
