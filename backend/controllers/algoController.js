import { recommendationEngine } from "../utils/recommendationAlgorithm.js";

export const getAlgorithmicRecommendation = async (req, res) => {
    try {
        const { N, P, K, ph, rain, temp, humi, moist } = req.body;

        if (N === undefined || P === undefined || K === undefined) {
            return res.status(400).json({ error: "Missing soil parameters (N, P, K)" });
        }

        // The CSV uses N, P, K, temp, humi, moist
        const inputData = {
            N: Number(N),
            P: Number(P),
            K: Number(K),
            ph: Number(ph),
            rain: Number(rain),
            temp: Number(temp) || 0,
            humi: Number(humi) || 0,
            moist: Number(moist) || 0
        };

        const { crop, fertilizer } = await recommendationEngine.predict(inputData);

        res.status(200).json({
            prediction: crop,
            fertilizer: fertilizer
        });
    } catch (error) {
        console.error("Algorithm Error:", error);
        res.status(500).json({ error: "Failed to generate recommendation" });
    }
};
