import express from 'express'
import { getRecommendations, getDiseaseTreatmentPlan, getBaselineTreatmentPlan } from '../controllers/recommendationController.js';
import { verifyToken } from '../middleware/jwt.js';


const router = express.Router();

router.post('/recommendations', getRecommendations);
router.post('/disease-treatment', getDiseaseTreatmentPlan);
router.post('/baseline-treatment', getBaselineTreatmentPlan);

export default router
