import { useState, useEffect, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Clock, Truck, ShieldCheck } from 'lucide-react';

const Home = () => {
    const [products, setProducts] = useState([]);
    const [toast, setToast] = useState(null);
    const { token } = useContext(AuthContext);
    const [searchParams] = useSearchParams();
    const selectedCategory = searchParams.get('category');

    useEffect(() => {
        fetch('http://localhost:5000/api/products')
            .then(res => res.json())
            .then(data => setProducts(data))
            .catch(console.error);
    }, []);

    const filteredProducts = selectedCategory
        ? products.filter(p => p.category === selectedCategory)
        : products;

    const addToCart = (productId) => {
        if (!token) {
            showToast('Please sign in first', true);
            return;
        }
        fetch('http://localhost:5000/api/cart/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ product_id: productId, quantity: 1 })
        })
        .then(res => res.json())
        .then(() => showToast('1 item added to cart'))
        .catch(() => showToast('Error adding to cart', true));
    };

    const showToast = (msg, isError = false) => {
        setToast({ msg, isError });
        setTimeout(() => setToast(null), 3000);
    };

    return (
        <div>
            {/* HERO SECTION – only show when no category filter active */}
            {!selectedCategory && (
                <div className="hero-gradient" style={{
                    borderRadius: '30px',
                    padding: '80px 60px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '50px',
                    marginTop: '10px',
                    overflow: 'hidden',
                    position: 'relative',
                    minHeight: '380px'
                }}>
                    <div style={{ maxWidth: '580px', zIndex: 2 }}>
                        <h1 style={{ fontSize: '4rem', marginBottom: '20px', color: '#2d1c0a', lineHeight: 1.1 }}>
                            Fresh groceries,{' '}
                            <span style={{ color: 'var(--accent-color)' }}>delivered fast.</span>
                        </h1>
                        <p style={{ color: '#7e6651', fontSize: '1.25rem', marginBottom: '36px', fontWeight: 500 }}>
                            Welcome to The Corner Pantry — everyday essentials, fresh produce and delicious snacks delivered right to your door.
                        </p>
                        <button
                            className="btn-primary"
                            style={{ fontSize: '1.1rem', padding: '18px 40px', borderRadius: '16px' }}
                            onClick={() => document.getElementById('collection').scrollIntoView({ behavior: 'smooth' })}
                        >
                            Start Shopping
                        </button>
                    </div>
                    <div style={{ zIndex: 1, position: 'absolute', right: '-5%', top: '-20%', opacity: 0.88 }}>
                        <img
                            src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80"
                            alt="Groceries"
                            style={{ width: '560px', height: '560px', objectFit: 'cover', borderRadius: '50%', boxShadow: '0 20px 50px rgba(255,107,53,0.2)', border: '15px solid rgba(255,255,255,0.4)' }}
                        />
                    </div>
                </div>
            )}

            {/* PRODUCT GRID */}
            <div id="collection" style={{ paddingBottom: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h2 style={{ fontSize: '2.2rem', color: 'var(--text-primary)' }}>
                        {selectedCategory ? selectedCategory : 'Pantry Essentials'}
                        <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 500, marginLeft: '12px' }}>
                            ({filteredProducts.length} items)
                        </span>
                    </h2>
                </div>

                <div className="product-grid">
                    {filteredProducts.length > 0 ? filteredProducts.map((p, i) => (
                        <div key={p.id} className="product-card" style={{ animationDelay: `${(i % 15) * 0.05}s` }}>
                            <div className="img-container">
                                <img src={p.image} alt={p.name} className="product-img" />
                            </div>
                            <div className="product-info">
                                <span style={{ fontSize: '0.8rem', color: 'var(--accent-color)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', background: '#ffefe6', padding: '2px 8px', borderRadius: '20px', width: 'fit-content' }}>
                                    {p.category}
                                </span>
                                <h3 className="product-name" style={{ marginTop: '6px' }}>{p.name}</h3>
                                <span className="product-price">${p.price.toFixed(2)}</span>
                                <button className="add-btn" onClick={() => addToCart(p.id)} style={{ marginTop: '14px' }}>
                                    Add to Cart
                                </button>
                            </div>
                        </div>
                    )) : (
                        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', gridColumn: '1 / -1', minHeight: '200px', paddingTop: '60px', fontSize: '1.2rem', fontWeight: 600 }}>
                            {products.length === 0 ? 'Loading fresh groceries...' : `No items found in "${selectedCategory}".`}
                        </p>
                    )}
                </div>
            </div>

            {/* FEATURES */}
            {!selectedCategory && (
                <div style={{ display: 'flex', justifyContent: 'space-around', gap: '30px', flexWrap: 'wrap', marginTop: '80px', padding: '70px 40px', background: '#fff', borderRadius: '30px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-subtle)' }}>
                    {[
                        { icon: <Clock size={36} color="var(--accent-color)" />, title: 'Superfast Delivery', desc: 'Your order delivered to your doorstep in minutes.' },
                        { icon: <ShieldCheck size={36} color="var(--accent-color)" />, title: 'Best Quality', desc: 'We ensure the best quality products for you.' },
                        { icon: <Truck size={36} color="var(--accent-color)" />, title: 'Cash on Delivery', desc: 'Pay at your doorstep. Cash and UPI accepted.' }
                    ].map(f => (
                        <div key={f.title} style={{ textAlign: 'center', maxWidth: '280px' }}>
                            <div style={{ background: '#ffefe6', width: '72px', height: '72px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px auto' }}>
                                {f.icon}
                            </div>
                            <h3 style={{ fontSize: '1.3rem', marginBottom: '10px' }}>{f.title}</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>{f.desc}</p>
                        </div>
                    ))}
                </div>
            )}

            {toast && (
                <div className="toast" style={{ borderLeftColor: toast.isError ? 'var(--danger)' : 'var(--accent-color)' }}>
                    {toast.isError ? '⚠️' : '🛒'} {toast.msg}
                </div>
            )}

            <footer style={{ padding: '50px 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '40px', fontWeight: 500 }}>
                <p>&copy; 2026 The Corner Pantry. Your local grocery partner.</p>
            </footer>
        </div>
    );
};

export default Home;
