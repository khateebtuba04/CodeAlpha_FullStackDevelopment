const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth } = require('../middleware/auth');

// Place an order (Cash on Delivery)
router.post('/', auth, (req, res) => {
    const { address, total_amount } = req.body;
    const userId = req.user.id;

    if (!address) {
        return res.status(400).json({ error: 'Delivery address is required' });
    }

    try {
        const insertOrder = db.prepare('INSERT INTO orders (user_id, address, total_amount, payment_method) VALUES (?, ?, ?, ?)');
        const result = insertOrder.run(userId, address, total_amount, 'Cash on Delivery');

        const clearCart = db.prepare('DELETE FROM cart WHERE user_id = ?');
        clearCart.run(userId);

        res.json({ message: 'Order placed successfully', orderId: result.lastInsertRowid });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to place order' });
    }
});

module.exports = router;
