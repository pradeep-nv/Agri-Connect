import express from "express";
import { getAlgorithmicRecommendation } from "../controllers/algoController.js";

const router = express.Router();

router.post("/algorithmic-recommendation", getAlgorithmicRecommendation);

export default router;
