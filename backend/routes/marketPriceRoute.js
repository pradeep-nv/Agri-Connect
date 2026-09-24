import express from 'express';
import { syncKarnatakaPrices, getPrices } from '../controllers/marketPriceController.js';

const router = express.Router();

router.get('/market-prices/sync', syncKarnatakaPrices);
router.get('/market-prices', getPrices);

export default router;
