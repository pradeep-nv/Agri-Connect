import React, { useState, useEffect, useRef } from 'react';
import './FarmingNews.scss';
import newRequest from '../../utils/newRequest.js';

// Material Icons
import NewspaperOutlinedIcon from '@mui/icons-material/NewspaperOutlined';
import ChevronLeftOutlinedIcon from '@mui/icons-material/ChevronLeftOutlined';
import ChevronRightOutlinedIcon from '@mui/icons-material/ChevronRightOutlined';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';

const DEFAULT_NEWS_IMAGE = "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=600&q=80";

const FarmingNews = () => {
  const [newsData, setNewsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await newRequest.get('/api/news/farming_news');
        const data = Array.isArray(response.data) ? response.data : [];
        setNewsData(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching news:", err);
        setError("Unable to load latest news");
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const handleScroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Recent";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const getSourceName = (source) => {
    if (!source) return "Agri News";
    if (typeof source === 'string') return source;
    if (typeof source === 'object' && source.name) return source.name;
    return "Agri News";
  };

  if (loading) {
    return (
      <div className="farmingNewsWidget">
        <div className="newsHeader">
          <div className="headerTitle">
            <NewspaperOutlinedIcon className="headerIcon" />
            <h2>Latest Agricultural News</h2>
          </div>
        </div>
        <div className="newsSkeletonGrid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeletonCard">
              <div className="skeletonImage"></div>
              <div className="skeletonText line1"></div>
              <div className="skeletonText line2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="farmingNewsWidget">
      <div className="newsHeader">
        <div className="headerTitle">
          <NewspaperOutlinedIcon className="headerIcon" />
          <div className="titleWrapper">
            <h2>Latest Agricultural News & Trends</h2>
            <span className="subtitle">Real-time farming updates, market policies, and harvest tech</span>
          </div>
        </div>
        <div className="scrollControls">
          <button 
            type="button" 
            className="controlBtn" 
            onClick={() => handleScroll('left')} 
            title="Scroll Left"
          >
            <ChevronLeftOutlinedIcon />
          </button>
          <button 
            type="button" 
            className="controlBtn" 
            onClick={() => handleScroll('right')} 
            title="Scroll Right"
          >
            <ChevronRightOutlinedIcon />
          </button>
        </div>
      </div>

      <div ref={scrollContainerRef} className="newsScrollContainer">
        {newsData.length > 0 ? (
          newsData.map((news, index) => {
            const headline = typeof news.title === 'string' ? news.title : (news.headline || "Agriculture News Update");
            const sourceName = getSourceName(news.source);
            const imageUrl = news.urlToImage || DEFAULT_NEWS_IMAGE;
            const articleUrl = news.url || "#";
            const pubDate = formatDate(news.publishedAt || news.date);
            const description = news.description ? news.description.substring(0, 110) + "..." : "";

            return (
              <article key={news.id || index} className="newsCard">
                <div className="cardMedia">
                  <img 
                    src={imageUrl} 
                    alt={headline} 
                    onError={(e) => { e.target.src = DEFAULT_NEWS_IMAGE; }} 
                  />
                  <span className="sourceBadge">{sourceName}</span>
                </div>

                <div className="cardBody">
                  <div className="dateMeta">
                    <CalendarTodayOutlinedIcon style={{ fontSize: 13 }} />
                    <span>{pubDate}</span>
                  </div>

                  <h3 className="cardTitle" title={headline}>{headline}</h3>

                  {description && <p className="cardDesc">{description}</p>}

                  <a 
                    href={articleUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="readLink"
                  >
                    <span>Read Full Story</span>
                    <OpenInNewOutlinedIcon style={{ fontSize: 14 }} />
                  </a>
                </div>
              </article>
            );
          })
        ) : (
          <div className="noNewsMsg">No news articles currently available. Check back soon!</div>
        )}
      </div>
    </div>
  );
};

export default FarmingNews;
