import React, { useEffect, useState } from "react";
import Navbar from "../../components/navbar/Navbar.jsx";
import ExpertSidebar from "../../components/expertSidebar/ExpertSidebar.jsx"
import "./ExpertHome.scss";
import Performance from "../../components/PerformanceReport/PerformanceReport.jsx";
import BlogRecommendation from "../../components/blogRecommendation/BlogRecommendation.jsx";
import ExpertNavbar from "../../components/expertNavbar/ExpertNavbar.jsx";
import RenderAllPosts from "../../components/RenderAllBlogs/RenderAllBlogs.jsx";
import newRequest from "../../utils/newRequest.js";

const ExpertHome = ({ setUserRole }) => {
  const [notifications, setNotifications] = useState({ alerts: "" });
  const [appointments, setAppointments] = useState([]);

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
        const appointmentsResponse = await newRequest.get("/api/appointments/expert");
        setAppointments(appointmentsResponse.data || []);
      } catch (error) {
        console.error("Error fetching appointments:", error);
        setAppointments([]);
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


  return (
    <div className="home">
      <ExpertSidebar setUserRole={setUserRole} />
      <div className="homeContainer">
        <ExpertNavbar/>

        <div className="blog-recommendation">
          <BlogRecommendation/>
        </div>
        
        {/* Welcome message with animation */}
        <div className="welcomeMessage">
          <h1>Welcome!</h1>
        </div>

        <div className="notifications-appointments2">
          <section className="notifications2">
            <h2>Notifications</h2>
            <ul>
              {notifications.alerts ? (
                notifications.alerts
                  .split("\n")
                  .filter((alert) => alert.trim() !== "")
                  .map((alert, index) => (
                    <li key={index}>{cleanMarkdown(alert)}</li>
                  ))
              ) : (
                <li>No notifications available.</li>
              )}
            </ul>
          </section>

          <section className="appointments2">
            <h2>Upcoming Appointments</h2>
            <ul>
              {appointments.filter((app) => app.status === 'accepted' || app.status === 'pending').length > 0 ? (
                appointments
                  .filter((app) => app.status === 'accepted' || app.status === 'pending')
                  .map((appointment) => (
                    <li key={appointment._id}>
                      {new Date(appointment.date).toLocaleDateString()} - {appointment.farmerId?.name || "Farmer"}
                    </li>
                  ))
              ) : (
                <li>No appointments scheduled.</li>
              )}
            </ul>
          </section>
        </div>
        <div className="performance">
          <Performance/>
        </div>
        <div className="render-all-posts">
          <RenderAllPosts/>
        </div>
      </div>
    </div>
  );
};

export default ExpertHome;

