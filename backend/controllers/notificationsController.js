import axios from 'axios';
import dotenv from 'dotenv';

const FALLBACK_ALERTS = [
  "⚠️ High Humidity Alert: Inspect crops for potential fungal infections.",
  "🌧️ Light Rainfall Expected: Postpone fertilizer application for 24 hours.",
  "💡 Pest Control Tip: Apply neem spray early morning for optimal efficacy.",
  "☀️ High Solar Radiation: Ensure adequate irrigation for seedling plots."
];

export const getFarmingAlerts = async (req, res) => {
  dotenv.config();
  const { region = "Karnataka" } = req.query;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.log("No GEMINI_API_KEY found, using fallback farming alerts.");
    return res.status(200).json({
      alerts: FALLBACK_ALERTS.slice(0, 2).join("\n"),
      region
    });
  }

  try {
    const promptText = `
      Provide 2 concise, urgent farming alerts for farmers in the ${region} region today.
      Focus on weather advisories, pest precautions, or irrigation tips.
      Keep each alert short (max 12 words) with relevant emojis.
    `;

    // Try Gemini 1.5 Flash / 2.5 Flash
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [{ text: promptText.trim() }]
          }
        ]
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      }
    );

    if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      const alerts = response.data.candidates[0].content.parts[0].text;
      return res.status(200).json({ alerts, region });
    }

    return res.status(200).json({
      alerts: FALLBACK_ALERTS.slice(0, 2).join("\n"),
      region
    });
  } catch (err) {
    console.error("Error fetching Gemini farming alerts, returning fallback alerts:", err.message);
    return res.status(200).json({
      alerts: FALLBACK_ALERTS.slice(0, 2).join("\n"),
      region
    });
  }
};
