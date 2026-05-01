const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'ecommerce.db'));

db.exec(`
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  price REAL,
  image TEXT,
  category TEXT
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT UNIQUE,
  password TEXT
);

CREATE TABLE IF NOT EXISTS cart (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  product_id INTEGER,
  quantity INTEGER
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  address TEXT,
  total_amount REAL,
  payment_method TEXT,
  status TEXT DEFAULT 'Pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

const count = db.prepare('SELECT COUNT(*) as count FROM products').get();

if (count.count === 0) {
  const insert = db.prepare('INSERT INTO products (name, price, image, category) VALUES (?, ?, ?, ?)');

  const products = [
    // ─── Fruits ───────────────────────────────────────────────────────────
    {
      name: 'Fresh Apples (1kg)', price: 4.50,
      img: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?auto=format&fit=crop&w=500&q=80',
      cat: 'Fruits'
    },
    {
      name: 'Organic Bananas (1kg)', price: 2.50,
      img: 'https://images.unsplash.com/photo-1481349518771-20055b2a7b24?auto=format&fit=crop&w=500&q=80',
      cat: 'Fruits'
    },
    {
      name: 'Juicy Oranges (1kg)', price: 3.80,
      img: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=500&q=80',
      cat: 'Fruits'
    },
    {
      name: 'Fresh Strawberries (500g)', price: 5.00,
      img: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=500&q=80',
      cat: 'Fruits'
    },
    {
      name: 'Green Grapes (500g)', price: 4.20,
      img: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&w=500&q=80',
      cat: 'Fruits'
    },
    {
      name: 'Watermelon (1 pc)', price: 6.00,
      img: 'https://images.unsplash.com/photo-1589984662646-e7b2e4962f18?auto=format&fit=crop&w=500&q=80',
      cat: 'Fruits'
    },
    {
      name: 'Pineapple (1 pc)', price: 4.00,
      img: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=500&q=80',
      cat: 'Fruits'
    },

    // ─── Vegetables ───────────────────────────────────────────────────────
    {
      name: 'Potatoes (2kg)', price: 3.00,
      img: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=500&q=80',
      cat: 'Vegetables'
    },
    {
      name: 'Tomatoes (1kg)', price: 2.80,
      img: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=500&q=80',
      cat: 'Vegetables'
    },
    {
      name: 'Red Onions (1kg)', price: 2.00,
      img: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=500&q=80',
      cat: 'Vegetables'
    },
    {
      name: 'Fresh Carrots (1kg)', price: 1.80,
      img: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=500&q=80',
      cat: 'Vegetables'
    },
    {
      name: 'Broccoli (500g)', price: 2.50,
      img: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=500&q=80',
      cat: 'Vegetables'
    },
    {
      name: 'Spinach Bunch', price: 1.50,
      img: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=500&q=80',
      cat: 'Vegetables'
    },
    {
      name: 'Bell Peppers (3 pcs)', price: 3.50,
      img: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=500&q=80',
      cat: 'Vegetables'
    },

    // ─── Dairy ────────────────────────────────────────────────────────────
    {
      name: 'Whole Milk (1L)', price: 1.20,
      img: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=500&q=80',
      cat: 'Dairy'
    },
    {
      name: 'Farm Fresh Eggs (12 pcs)', price: 3.50,
      img: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=500&q=80',
      cat: 'Dairy'
    },
    {
      name: 'Cheddar Cheese (200g)', price: 4.00,
      img: 'https://images.unsplash.com/photo-1618164436241-4473940d1f5c?auto=format&fit=crop&w=500&q=80',
      cat: 'Dairy'
    },
    {
      name: 'Salted Butter (250g)', price: 3.20,
      img: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=500&q=80',
      cat: 'Dairy'
    },
    {
      name: 'Greek Yogurt (500g)', price: 3.80,
      img: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=500&q=80',
      cat: 'Dairy'
    },

    // ─── Bakery ───────────────────────────────────────────────────────────
    {
      name: 'Whole Wheat Bread', price: 2.00,
      img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=80',
      cat: 'Bakery'
    },


    // ─── Meat ─────────────────────────────────────────────────────────────
    {
      name: 'Chicken Breast (500g)', price: 6.50,
      img: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=500&q=80',
      cat: 'Meat'
    },
    {
      name: 'Ground Beef (500g)', price: 7.00,
      img: 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?auto=format&fit=crop&w=500&q=80',
      cat: 'Meat'
    },
    {
      name: 'Fresh Salmon Filet (300g)', price: 9.50,
      img: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=500&q=80',
      cat: 'Meat'
    },
    {
      name: 'Bacon Strips (250g)', price: 5.50,
      img: 'https://images.unsplash.com/photo-1528607929212-2636ec44253e?auto=format&fit=crop&w=500&q=80',
      cat: 'Meat'
    },
    {
      name: 'Tofu Extra Firm (400g)', price: 2.80,
      img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80',
      cat: 'Protein'
    },

    // ─── Beverages ────────────────────────────────────────────────────────
    {
      name: 'Coca Cola (1.5L)', price: 1.80,
      img: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=500&q=80',
      cat: 'Beverages'
    },
    {
      name: 'Orange Juice (1L)', price: 3.50,
      img: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=500&q=80',
      cat: 'Beverages'
    },
    {
      name: 'Mineral Water (6x1L)', price: 4.00,
      img: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=500&q=80',
      cat: 'Beverages'
    },
    {
      name: 'Coffee Beans (250g)', price: 8.50,
      img: 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?auto=format&fit=crop&w=500&q=80',
      cat: 'Beverages'
    },
    {
      name: 'Green Tea Bags (50 pcs)', price: 4.20,
      img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=500&q=80',
      cat: 'Beverages'
    },

    // ─── Snacks ───────────────────────────────────────────────────────────
    {
      name: 'Lays Classic Chips', price: 1.50,
      img: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=500&q=80',
      cat: 'Snacks'
    },
    {
      name: 'Doritos Nacho Cheese', price: 1.80,
      img: 'https://images.unsplash.com/photo-1621447504864-d8686e12698c?auto=format&fit=crop&w=500&q=80',
      cat: 'Snacks'
    },
    {
      name: 'Mixed Nuts (200g)', price: 5.00,
      img: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=500&q=80',
      cat: 'Snacks'
    },
    {
      name: 'Dark Chocolate Bar', price: 2.50,
      img: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=500&q=80',
      cat: 'Snacks'
    },


    // ─── Pantry ───────────────────────────────────────────────────────────
    {
      name: 'Olive Oil (500ml)', price: 6.80,
      img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=500&q=80',
      cat: 'Pantry'
    },
    {
      name: 'Basmati Rice (1kg)', price: 3.50,
      img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=500&q=80',
      cat: 'Pantry'
    },

    {
      name: 'All Purpose Flour (1kg)', price: 1.80,
      img: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=500&q=80',
      cat: 'Pantry'
    }
  ];

  for (const p of products) {
    insert.run(p.name, p.price, p.img, p.cat);
  }
}

module.exports = db;