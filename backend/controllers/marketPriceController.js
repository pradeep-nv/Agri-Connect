import axios from 'axios';
import MarketPrice from '../models/marketPriceModel.js';

// Helper function to fetch and save prices with pagination
export const fetchAndSavePrices = async () => {
    const apiKey = process.env.DATA_GOV_IN_API_KEY;
    
    if (!apiKey || apiKey === 'your_key_here') {
         throw new Error("API Key is missing or invalid. Please add DATA_GOV_IN_API_KEY to your .env file.");
    }

    let offset = 0;
    const limit = 500;
    let totalSynced = 0;
    let hasMore = true;

    while (hasMore) {
        const url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${apiKey}&format=json&limit=${limit}&offset=${offset}&filters[state]=Karnataka`;
        
        const response = await axios.get(url);
        const records = response.data.records;
        
        if (!records || records.length === 0) {
            hasMore = false;
            break;
        }

        // Save / overwrite records in MongoDB
        for (const item of records) {
            await MarketPrice.findOneAndUpdate(
                { market: item.market, commodity: item.commodity },
                {
                    state: item.state,
                    district: item.district,
                    market: item.market,
                    commodity: item.commodity,
                    variety: item.variety,
                    minPrice: Number(item.min_price),
                    maxPrice: Number(item.max_price),
                    modalPrice: Number(item.modal_price),
                    arrivalDate: item.arrival_date
                },
                { upsert: true, new: true }
            );
        }

        totalSynced += records.length;
        
        if (records.length < limit) {
            hasMore = false; // Reached the end of the data
        } else {
            offset += limit;
        }
    }
    
    return totalSynced;
};

// Sync prices from data.gov.in (overwrite old prices per market/commodity) - API Endpoint
export const syncKarnatakaPrices = async (req, res) => {
    try {
        const count = await fetchAndSavePrices();
        
        if (count === 0) {
            return res.status(404).json({ error: "No records found from data.gov.in" });
        }

        res.status(200).json({ success: true, count, message: "Live Market Prices Synced successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get prices from MongoDB for frontend
export const getPrices = async (req, res) => {
    try {
        const { district, commodity } = req.query;
        let query = {};
        
        if (district) {
            query.district = { $regex: new RegExp(district, "i") };
        }
        if (commodity) {
            query.commodity = { $regex: new RegExp(commodity, "i") };
        }

        const prices = await MarketPrice.find(query).sort({ district: 1, commodity: 1 });
        res.status(200).json(prices);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
