const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all products
router.get('/', (req, res) => {
    try {
        const { search, category } = req.query;
        let query = 'SELECT * FROM products WHERE 1=1';
        const params = [];

        if (search) {
            query += ' AND (name LIKE ?)';
            params.push(`%${search}%`);
        }

        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }

        const products = db.prepare(query).all(...params);
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
