const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth } = require('../middleware/auth');

// Get user cart
router.get('/', auth, (req, res) => {
    try {
        const cartItems = db.prepare(`
            SELECT c.id, c.quantity, p.id as product_id, p.name, p.price, p.image 
            FROM cart c 
            JOIN products p ON c.product_id = p.id 
            WHERE c.user_id = ?
        `).all(req.user.id);
        
        res.json(cartItems);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add to cart
router.post('/add', auth, (req, res) => {
    const { product_id, quantity } = req.body;
    
    if (!product_id) {
        return res.status(400).json({ msg: 'Product ID is required' });
    }

    try {
        const existing = db.prepare('SELECT * FROM cart WHERE user_id = ? AND product_id = ?').get(req.user.id, product_id);
        
        if (existing) {
            const update = db.prepare('UPDATE cart SET quantity = quantity + ? WHERE id = ?');
            update.run(quantity || 1, existing.id);
        } else {
            const insert = db.prepare('INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)');
            insert.run(req.user.id, product_id, quantity || 1);
        }
        
        res.json({ msg: 'Added to cart' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update cart item quantity
router.put('/:id', auth, (req, res) => {
    const { quantity } = req.body;
    try {
        const item = db.prepare('SELECT * FROM cart WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
        if (!item) return res.status(404).json({ msg: 'Item not found' });

        if (quantity <= 0) {
            db.prepare('DELETE FROM cart WHERE id = ?').run(req.params.id);
        } else {
            db.prepare('UPDATE cart SET quantity = ? WHERE id = ?').run(quantity, req.params.id);
        }
        res.json({ msg: 'Cart updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Remove from cart
router.delete('/:id', auth, (req, res) => {
    try {
        const item = db.prepare('SELECT * FROM cart WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
        if (!item) {
            return res.status(404).json({ msg: 'Item not found' });
        }

        const del = db.prepare('DELETE FROM cart WHERE id = ?');
        del.run(req.params.id);

        res.json({ msg: 'Item removed' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;