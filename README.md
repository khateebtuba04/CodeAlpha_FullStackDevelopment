# The Corner Pantry 🛒

A full-stack grocery delivery e-commerce application inspired by Blinkit and Swiggy Instamart.

## Tech Stack

- **Frontend:** React (Vite), React Router DOM, Lucide Icons
- **Backend:** Node.js, Express.js, Better-SQLite3
- **Database:** SQLite

## Features

- 🔐 JWT Authentication (Login / Register) with a protected app login wall
- 🛍️ 40+ grocery products across multiple categories
- 🔎 Filter products by category (Fruits, Vegetables, Dairy, Snacks, etc.)
- 🛒 Add to Cart with toast notification feedback
- ➕➖ Quantity controls in the cart
- 📦 Cash on Delivery checkout with address validation
- ✅ Order placement with confirmation screen
- 🎨 Vibrant, animated UI with staggered product card animations

## Getting Started

### 1. Backend

```bash
cd backend
npm install
node server.js
```

The backend server runs on `http://localhost:5000`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173`

## Project Structure

```
Code_alpha/
├── backend/
│   ├── middleware/     # JWT auth middleware
│   ├── routes/         # auth, products, cart, orders
│   ├── db.js           # SQLite schema + seed data
│   └── server.js       # Express app entry point
└── frontend/
    └── src/
        ├── components/ # Navbar
        ├── context/    # AuthContext
        └── pages/      # Home, Cart, Login, Register
```
