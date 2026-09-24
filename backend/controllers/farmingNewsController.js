import axios from 'axios';

const FALLBACK_FARMING_NEWS = [
  {
    title: "Government Announces New Subsidies for Solar Irrigation Pumps",
    description: "New agricultural initiatives offer up to 60% financial assistance for farmers adopting solar-powered irrigation systems across Karnataka and Southern regions.",
    url: "https://pib.gov.in",
    urlToImage: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=600&q=80",
    publishedAt: new Date().toISOString(),
    source: { name: "Ministry of Agriculture" }
  },
  {
    title: "Monsoon Forecast Update: Optimal Rainfall Expected for Rabi Crops",
    description: "Agronomists recommend early sowing schedules for wheat, mustard, and gram as favorable weather patterns arrive across key agrarian belts.",
    url: "https://mausam.imd.gov.in",
    urlToImage: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80",
    publishedAt: new Date(Date.now() - 86400000).toISOString(),
    source: { name: "AgriWeather India" }
  },
  {
    title: "AI-Powered Pest Management Boosts Crop Yields by 25%",
    description: "Digital field monitoring and image-based leaf diagnostics help smallholder farmers reduce chemical pesticide usage while maintaining healthy crops.",
    url: "https://icar.org.in",
    urlToImage: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=600&q=80",
    publishedAt: new Date(Date.now() - 172800000).toISOString(),
    source: { name: "Indian Council of Ag Research" }
  },
  {
    title: "Organic Fertilizer & Bio-Pesticide Subsidy Drive Launched",
    description: "State farming boards promote sustainable soil enrichment with zero-budget natural farming techniques and certified organic inputs.",
    url: "https://agricoop.nic.in",
    urlToImage: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=600&q=80",
    publishedAt: new Date(Date.now() - 259200000).toISOString(),
    source: { name: "AgriTech Today" }
  },
  {
    title: "Market Price Surge for Pulses & Millets on Mandi Exchanges",
    description: "Export demand drives procurement rates higher for arhar, moong, and ragi in major agricultural mandis this quarter.",
    url: "https://enam.gov.in",
    urlToImage: "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=600&q=80",
    publishedAt: new Date(Date.now() - 345600000).toISOString(),
    source: { name: "e-NAM Portal" }
  }
];

export const getFarmingNews = async (req, res) => {
  const api_key = process.env.NEWS_API_KEY;

  if (!api_key) {
    return res.status(200).json(FALLBACK_FARMING_NEWS);
  }

  const url = `https://newsapi.org/v2/everything?q=agriculture+OR+farming+OR+crops&sortBy=publishedAt&language=en&apiKey=${api_key}`;

  try {
    const response = await axios.get(url);
    const articles = response.data.articles;
    
    if (articles && articles.length > 0) {
      return res.status(200).json(articles);
    } else {
      return res.status(200).json(FALLBACK_FARMING_NEWS);
    }
  } catch (err) {
    console.error("Error fetching news from API, serving fallback farming news:", err.message);
    return res.status(200).json(FALLBACK_FARMING_NEWS);
  }
};