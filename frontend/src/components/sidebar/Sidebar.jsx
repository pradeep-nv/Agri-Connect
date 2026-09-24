import React from "react";
import WeatherIcon from "@mui/icons-material/WbSunnyOutlined";
import FarmingIcon from "@mui/icons-material/AgricultureOutlined";
import TaskIcon from "@mui/icons-material/CalendarTodayOutlined";
import AppointmentIcon from "@mui/icons-material/PersonAddOutlined";
import RevenueIcon from "@mui/icons-material/AttachMoneyOutlined";
import CropIcon from "@mui/icons-material/LocalFloristOutlined";
import ProfileIcon from "@mui/icons-material/AccountCircleOutlined";
import LogoutIcon from "@mui/icons-material/ExitToAppOutlined";
import BugReportIcon from "@mui/icons-material/BugReportOutlined";
import TrendingUpIcon from "@mui/icons-material/TrendingUpOutlined";
import DashboardIcon from "@mui/icons-material/GridViewOutlined";
import SparklesIcon from "@mui/icons-material/AutoAwesomeOutlined";
import "./Sidebar.scss";
import { Link, useNavigate, useLocation } from "react-router-dom";
import logo from '../../assets/logo.png';
import newRequest from "../../utils/newRequest.js";

const Sidebar = ({ setUserRole }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await newRequest.post("/api/auth/signout");
      localStorage.removeItem("currentUser");
      if (setUserRole) setUserRole(null);
      navigate('/');
    } catch (err) {
      console.error("Error logging out", err);
    }
  };

  const navItems = [
    { path: "/farmer_home", label: "Dashboard", icon: <DashboardIcon className="icon" /> },
    { path: "/weather_report", label: "Weather Forecast", icon: <WeatherIcon className="icon" /> },
    { path: "/farming_recommendations", label: "Recommendations", icon: <FarmingIcon className="icon" /> },
    { path: "/task_scheduling", label: "Task Scheduling", icon: <TaskIcon className="icon" /> },
    { path: "/appointments", label: "Book Consultations", icon: <AppointmentIcon className="icon" /> },
    { path: "/revenue_record", label: "Revenue Recording", icon: <RevenueIcon className="icon" /> },
    { path: "/crop_details_management", label: "Crop Management", icon: <CropIcon className="icon" /> },
    { 
      path: "/disease_detection", 
      label: "AI Crop Doctor", 
      icon: <BugReportIcon className="icon" />,
      badge: "AI"
    },
    { path: "/market_prices", label: "Live Market Prices", icon: <TrendingUpIcon className="icon" /> },
  ];

  return (
    <aside className="sidebar">
      <div className="top">
        <Link to="/" className="brandLink">
          <div className="logoWrapper">
            <img src={logo} alt="AgriConnect Logo" className="logoImg" />
          </div>
          <div className="brandText">
            <span className="logoTitle">AgriConnect</span>
            <span className="logoTagline">Smart Agritech</span>
          </div>
        </Link>
      </div>

      <div className="sidebarMenu">
        <div className="menuSectionLabel">Core Modules</div>
        <nav className="card-container">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`navLink ${isActive ? "active" : ""}`}
              >
                <div className="card">
                  {item.icon}
                  <span className="navText">{item.label}</span>
                  {item.badge && (
                    <span className="aiBadge">
                      <SparklesIcon style={{ fontSize: 11 }} />
                      {item.badge}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="profile-actions">
          <div className="menuSectionLabel">Account & Preferences</div>
          <Link 
            to="/profile" 
            className={`navLink ${location.pathname === "/profile" ? "active" : ""}`}
          >
            <div className="action">
              <ProfileIcon className="icon" />
              <span>My Profile</span>
            </div>
          </Link>
          <div onClick={handleLogout} className="action logoutAction">
            <LogoutIcon className="icon" />
            <span>Sign Out</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
