import axios from "axios";

export const getRecommendations = async (req, res) => {
  const {
    climate,
    soilType,
    cropType,
    cropInfo,
    weatherDetails,
    cropConditions
  } = req.body;

  try {
    const promptText = `
Please provide farming recommendations based on the following information:

1. Climate: ${climate}
2. Soil Type: ${soilType}
3. Crop Type: ${cropType}
4. Information about the Crop: ${cropInfo}
5. Today's Weather: ${weatherDetails}
6. Crop Conditions: ${cropConditions}

Suggest:
- Farming practices
- Care tips
- Precautions

Make it simple and farmer-friendly.
`.trim();

    // Verify model version in logs
    console.log("Attempting to fetch recommendation using model: gemini-2.5-flash");

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [{ text: promptText }]
          }
        ]
      },
      {
        headers: {
          "Content-Type": "application/json"
        },
        timeout: 60000
      }
    );

    const recommendation =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!recommendation) {
      return res.status(404).json({
        error: "No recommendation generated"
      });
    }

    return res.status(200).json({ recommendation });

  } catch (err) {
    console.error(
      "Gemini API Error:",
      err.response?.data || err.message
    );

    return res.status(500).json({
      error: "Failed to fetch recommendations"
    });
  }
};

export const getDiseaseTreatmentPlan = async (req, res) => {
  const { disease, confidence } = req.body;

  try {
    const promptText = `
The deterministic CNN model has diagnosed a Mango tree leaf with the disease: "${disease}" (Confidence: ${confidence}%). 
Based on this verified diagnosis, provide a specialized, step-by-step treatment plan and list any required fungicides or organic treatments. 
Please ensure the advice is actionable, safe, and easily understandable for a local mango farmer.
`.trim();

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [{ text: promptText }]
          }
        ]
      },
      {
        headers: {
          "Content-Type": "application/json"
        },
        timeout: 60000
      }
    );

    const recommendation =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!recommendation) {
      return res.status(404).json({
        error: "No AI treatment plan generated"
      });
    }

    return res.status(200).json({ plan: recommendation });
  } catch (err) {
    console.error("Gemini API Error (Disease Treatment):", err.response?.data || err.message);
    return res.status(500).json({
      error: "Failed to fetch AI treatment plan"
    });
  }
};

export const getBaselineTreatmentPlan = async (req, res) => {
  try {
    const promptText = `
I am a mango farmer and my tree's leaves look sick and have some spots. 
I don't know what the disease is. 
Please provide a treatment plan and list any required fungicides or organic treatments.
`.trim();

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [{ text: promptText }]
          }
        ]
      },
      {
        headers: {
          "Content-Type": "application/json"
        },
        timeout: 60000
      }
    );

    const recommendation =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!recommendation) {
      return res.status(404).json({
        error: "No AI treatment plan generated"
      });
    }

    return res.status(200).json({ plan: recommendation });
  } catch (err) {
    console.error("Gemini API Error (Baseline Treatment):", err.response?.data || err.message);
    return res.status(500).json({
      error: "Failed to fetch baseline treatment plan"
    });
  }
};
