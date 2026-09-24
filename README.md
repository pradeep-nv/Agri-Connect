# 🌱 Agri-Connect

**Agri-Connect** is a modern, full-stack smart agricultural ecosystem that bridges the gap between farmers, agricultural experts, and real-time market insights. It provides intelligent crop recommendation, real-time weather forecasting, market crop pricing, plant disease detection, direct farmer-expert video consultations, and revenue management.

---

## 🌐 Live Demo & Repository

- **Live Application:** [agri-connect-fs64-nine.vercel.app](https://agri-connect-fs64-nine.vercel.app)
- **GitHub Repository:** [github.com/pradeep-nv/Agri-Connect](https://github.com/pradeep-nv/Agri-Connect)

---

## ✨ Key Features

- 🌾 **Farmer & Expert Portals:** Tailored dashboards for both farmers and agricultural specialists.
- 🩺 **Plant Disease Detection:** AI-driven crop disease diagnosis with actionable treatment recommendations.
- 📹 **Real-Time Video Consultations & Appointments:** Seamless WebRTC/Socket.io video calls between farmers and certified agronomists.
- 📈 **Market Price Insights:** Live tracking of crop market rates across regional mandis (Govt. of India Data integration).
- ⛅ **Real-Time Weather Forecasting:** Accurate hyper-local weather tracking and agricultural weather advisories.
- 📊 **Crop & Revenue Management:** Interactive revenue and yield tracking with data visualization charts.
- 💬 **Multilingual Support & Dark Mode:** Built with `i18next` for regional language accessibility and modern UX themes.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18 + Vite
- **Styling:** SCSS, Material UI (`@mui/material`), Glassmorphism UI
- **State & Routing:** React Router v6, React Context API
- **Charts & Progress:** Recharts, Chart.js, React Circular Progressbar
- **Real-time:** Socket.io-client
- **Localization:** i18next (English & Regional languages)

### Backend
- **Runtime:** Node.js & Express.js (ES Modules)
- **Database:** MongoDB Atlas with Mongoose ORM
- **Authentication:** JWT (JSON Web Tokens) & Cookie Parser
- **Real-time Engine:** Socket.io (Video calls, real-time chat, notifications)
- **Machine Learning / AI:** TensorFlow.js (`@tensorflow/tfjs`), Gemini API
- **Automation / Tasks:** Node-Cron for scheduled market data fetching

---

## 🏗️ Architecture & Project Structure

```text
Agri-Connect/
├── backend/
│   ├── controllers/      # Route controllers (Auth, Disease, Market, Weather, etc.)
│   ├── middleware/       # JWT and auth verification middleware
│   ├── models/           # Mongoose schemas (User, Crop, Appointment, Records, etc.)
│   ├── routes/           # RESTful API routes
│   ├── socket/           # Real-time WebSocket handlers
│   └── server.js         # Entry point & Express server configuration
│
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable UI components (Navbar, Sidebar, Charts, Widgets)
│   │   ├── pages/        # Application views (FarmerHome, ExpertHome, Disease, VideoCall)
│   │   ├── context/      # Theme and global state providers
│   │   ├── locales/      # Translation files (en, kn, etc.)
│   │   └── utils/        # Axios instances and socket connectors
│   └── vite.config.js    # Vite configuration
│
└── .gitignore            # Git exclusions for dependencies and sensitive env keys
```

---

## 🚀 Getting Started Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) or local MongoDB instance

### 1. Clone the Repository
```bash
git clone https://github.com/pradeep-nv/Agri-Connect.git
cd Agri-Connect
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend/` folder:
```env
PORT=8000
MONGO_URL=your_mongodb_connection_string
JWT_KEY=your_jwt_secret_key
FRONTEND_URL=http://localhost:5173
GEMINI_API_KEY=your_gemini_api_key
OPENWEATHER_API_KEY=your_openweather_api_key
NEWS_API_KEY=your_news_api_key
DATA_GOV_IN_API_KEY=your_data_gov_in_api_key
```
Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```
Create a `.env` file in the `frontend/` folder:
```env
VITE_API=http://localhost:8000
```
Start the frontend development server:
```bash
npm run dev
```

---

## ☁️ Deployment

- **Frontend:** Hosted on [Vercel](https://vercel.com) (Vite preset with environment variable `VITE_API`).
- **Backend:** Hosted on [Render](https://render.com) (Node Web Service with environment variable `FRONTEND_URL`).
- **Database:** Hosted on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).
