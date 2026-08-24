<div align="center">

<img src="https://img.shields.io/badge/FlowLink-Logistics%20Platform-00F0FF?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0yMCA4aC0zVjRINmMtMS4xIDAtMiAuOS0yIDJ2MTFIM2MtLjU1IDAtMSAuNDUtMSAxczEuNDUgMSAyIDFoMWMwIDEuNjYgMS4zNCAzIDMgM3MzLTEuMzQgMy0zaDB2LTFoNXYxYzAgMS42NiAxLjM0IDMgMyAzczMtMS4zNCAzLTNoMWMuNTUgMCAxLS40NSAxLTFWMTJsLTMtNHoiLz48L3N2Zz4=&logoColor=white" alt="FlowLink Badge" />

# 🚚 FlowLink — Intelligent Freight & Commuter Network

**A next-generation, full-stack logistics management platform for real-time freight dispatch, driver coordination, and parcel tracking across India.**

[![🌐 Live Website](https://img.shields.io/badge/🌐%20Live%20Website-flowlinkfleet.vercel.app-00F0FF?style=for-the-badge&labelColor=0A0F1C)](https://flowlinkfleet.vercel.app)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://flowlinkfleet.vercel.app)

🔗 **[https://flowlinkfleet.vercel.app](https://flowlinkfleet.vercel.app)**

</div>


---

## 📌 Project Description

**FlowLink** ek advanced logistics aur freight management system hai jo chhote aur bade businesses ke liye real-time parcel dispatch, driver tracking, aur city-level operations ko ek unified platform par manage karta hai.

**Problem jo solve karta hai:**
Traditional logistics platforms me parcel booking, driver assignment, aur real-time tracking alag-alag tools me hoti thi. FlowLink ne inhe ek single intelligent dashboard me merge kiya hai — jisme AI-powered dispatch, live map tracking, aur smart analytics sab kuch ek jagah milti hai.

---

## 🌟 Features

### 👤 Authentication & Roles
- Secure **JWT-based authentication** with bcrypt password hashing
- **Google OAuth 2.0** login support
- **Email OTP verification** at registration (via Nodemailer / Resend)
- Role-based access: `Admin`, `User (Customer)`, `Driver`
- Separate **Driver Portal** with dedicated login & dashboard

### 📦 Parcel Management
- Book new parcels with **pickup & drop address** (Google Places autocomplete)
- Real-time **parcel status tracking**: Pending → Assigned → In Transit → Delivered
- Admin can view, filter, assign, and manage **all parcels**
- Users can view **their own parcels** with live status updates
- Smart address input with **MapPicker** (drag-and-drop pin on map)

### 🚗 Driver Management
- Register & manage fleet drivers with vehicle info
- **Live GPS broadcast** — drivers share location every 5 seconds
- Driver availability status: `Available`, `On Delivery`, `Offline`
- Assign parcels to specific drivers with one click
- Driver OTP verification with **Firebase phone auth**

### 🗺️ Live Fleet Map Radar
- Interactive **Leaflet.js** map showing all active drivers in real-time
- Color-coded markers for driver status
- Click a driver to see their active assignment & route
- **Road-routing with OSRM** — actual road path, not straight line

### 📊 Admin Analytics Dashboard
- KPI cards: Total Parcels, Drivers, Assignments, Delivered
- **Parcel Status Donut Chart** (Chart.js)
- **Weekly Delivery Bar Chart** with real data
- Driver availability breakdown
- Operations Hub with pending/active assignment overview
- **Activity Timeline** of recent system events

### 🤖 AI Admin Bot (FlowLink AI)
- Powered by **Google Gemini AI**
- Answers questions about parcels, drivers, and operations
- Context-aware — knows about the current logged-in admin's data
- Smart dispatch suggestions and insights

### 🏙️ City Manager System
- Assign **City Operations Managers** to specific cities/hubs
- Manage corridor radius, zone, hub/facility name
- Full CRUD with inline edit & delete inside modal

### ⚙️ Smart Dispatch Rules
- Admin can set **automated dispatch policies**
- Rule-based driver matching: by zone, proximity, vehicle type
- **Smart Dispatch Matcher** — auto-suggests best driver for each parcel

### 🔔 Notifications
- Real-time **admin notification system**
- Bell icon with unread count in topbar
- Polling every 30 seconds for new notifications

### 🔍 Global Search
- Search **parcels & drivers** simultaneously from the topbar
- Filter by category: All / Parcels / Drivers
- Click result to jump directly to the relevant page

### 📱 Mobile Responsive
- Fully mobile-optimized layout with collapsible sidebar
- Mobile performance mode — GPU-heavy effects disabled on small screens
- Touch-friendly UI with smooth animations

### 🌙 Light / Dark Theme
- Toggle between **Dark (Glassmorphism)** and **Light (Claymorphism)** themes
- Theme persists across sessions via localStorage

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **Vite 8** | Build tool & dev server |
| **Tailwind CSS v4** | Utility-first styling |
| **HeroUI v3** | Component library (React Aria based) |
| **Framer Motion** | Smooth animations |
| **Leaflet.js + React Leaflet** | Interactive maps |
| **Chart.js + Recharts** | Analytics charts |
| **React Router DOM v7** | Client-side routing |
| **Axios** | HTTP requests |
| **React Toastify** | Toast notifications |
| **React Icons** | Icon set |
| **Google OAuth (@react-oauth/google)** | Google Sign-In |
| **Firebase** | Driver phone OTP auth |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express v5** | REST API server |
| **PostgreSQL** | Relational database |
| **bcrypt** | Password hashing |
| **jsonwebtoken (JWT)** | Auth tokens |
| **Google Gemini AI (@google/genai)** | AI Bot |
| **Nodemailer + Resend** | Email OTP & notifications |
| **google-auth-library** | Google OAuth verification |
| **CORS + dotenv** | Security & config |
| **nodemon** | Dev auto-restart |

### Deployment & Infrastructure
| Tool | Usage |
|---|---|
| **Vercel** | Frontend deployment |
| **Render / Railway** | Backend deployment |
| **Neon / Supabase** | PostgreSQL hosting |
| **GitHub** | Version control |

---

## 📁 Project Structure

```
MicroCommuteFreightNetwork/
├── frontend/                    # React + Vite frontend
│   ├── src/
│   │   ├── pages/               # All page components
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx    # Role-based dashboard router
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── DriverDashboard.jsx
│   │   │   ├── Parcels.jsx
│   │   │   ├── Tracking.jsx
│   │   │   ├── CityManagers.jsx
│   │   │   ├── Analytics.jsx
│   │   │   ├── Settings.jsx
│   │   │   └── ...
│   │   ├── components/          # Reusable components
│   │   │   ├── FleetMapRadar.jsx      # Live driver map
│   │   │   ├── AdminBot.jsx           # AI chatbot
│   │   │   ├── TopNavbar.jsx          # Global topbar
│   │   │   ├── DispatchPolicyManager.jsx
│   │   │   ├── SmartDispatchMatcher.jsx
│   │   │   └── ...
│   │   ├── context/             # React Context (Auth, Theme)
│   │   ├── services/            # Axios API service
│   │   ├── layout/              # MainLayout, Sidebar
│   │   └── styles/              # CSS modules & themes
│   └── vite.config.js
│
└── backend/                     # Node.js + Express API
    ├── controllers/             # Business logic
    ├── routes/                  # API route definitions
    ├── models/                  # Database query functions
    ├── middleware/              # Auth middleware (JWT)
    ├── services/                # External services (email, AI)
    ├── config/                  # DB connection pool
    └── server.js                # Express entry point
```

---

## 🚀 Local Setup

### Prerequisites
- Node.js v18+
- PostgreSQL (local or cloud like Neon/Supabase)
- A `.env` file with the required environment variables

### 1. Clone the repo
```bash
git clone https://github.com/ymayank623-cloud/micro-commute-freight.git
cd micro-commute-freight
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Fill in your values in .env
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
# Create frontend/.env
echo "VITE_API_URL=http://localhost:5000" > .env
npm run dev
```

### 4. Environment Variables

**Backend `.env`:**
```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GEMINI_API_KEY=your_gemini_api_key
RESEND_API_KEY=your_resend_api_key
FRONTEND_URL=http://localhost:5174
PORT=5000
```

**Frontend `.env`:**
```env
VITE_API_URL=http://localhost:5000
```

---

## 🔐 Default Roles

| Role | Access |
|---|---|
| `admin` | Full access — all pages, all data |
| `user` | Customer dashboard, book & track own parcels |
| `driver` | Driver hub — accept jobs, broadcast GPS location |

> Admin access is auto-granted to the email `ymayank623@gmail.com`.

---

## 📡 API Overview

| Route | Description |
|---|---|
| `POST /api/auth/login` | User login |
| `POST /api/auth/register` | User registration with OTP |
| `GET /api/parcels` | Get all parcels (admin) |
| `POST /api/parcels` | Create new parcel |
| `GET /api/drivers` | Get all drivers |
| `POST /api/assignments` | Assign driver to parcel |
| `GET /api/tracking/:id` | Get parcel tracking info |
| `GET /api/analytics/summary` | Dashboard analytics |
| `POST /api/bot/chat` | AI bot response (Gemini) |
| `GET /api/city-managers` | Get city managers |
| `GET /api/notifications/unread` | Get unread notification count |
| `GET /api/search?q=` | Global search for parcels & drivers |

---

## 🎨 UI Themes

| Theme | Style |
|---|---|
| 🌙 **Dark Mode** | Glassmorphism — Midnight aurora with neon cyan accents |
| ☀️ **Light Mode** | Claymorphism — Soft 3D clay cards with crisp shadows |

---

## 👨‍💻 Author

**Mayank Yadav**
- GitHub: [@ymayank623-cloud](https://github.com/ymayank623-cloud)
- Email: ymayank623@gmail.com

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---

<div align="center">

**Built with ❤️ for the future of Indian logistics**

🌐 Live at: **[flowlinkfleet.vercel.app](https://flowlinkfleet.vercel.app)**

⭐ Star this repo if you found it useful!

</div>

