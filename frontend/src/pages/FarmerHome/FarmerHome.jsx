import React, { useState, useEffect } from "react";
import Navbar from "../../components/navbar/Navbar.jsx";
import Sidebar from "../../components/sidebar/Sidebar.jsx";
import Widget from "../../components/widget/Widget.jsx";
import "./FarmerHome.scss";
import RevenueChart from "../../components/chart/Chart.jsx";
import TaskCompletionChart from '../../components/taskCompletion/TaskCompletion.jsx';
import FarmingNews from "../../components/farmingNews/FarmingNews.jsx";
import GrowthProgressTracker from "../../components/growthProgressTracker/GrowthProgressTracker.jsx";
import WaterUsageGraph from "../../components/WaterUsageComponent/WaterUsageComponent.jsx";
import newRequest from "../../utils/newRequest.js";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

// Icons
import AgricultureOutlinedIcon from "@mui/icons-material/AgricultureOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import BugReportOutlinedIcon from "@mui/icons-material/BugReportOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";

const Home = ({ setUserRole }) => {
  const { t } = useTranslation();
  const [appointments, setAppointments] = useState([]);
  const [notifications, setNotifications] = useState({ alerts: "" });
  const [year, setYear] = useState(new Date().getFullYear());
  const [completedTasks, setCompletedTasks] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [crops, setCrops] = useState([]);
  const [blogPosts, setBlogPosts] = useState([]);
  const navigate = useNavigate();

  const handleReadMore = (postId) => {
    navigate(`/posts/${postId}`);
  };

  useEffect(() => {
    const fetchData = async () => {
      // Fetch notifications
      try {
        const notificationsResponse = await newRequest.get("/api/farming-notifications?region=Karnataka");
        setNotifications(notificationsResponse.data || { alerts: "" });
      } catch (error) {
        console.error("Error fetching notifications:", error);
        setNotifications({ alerts: "" });
      }

      // Fetch appointments
      try {
        const appointmentsResponse = await newRequest.get("/api/appointments/farmer");
        setAppointments(appointmentsResponse.data || []);
      } catch (error) {
        console.error("Error fetching appointments:", error);
        setAppointments([]);
      }

      // Fetch tasks
      try {
        const tasksResponse = await newRequest.get("/api/tasks");
        const tasksList = tasksResponse.data || [];
        const completed = tasksList.filter(task => task.isCompleted).length;
        setCompletedTasks(completed);
        setTotalTasks(tasksList.length);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }

      // Fetch crops
      try {
        const cropResponse = await newRequest.get("/api/crops");
        setCrops(cropResponse.data || []);
      } catch (error) {
        console.error("Error fetching crops data:", error);
        setCrops([]);
      }

      // Fetch blogs
      try {
        const blogResponse = await newRequest.get('/api/posts/getPost');
        setBlogPosts(blogResponse.data || []);
      } catch (err) {
        console.error("Error fetching blog posts", err);
        setBlogPosts([]);
      }
    };
    fetchData();
  }, []);

  const cleanMarkdown = (text) => {
    return text
      .replace(/(\*\*|__)(.*?)\1/g, "$2")
      .replace(/(\#\#)(.*?)$/g, "")
      .replace(/\n/g, "")
      .replace(/\*/g, "")
      .replace(/_/g, "");
  };

  const currentDateFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  return (
    <div className="home">
      <Sidebar setUserRole={setUserRole} />
      <div className="homeContainer">
        <Navbar />

        <div className="mainContent">
          {/* Welcome Banner */}
          <div className="welcomeHeader fade-in-up">
            <div className="headerText">
              <span className="dateSubtitle">{currentDateFormatted}</span>
              <h1 className="welcomeTitle">Welcome Back to AgriConnect 🌾</h1>
              <p className="welcomeDesc">
                Here is your farm telemetry overview, weather alerts, and expert agronomy recommendations for today.
              </p>
            </div>
            <div className="quickActions">
              <Link to="/disease_detection" className="actionBtn actionPrimary">
                <BugReportOutlinedIcon style={{ fontSize: 18 }} />
                <span>AI Disease Scan</span>
              </Link>
              <Link to="/appointments" className="actionBtn actionSecondary">
                <CalendarMonthOutlinedIcon style={{ fontSize: 18 }} />
                <span>Book Expert</span>
              </Link>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="metricsGrid fade-in-up">
            <div className="metricCard">
              <div className="metricIcon iconGreen">
                <AgricultureOutlinedIcon />
              </div>
              <div className="metricInfo">
                <span className="metricValue">{crops.length || "4"}</span>
                <span className="metricLabel">Active Crops Tracked</span>
              </div>
            </div>

            <div className="metricCard">
              <div className="metricIcon iconSage">
                <CheckCircleOutlinedIcon />
              </div>
              <div className="metricInfo">
                <span className="metricValue">{completedTasks}/{totalTasks || "6"}</span>
                <span className="metricLabel">Tasks Completed</span>
              </div>
            </div>

            <div className="metricCard">
              <div className="metricIcon iconAmber">
                <EventAvailableOutlinedIcon />
              </div>
              <div className="metricInfo">
                <span className="metricValue">
                  {appointments.filter(a => a.status === 'accepted' || a.status === 'pending').length}
                </span>
                <span className="metricLabel">Upcoming Sessions</span>
              </div>
            </div>

            <div className="metricCard">
              <div className="metricIcon iconCoral">
                <NotificationsActiveOutlinedIcon />
              </div>
              <div className="metricInfo">
                <span className="metricValue">Optimal</span>
                <span className="metricLabel">Microclimate Alert</span>
              </div>
            </div>
          </div>

          {/* Expert Insights Section */}
          <section className="widgetsSection fade-in-up">
            <div className="sectionHeader">
              <div className="titleGroup">
                <LightbulbOutlinedIcon className="headerIcon" />
                <h2>{t('farmer_home.expertsSay') || "Agronomist Advice & Insights"}</h2>
              </div>
              <span className="sectionSubtitle">Expert guidance tailored for your regional crops</span>
            </div>
            <div className="widgetsContainer">
              {blogPosts.length > 0 ? (
                blogPosts.map((post, index) => (
                  <Widget
                    key={post._id || index}
                    title={post.title}
                    excerpt={post.content ? post.content.substring(0, 90) + "..." : ""}
                    onReadMore={() => handleReadMore(post._id)}
                  />
                ))
              ) : (
                <div className="emptyState">
                  <p>{t('farmer_home.noBlogs') || "No expert blogs published yet."}</p>
                </div>
              )}
            </div>
          </section>

          {/* Notifications & Appointments Dual Cards */}
          <div className="notifications-appointments fade-in-up">
            <section className="infoPanel notificationsPanel">
              <div className="panelHeader">
                <NotificationsActiveOutlinedIcon className="panelIcon" />
                <h2>{t('farmer_home.notifications') || "Farming Alerts"}</h2>
              </div>
              <ul className="alertList">
                {notifications.alerts ? (
                  notifications.alerts
                    .split("\n")
                    .filter((alert) => alert.trim() !== "")
                    .map((alert, index) => (
                      <li key={index} className="alertItem">
                        <span className="alertDot"></span>
                        <span className="alertText">{cleanMarkdown(alert)}</span>
                      </li>
                    ))
                ) : (
                  <li className="alertItem emptyItem">
                    <span>{t('farmer_home.noNotifications') || "No urgent farming alerts today."}</span>
                  </li>
                )}
              </ul>
            </section>

            <section className="infoPanel appointmentsPanel">
              <div className="panelHeader">
                <EventAvailableOutlinedIcon className="panelIcon" />
                <h2>{t('farmer_home.upcomingAppointments') || "Expert Consultations"}</h2>
              </div>
              <ul className="appointmentList">
                {appointments.filter((app) => app.status === 'accepted' || app.status === 'pending').length > 0 ? (
                  appointments
                    .filter((app) => app.status === 'accepted' || app.status === 'pending')
                    .map((appointment) => (
                      <li key={appointment._id || appointment.id} className="appointmentItem">
                        <div className="appDate">
                          {new Date(appointment.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </div>
                        <div className="appDetails">
                          <span className="expertName">
                            {appointment.expertId?.name || appointment.expertName || "Agronomist Consult"}
                          </span>
                          <span className="appStatusBadge">
                            {appointment.status}
                          </span>
                        </div>
                      </li>
                    ))
                ) : (
                  <li className="appointmentItem emptyItem">
                    <span>No upcoming scheduled consultations.</span>
                  </li>
                )}
              </ul>
            </section>
          </div>

          {/* Revenue & Task Charts Section */}
          <div className="chartSection fade-in-up">
            <div className="chartCard revenue-chart">
              <div className="chartHeader">
                <h2>Revenue Analytics</h2>
                <input
                  type="number"
                  className="yearSelect"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder={t('farmer_home.enterYear')}
                  min="2000"
                  max="2100"
                />
              </div>
              <RevenueChart year={year} />
            </div>

            <div className="chartCard task-chart">
              <div className="chartHeader">
                <h2>Task Completion Ratio</h2>
              </div>
              <TaskCompletionChart completed={completedTasks} total={totalTasks} />
            </div>
          </div>

          {/* Crop Stats Telemetry */}
          <div className="crop-stats fade-in-up">
            <div className="telemetryCard">
              <GrowthProgressTracker />
            </div>

            {Array.isArray(crops) && crops.map((crop) => (
              <div className="telemetryCard" key={crop._id}>
                <WaterUsageGraph cropId={crop._id} cropName={crop.name} />
              </div>
            ))}
          </div>

          {/* Farming News */}
          <div className="newsSection fade-in-up">
            <FarmingNews />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
