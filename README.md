# Anonymous Police Violence Reporting – Germany
### Full-Stack: React + Node.js + MongoDB

---

## Project Structure

```
police-report-fullstack/
├── package.json              ← Root scripts
├── README.md
│
├── backend/
│   ├── server.js             ← Express API (Node.js)
│   ├── package.json
│   └── .env.example          ← Copy to .env
│
└── frontend/
    ├── package.json
    ├── public/
    │   └── index.html
    └── src/
        ├── App.jsx            ← Root – routes between form and stats
        ├── index.js
        ├── index.css          ← Global CSS variables
        ├── components/
        │   ├── Navbar.jsx / .css
        │   ├── Chip.jsx / .css
        │   ├── Field.jsx / .css
        │   ├── SectionCard.jsx / .css
        │   └── ProgressBar.jsx / .css
        ├── pages/
        │   ├── ReportForm.jsx / .css   ← 6-section form
        │   └── StatsPage.jsx / .css    ← 7-chart dashboard
        └── utils/
            └── api.js                  ← Axios API calls
```

---

## Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local) OR MongoDB Atlas account

### Step 1 – Backend

```bash
cd backend
cp .env.example .env
# Edit .env: set MONGO_URI to your MongoDB connection string
npm install
npm run dev     # dev with auto-reload (uses nodemon)
# OR
npm start       # production
```
Backend runs at: **http://localhost:4000**

### Step 2 – Frontend (separate terminal)

```bash
cd frontend
npm install
npm start
```
Frontend runs at: **http://localhost:3000**

---

## Environment Variables (backend/.env)

| Variable       | Default                                       | Description                   |
|---------------|-----------------------------------------------|-------------------------------|
| `MONGO_URI`    | `mongodb://localhost:27017/police_reports`    | MongoDB connection string      |
| `PORT`         | `4000`                                        | Backend server port            |
| `FRONTEND_URL` | `http://localhost:3000`                       | Allowed CORS origin            |

---

## API Endpoints

| Method | Route         | Description                              |
|--------|---------------|------------------------------------------|
| POST   | /api/report   | Submit anonymous report                  |
| GET    | /api/stats    | Aggregated statistics (no PII ever)      |
| GET    | /api/health   | MongoDB + server health check            |

### Sample POST /api/report payload
```json
{
  "state": "Bavaria",
  "cityRegion": "Munich north",
  "incidentMonth": "2024-11",
  "timeOfDay": "Evening",
  "violenceTypes": ["Physical force", "Verbal abuse"],
  "motivePresent": "Yes",
  "motiveTypes": ["Religious"],
  "religiousDetails": ["Clothing / symbols"],
  "gender": "Male",
  "ageGroup": "26–40",
  "context": "Stop / control",
  "officerCount": "2–3",
  "description": "Brief factual description..."
}
```

---

## Production Deployment

### Frontend (Netlify / Vercel)
```bash
cd frontend
npm run build
# Deploy the 'build' folder to Netlify or Vercel
# Set REACT_APP_API_URL env variable to your backend URL
```

### Backend (Railway / Render / VPS)
```bash
cd backend
# Set environment variables on your platform:
#   MONGO_URI  → MongoDB Atlas connection string
#   PORT       → 4000 (or auto-assigned)
#   FRONTEND_URL → your production frontend URL
npm start
```

### MongoDB Atlas (Cloud DB – Free Tier)
1. Go to https://cloud.mongodb.com
2. Create a free M0 cluster
3. Get connection string → paste in .env as MONGO_URI
4. Whitelist your server IP in Network Access

---

## Privacy Architecture

| What | Detail |
|------|--------|
| No IP stored | User identity cannot be traced |
| No cookies | Zero tracking |
| Aggregated-only stats API | Individual records never exposed |
| Auto free-text filter | Names → [name], badge IDs → [id] |
| Rate limiting | 20 submissions/hour/IP (anti-spam) |
| CORS restricted | Only your frontend domain allowed |
| Helmet.js | HTTP security headers |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Chart.js, react-chartjs-2, Axios |
| Styling | Pure CSS with CSS variables (no framework) |
| Backend | Node.js, Express.js |
| Database | MongoDB via Mongoose ODM |
| Security | Helmet.js, express-rate-limit, CORS |
