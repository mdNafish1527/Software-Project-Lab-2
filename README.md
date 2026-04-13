# 🎵 GaanBajna — Music Event Platform

> **Semester Final Project**  
> Developed by **Kazi Zarin Tasnim** & **Nafish Salehin**

---

## Tech Stack
| Layer | Technology |
|---|---|
| Database | MySQL |
| Backend | Node.js + Express.js |
| Frontend | React.js |
| Auth | JWT (JSON Web Tokens) |
| Email | Nodemailer (Gmail SMTP) |
| QR Codes | `qrcode` npm package |

---

## Project Structure

```
gaanbajna/
├── db/
│   └── schema.sql            ← All MySQL table definitions
├── backend/
│   ├── server.js             ← Express app entry point
│   ├── db.js                 ← MySQL connection pool
│   ├── .env.example          ← Copy to .env and fill in
│   ├── middleware/
│   │   └── auth.js           ← JWT auth + role guard middleware
│   ├── utils/
│   │   └── email.js          ← Email sending helpers (OTP, approval, etc.)
│   └── routes/
│       ├── auth.js           ← Register, login, OTP, password reset, admin invite
│       ├── users.js          ← Profile, singer browse, admin approval
│       ├── events.js         ← Concerts, bookings, custom URLs
│       ├── tickets.js        ← Buy tickets, QR scan, ticket history
│       ├── marketplace.js    ← Items, orders, recommendations
│       └── complaints.js     ← Submit & view complaints
└── frontend/
    ├── public/
    │   └── index.html
    └── src/
        ├── index.js
        ├── App.jsx           ← Routes & auth context wiring
        ├── api.js            ← Axios instance with JWT injection
        ├── context/
        │   └── AuthContext.jsx
        ├── styles/
        │   └── global.css    ← Full custom design system (dark gold theme)
        ├── components/
        │   ├── Navbar.jsx
        │   └── Footer.jsx    ← Includes developer credits section
        └── pages/
            ├── Home.jsx
            ├── Login.jsx
            ├── Register.jsx          ← 3-step: role → details → OTP
            ├── ForgotPassword.jsx
            ├── Concerts.jsx
            ├── ConcertDetail.jsx     ← Ticket purchasing + complaint
            ├── Singers.jsx
            ├── Marketplace.jsx       ← Cart, recommendations, checkout
            ├── AudienceDashboard.jsx
            ├── SingerDashboard.jsx
            ├── OrganizerDashboard.jsx ← Booking, event creation, QR scanner
            └── AdminDashboard.jsx     ← Approvals, users, complaints, invite
```

---

## Setup Instructions

### 1. Database

```bash
# Login to MySQL
mysql -u root -p

# Run the schema
source /path/to/gaanbajna/db/schema.sql
```

### 2. Backend

```bash
cd backend

# Install dependencies
npm install

# Create .env from example
cp .env.example .env
# → Edit .env: set DB password, email credentials, JWT secret

# Start dev server
npm run dev
# → Runs on http://localhost:5000
```

### 3. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start React app
npm start
# → Runs on http://localhost:3000
```

> The React app proxies `/api` requests to `localhost:5000` automatically.

---

## Adding Developer Photos

1. Put photos in `frontend/src/assets/zarin.jpg` and `frontend/src/assets/nafish.jpg`
2. Open `frontend/src/components/Footer.jsx`
3. Uncomment the import lines at the top
4. Replace the `<div className="dev-avatar-placeholder">` blocks with `<img>` tags as shown in the comments

---

## API Endpoints Summary

### Auth (`/api/auth`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/register` | Register new user |
| POST | `/verify-otp` | Verify email OTP |
| POST | `/resend-otp` | Resend OTP |
| POST | `/login` | Login (returns JWT) |
| POST | `/forgot-password` | Send reset OTP |
| POST | `/reset-password` | Reset password with OTP |
| POST | `/change-password` | Change password (auth required) |
| POST | `/invite-admin` | Invite admin via email (admin only) |
| POST | `/register-admin` | Register admin via invite token |

### Users (`/api/users`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/me` | Get own profile |
| PUT | `/me` | Update own profile |
| GET | `/singers` | Browse singer profiles |
| GET | `/singers/:id` | Singer profile + events |
| PUT | `/singer-profile` | Update singer profile (singer only) |
| GET | `/pending` | Pending accounts (admin only) |
| POST | `/:id/approve` | Approve account (admin only) |
| POST | `/:id/reject` | Reject account (admin only) |
| GET | `/all` | All users (admin only) |

### Events (`/api/events`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List live events |
| GET | `/:id` | Event details |
| POST | `/booking` | Book singer (organizer) |
| GET | `/bookings/mine` | My booking requests (singer) |
| PUT | `/booking/:id/respond` | Accept/reject booking (singer) |
| POST | `/booking/:id/pay` | Pay singer fee (organizer) |
| POST | `/` | Create concert (organizer) |
| POST | `/:id/launch` | Go live (organizer) |
| POST | `/:id/custom-url` | Request custom URL |
| POST | `/:id/approve-url` | Approve custom URL (admin) |

### Tickets (`/api/tickets`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/buy` | Buy tickets (audience) |
| GET | `/mine` | My tickets |
| POST | `/scan` | Scan QR code (organizer) |
| GET | `/event/:id` | Ticket stats for event |

### Marketplace (`/api/marketplace`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Browse items |
| GET | `/recommended` | Recommended items |
| GET | `/:id` | Item details |
| POST | `/` | Add item (singer/organizer) |
| PUT | `/:id` | Update item |
| DELETE | `/:id` | Remove item |
| POST | `/order` | Place order |
| GET | `/orders/mine` | My orders |

### Complaints (`/api/complaints`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Submit complaint |
| GET | `/` | All complaints (admin) |
| GET | `/mine` | My complaints |
| GET | `/event/:id` | Event complaints (organizer) |

---

## User Flows

### Audience
1. Register → verify OTP → login → browse concerts → buy tickets → get QR by email → attend event

### Singer
1. Register → verify OTP → wait for admin approval → login → update profile (fee, availability) → receive booking requests → accept/reject → add merchandise

### Organizer
1. Register → verify OTP → wait for admin approval → login → browse singers → send booking request → wait for acceptance → pay fee → create concert → set ticket tiers → launch event → scan QR codes at venue



---

## Features Implemented
-  Role-based registration (Audience / Singer / Organizer)
-  Email OTP verification with 5-minute expiry
-  Admin account via one-time invitation link
-  Pending status for Singer/Organizer until admin approves
-  JWT-based login (multi-device allowed)
-  Password reset via OTP
-  Password change (current password required)
-  Singer booking workflow (request → accept → pay → create event)
-  Concert creation with up to 3 ticket tiers
-  Dynamic pricing flag
-  Custom URL request with admin approval
-  Ticket purchase (max 10 per event) with QR code
-  QR code scanning + validation (valid / invalid / duplicate)
-  Complaint submission with evidence
-  Marketplace with browsing history-based recommendations
-  Shopping cart with shipping details
-  Role-specific dashboards
-  Developer credits in footer

---

*GaanBajna — Where Every Beat Tells a Story 🎵*
