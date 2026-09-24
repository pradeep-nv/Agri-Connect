import React, { useState, useEffect, useRef } from "react";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import LanguageOutlinedIcon from "@mui/icons-material/LanguageOutlined";
import WbSunnyOutlinedIcon from "@mui/icons-material/WbSunnyOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import DoneAllOutlinedIcon from "@mui/icons-material/DoneAllOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import profileImg from '../../assets/profile.png';
import { useTranslation } from "react-i18next";
import "./Navbar.scss";
import { Link } from "react-router-dom";
import newRequest from "../../utils/newRequest.js";

const Navbar = () => {
  const { i18n } = useTranslation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  const toggleLanguage = () => {
    const nextLang = i18n.language === "en" ? "kn" : "en";
    i18n.changeLanguage(nextLang);
    localStorage.setItem("appLang", nextLang);
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await newRequest.get("/api/farming-notifications?region=Karnataka");
        const alertsText = response.data?.alerts || "";
        const parsedAlerts = alertsText
          .split("\n")
          .filter(alert => alert.trim() !== "")
          .map((text, index) => ({
            id: index + 1,
            text: text.replace(/(\*\*|__|\#\#|\*|_)/g, ""),
            time: "Just now",
            type: index % 2 === 0 ? "Weather Alert" : "Farming Tip",
            read: false
          }));

        setNotifications(parsedAlerts.length > 0 ? parsedAlerts : [
          { id: 1, text: "⚠️ High humidity detected: Inspect crops for fungal spots.", time: "10m ago", type: "Weather Alert", read: false },
          { id: 2, text: "🌧️ Rainfall forecast for Karnataka region tomorrow.", time: "1h ago", type: "Forecast", read: false },
          { id: 3, text: "💡 Recommendation: Apply organic fertilizer before next rain.", time: "3h ago", type: "Agri Tip", read: false }
        ]);
        setUnreadCount(parsedAlerts.length > 0 ? parsedAlerts.length : 3);
      } catch (err) {
        console.error("Error fetching navbar notifications:", err);
        setNotifications([
          { id: 1, text: "⚠️ High humidity detected: Inspect crops for fungal spots.", time: "10m ago", type: "Weather Alert", read: false },
          { id: 2, text: "🌧️ Rainfall forecast for Karnataka region tomorrow.", time: "1h ago", type: "Forecast", read: false }
        ]);
        setUnreadCount(2);
      }
    };

    fetchNotifications();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return (
    <header className="navbar">
      <div className="navbarContainer">
        <div className="searchWrapper">
          <SearchOutlinedIcon className="searchIcon" />
          <input type="text" placeholder="Search crops, market rates, disease guides..." />
          <span className="searchShortcut">⌘K</span>
        </div>

        <div className="items">
          {/* Quick Weather Widget Pill */}
          <div className="weatherPill">
            <WbSunnyOutlinedIcon className="sunIcon" />
            <span className="weatherText">Karnataka • 28°C Optimal</span>
          </div>

          {/* Language Toggle Button */}
          <button className="langBtn" onClick={toggleLanguage} title="Change Language">
            <LanguageOutlinedIcon fontSize="small" />
            <span>{i18n.language === "en" ? "ಕನ್ನಡ" : "English"}</span>
          </button>

          {/* Notification Icon & Floating Dropdown */}
          <div className="notificationWrapper" ref={dropdownRef}>
            <div 
              className={`item notificationItem ${showNotifications ? "active" : ""}`} 
              onClick={() => setShowNotifications(!showNotifications)}
              title="Notifications"
            >
              {unreadCount > 0 ? (
                <NotificationsActiveOutlinedIcon className="icon bellActive" />
              ) : (
                <NotificationsNoneOutlinedIcon className="icon" />
              )}
              {unreadCount > 0 && <span className="counter">{unreadCount}</span>}
            </div>

            {/* Floating Dropdown Drawer */}
            {showNotifications && (
              <div className="notificationDropdown fade-in-up">
                <div className="dropdownHeader">
                  <div className="headerTitleGroup">
                    <h3>Notifications</h3>
                    {unreadCount > 0 && <span className="unreadBadge">{unreadCount} New</span>}
                  </div>
                  {unreadCount > 0 && (
                    <button className="markReadBtn" onClick={markAllAsRead}>
                      <DoneAllOutlinedIcon style={{ fontSize: 14 }} />
                      <span>Mark all as read</span>
                    </button>
                  )}
                </div>

                <div className="dropdownBody">
                  {notifications.length > 0 ? (
                    notifications.map((item) => (
                      <div key={item.id} className={`notificationCard ${item.read ? "read" : "unread"}`}>
                        <div className="cardTop">
                          <span className="typeBadge">{item.type}</span>
                          <span className="timeMeta">{item.time}</span>
                          <button 
                            className="dismissBtn" 
                            onClick={() => removeNotification(item.id)}
                            title="Dismiss"
                          >
                            <CloseOutlinedIcon style={{ fontSize: 13 }} />
                          </button>
                        </div>
                        <p className="cardText">{item.text}</p>
                      </div>
                    ))
                  ) : (
                    <div className="emptyStateMsg">
                      <p>🎉 All caught up! No active notifications.</p>
                    </div>
                  )}
                </div>

                <div className="dropdownFooter">
                  <Link to="/farmer_home" onClick={() => setShowNotifications(false)}>
                    View All Farming Alerts ↗
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <Link to="/profile" className="profileLink" title="User Profile">
            <div className="profileAvatar">
              <img src={profileImg} alt="Profile" />
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
