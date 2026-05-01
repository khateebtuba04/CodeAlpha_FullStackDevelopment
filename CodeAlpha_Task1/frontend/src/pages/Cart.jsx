import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Trash2, ArrowRight, MapPin, CheckCircle, Plus, Minus, User } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const Cart = () => {
    const [cart, setCart] = useState([]);
    const [fullName, setFullName] = useState('');
    const [address, setAddress] = useState('');
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [errors, setErrors] = useState({});
    const [placedData, setPlacedData] = useState({ name: '', address: '', total: 0 });
    const { token } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (!token) { navigate('/login'); return; }
        fetchCart();
    }, [token]);

    const fetchCart = () => {
        fetch('http://localhost:5000/api/cart', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => setCart(data))
        .catch(console.error);
    };

    const remove = (cartId) => {
        fetch(`http://localhost:5000/api/cart/${cartId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(() => fetchCart())
        .catch(console.error);
    };

    const updateQty = (cartId, newQty) => {
        if (newQty < 1) { remove(cartId); return; }
        fetch(`http://localhost:5000/api/cart/${cartId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity: newQty })
        })
        .then(() => fetchCart())
        .catch(console.error);
    };

    const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

    const validate = () => {
        const e = {};
        if (!fullName.trim() || fullName.trim().length < 3) e.fullName = 'Please enter your full name (min 3 characters).';
        if (!address.trim() || address.trim().length < 10) e.address = 'Please enter a complete delivery address (min 10 characters).';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleCheckout = () => {
        if (!validate()) return;
        fetch('http://localhost:5000/api/orders', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: `${fullName}, ${address}`, total_amount: total })
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                setErrors({ form: data.error });
            } else {
                setPlacedData({ name: fullName, address, total });
                setOrderPlaced(true);
                setCart([]);
            }
        })
        .catch(() => setErrors({ form: 'Failed to place order. Please try again.' }));
    };

    if (orderPlaced) {
        return (
            <div style={{ maxWidth: '600px', margin: '80px auto', textAlign: 'center', background: 'var(--surface-color)', padding: '70px 50px', borderRadius: '24px', boxShadow: 'var(--shadow-md)' }}>
                <CheckCircle size={90} color="var(--accent-color)" style={{ margin: '0 auto 24px auto' }} />
                <h1 style={{ fontSize: '2.2rem', marginBottom: '16px' }}>Order Placed! 🎉</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '10px', fontSize: '1.1rem' }}>Your groceries are on their way to:</p>
                <p style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '20px', color: 'var(--text-primary)', background: '#ffefe6', padding: '12px 20px', borderRadius: '12px' }}>
                    {placedData.name} — {placedData.address}
                </p>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '36px' }}>
                    You will pay <strong>${placedData.total.toFixed(2)}</strong> via Cash on Delivery.
                </p>
                <Link to="/" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block', fontSize: '1.05rem' }}>Continue Shopping</Link>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1300px', margin: '30px auto', minHeight: '60vh', padding: '0 20px' }}>
            <h1 className="mb-4" style={{ fontSize: '2.2rem' }}>🛒 Your Cart</h1>

            {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 20px', background: 'var(--surface-color)', borderRadius: '20px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '5rem', marginBottom: '20px' }}>🛒</div>
                    <p style={{ fontSize: '1.3rem', color: 'var(--text-secondary)', marginBottom: '30px', fontWeight: 600 }}>Your cart is empty.</p>
                    <Link to="/" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>Browse Groceries</Link>
                </div>
            ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', alignItems: 'flex-start' }}>
                    {/* Cart Items */}
                    <div style={{ flex: '1 1 600px' }}>
                        <div style={{ background: 'var(--surface-color)', borderRadius: '20px', padding: '24px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-subtle)' }}>
                            {cart.map(item => (
                                <div key={item.id} style={{ display: 'flex', gap: '20px', borderBottom: '1px solid var(--border-subtle)', padding: '20px 0', alignItems: 'center' }}>
                                    <div style={{ width: '90px', height: '90px', borderRadius: '14px', overflow: 'hidden', background: '#f8fafc', flexShrink: 0 }}>
                                        <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>{item.name}</h3>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '12px' }}>${item.price.toFixed(2)} each</p>
                                        {/* Quantity Controls in Cart */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <button
                                                onClick={() => updateQty(item.id, item.quantity - 1)}
                                                style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid var(--border-subtle)', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--danger)', transition: 'all 0.2s' }}
                                            ><Minus size={14} /></button>
                                            <span style={{ fontWeight: 800, fontSize: '1.1rem', minWidth: '28px', textAlign: 'center' }}>{item.quantity}</span>
                                            <button
                                                onClick={() => updateQty(item.id, item.quantity + 1)}
                                                style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid var(--border-subtle)', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--accent-color)', transition: 'all 0.2s' }}
                                            ><Plus size={14} /></button>
                                            <button
                                                onClick={() => remove(item.id)}
                                                style={{ marginLeft: '10px', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', fontWeight: 600 }}
                                            ><Trash2 size={16} /> Remove</button>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '1.3rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
                                        ${(item.price * item.quantity).toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Order Summary & Checkout */}
                    <div style={{ flex: '1 1 360px', background: 'var(--surface-color)', padding: '30px', borderRadius: '20px', height: 'fit-content', position: 'sticky', top: '120px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-subtle)' }}>
                        <h2 style={{ fontSize: '1.4rem', marginBottom: '20px' }}>Delivery Details</h2>

                        <div style={{ marginBottom: '18px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '0.95rem', fontWeight: 600 }}>
                                <User size={16} /> Full Name
                            </label>
                            <input type="text" value={fullName} onChange={e => { setFullName(e.target.value); setErrors(p => ({ ...p, fullName: '' })); }} placeholder="Enter your full name" />
                            {errors.fullName && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '6px', fontWeight: 600 }}>{errors.fullName}</p>}
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '0.95rem', fontWeight: 600 }}>
                                <MapPin size={16} /> Complete Address
                            </label>
                            <textarea value={address} onChange={e => { setAddress(e.target.value); setErrors(p => ({ ...p, address: '' })); }} placeholder="House/Flat No., Street, City, Pincode..." rows="3" style={{ resize: 'vertical' }} />
                            {errors.address && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '6px', fontWeight: 600 }}>{errors.address}</p>}
                        </div>

                        <div style={{ borderTop: '2px solid var(--border-subtle)', paddingTop: '20px', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '1.3rem', marginBottom: '16px' }}>Order Summary</h2>
                            {cart.map(item => (
                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                                    <span>{item.name} × {item.quantity}</span>
                                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                                <span>Delivery</span>
                                <span style={{ color: 'var(--accent-color)', fontWeight: 700 }}>FREE</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', fontSize: '1.4rem', fontWeight: 800, borderTop: '2px solid var(--border-subtle)', paddingTop: '16px' }}>
                                <span>Total</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                        </div>

                        <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', padding: '12px 16px', borderRadius: '12px', marginBottom: '20px', color: '#166534', fontSize: '0.95rem', fontWeight: 700, textAlign: 'center' }}>
                            💵 Payment: Cash on Delivery (COD)
                        </div>

                        {errors.form && <p style={{ color: 'var(--danger)', fontSize: '0.9rem', marginBottom: '12px', fontWeight: 600, textAlign: 'center' }}>{errors.form}</p>}

                        <button onClick={handleCheckout} className="btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', padding: '18px', fontSize: '1.1rem', borderRadius: '14px' }}>
                            Place Order (COD) <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cart;
