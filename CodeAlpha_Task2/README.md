# Wavely - Social Media Platform

Wavely is a modern, responsive social media platform built as part of the CodeAlpha Full-Stack Development Internship. It features a sleek Instagram-inspired UI with full-stack functionality.

## 🚀 Features

- **User Authentication**: Secure Login and Registration.
- **Personalized Feed**: View posts from users in a dynamic, scrollable feed.
- **Profile Management**: Dedicated profile pages showing user posts and stats.
- **Interactions**: Like and Comment on posts (Backend integrated).
- **Modern UI**: Dark mode aesthetic with glassmorphism and smooth animations.
- **Responsive Design**: Fully functional across desktop and mobile devices.

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (ES6+).
- **Backend**: Node.js, Express.js.
- **Database**: SQLite (managed via `better-sqlite3`).
- **Styling**: Premium custom CSS with Inter & Outfit typography.

## 📦 Project Structure

```text
├── backend/
│   ├── server.js        # Express server & API routes
│   ├── db.js            # Database connection & schema
│   ├── seed.js          # Mock data generator
│   └── social.db        # SQLite database file
├── frontend/
│   ├── index.html       # Login/Registration page
│   ├── feed.html        # Main social feed
│   ├── profile.html     # User profile page
│   ├── style.css        # Custom premium styling
│   └── app.js           # Frontend logic & API integration
└── README.md
```

## ⚙️ Setup Instructions

### 1. Backend Setup
Navigate to the `backend` folder and install dependencies:
```bash
cd backend
npm install
```
Seed the database with initial data:
```bash
node seed.js
```
Start the server:
```bash
node server.js
```
The server will run on `http://localhost:5000`.

### 2. Frontend Setup
Simply open `frontend/index.html` in your browser. Ensure the backend server is running for full functionality.

## 👤 Author
**Tuba Khateeb**
- GitHub: [@khateebtuba04](https://github.com/khateebtuba04)
