# Sports Scheduler 🏆

> **Plan. Play. Connect.** — A full-stack web application designed for organizing sports sessions, managing participants, tracking sports popularity, and analyzing community engagement.

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-v5.0-blue.svg)](https://expressjs.com/)
[![Sequelize](https://img.shields.io/badge/Sequelize-ORM-3b82f6.svg)](https://sequelize.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-ISC-purple.svg)](LICENSE)

---

## 📌 Project Overview

**Sports Scheduler** is a web platform built for sports communities, club organizers, and players. It solves the challenge of organizing casual and competitive sports games by enabling administrators and players to host sessions, track headcounts, set required player limits, prevent double-bookings, and analyze participation metrics over custom reporting periods.

---

## ✨ Key Features

### 👑 Admin Capabilities
- **Sport Management**: Create, edit, and categorize custom sports (e.g., Football, Cricket, Badminton).
- **Session Control**: Schedule new games, view registered player rosters, and cancel sessions with mandatory cancellation reasons.
- **Analytics & Reporting (Vertical Slice 4)**: Filter community analytics across custom start/end date ranges. Monitor total sessions played, relative popularity of sports, and completion rates.
- **Player & Host Dual-Role**: Admins can participate in or host sports sessions just like regular players.

### ⚽ Player Capabilities
- **Session Discovery & Filtering**: Search available games by specific sport and status (`scheduled`, `cancelled`, `all`) with server-side pagination.
- **Session Joining**: Reserve spots in available sessions with automatic enforcement of capacity constraints.
- **My Schedule & History**: Separate views for sessions joined vs. sessions created.
- **Cancellation Transparency**: Clear visual badges (`Cancelled`) and warning boxes detailing reasons provided by hosts or administrators.

### 🛡️ Security, Validation & High-Value Enhancements
- **Password Security**: Authenticated user profile page with current password verification and bcrypt hashing.
- **Conflict Prevention**: Server-side validation blocking users from enrolling in overlapping sessions at the exact same date and time.
- **Session Validation**: Enforces full-session checks, past-session restrictions, and duplicate join prevention.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Backend Framework** | Node.js, Express.js (v5) |
| **Database & ORM** | PostgreSQL, Sequelize ORM |
| **Authentication** | Passport.js (Local Strategy), Express-Session, Bcrypt |
| **View Engine** | EJS (Embedded JavaScript), HTML5 |
| **Styling** | Vanilla CSS3 (Custom Design System with CSS Variables) |
| **Flash Messaging** | Connect-Flash |

---

## 📁 Repository Structure

```
sports-scheduler/
├── config/             # Sequelize database & Passport configuration
│   ├── auth/           # Passport authentication setup
│   └── config.js       # PostgreSQL environment config (SSL enabled for production)
├── middleware/         # Custom authentication & role authorization guards
├── migrations/         # Database schema migrations
├── models/             # Sequelize models (User, Sport, Session, SessionParticipant)
├── public/
│   └── css/            # Global stylesheets & design system tokens
├── routes/             # Express routes (auth, admin, player)
├── views/              # EJS layout templates
│   ├── admin/          # Admin dashboard & analytics views
│   ├── player/         # Player dashboard & session detail views
│   └── profile.ejs     # User profile & security settings
├── index.js            # Main application entry point
└── package.json        # Dependencies & scripts
```

---

## 🚀 Local Setup & Installation

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database server running locally or remotely

### Step-by-Step Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/NagatejaThippanaboina/sports-scheduler.git
   cd sports-scheduler
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=your_postgres_password
   POSTGRES_HOST=localhost
   DATABASE_NAME=sports_scheduler_dev
   SESSION_SECRET=your_super_secret_session_key
   NODE_ENV=development
   ```

4. **Run Database Migrations**
   ```bash
   npx sequelize-cli db:migrate
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   # or
   node index.js
   ```
   Open your browser and navigate to `http://localhost:3000`.

---

## ☁️ Production Deployment (Render)

This application is ready for 1-click deployment on Render with Render PostgreSQL:

1. Connect your GitHub repository (`NagatejaThippanaboina/sports-scheduler`) to Render Web Services.
2. Add a Render PostgreSQL instance.
3. Configure the Web Service environment variables:
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: `<Render PostgreSQL Internal Connection String>`
   - `SESSION_SECRET`: `<Generated Secret Key>`
4. Build Command: `npm install`
5. Start Command: `node index.js`

---

## 📷 Application Screenshots

*(Screenshots of Admin Dashboard, Player Dashboard, Reports, and Profile Security available in docs)*

---

## 📄 License

Distributed under the ISC License. See `LICENSE` for details.
