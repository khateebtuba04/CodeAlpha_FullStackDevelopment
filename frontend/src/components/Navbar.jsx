import { Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ShoppingBag, LogOut, Store } from 'lucide-react';

const CATEGORIES = ['Fruits', 'Vegetables', 'Dairy', 'Bakery', 'Meat', 'Snacks', 'Beverages', 'Pantry'];

const Navbar = () => {
    const { logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleCategory = (cat) => {
        navigate(`/?category=${cat}`);
    };

    const handleAll = () => {
        navigate('/');
    };

    return (
        <nav className="navbar">
            <div className="container" style={{ flexDirection: 'column', gap: '0' }}>
                {/* Top bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Store size={28} color="var(--accent-color)" />
                        <Link to="/" style={{ fontSize: '1.6rem', fontWeight: 800, textDecoration: 'none', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                            The Corner Pantry
                        </Link>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <Link
                            to="/cart"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--accent-color)', color: 'white', padding: '12px 20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(255, 107, 53, 0.3)', textDecoration: 'none', fontWeight: 700, fontSize: '1rem', transition: 'all 0.3s ease' }}
                        >
                            <ShoppingBag size={20} />
                            <span>Cart</span>
                        </Link>
                        <button
                            onClick={handleLogout}
                            title="Logout"
                            style={{ background: 'none', border: '2px solid var(--border-subtle)', borderRadius: '10px', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '10px', transition: 'all 0.2s ease' }}
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>

                {/* Category bar */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', width: '100%' }}>
                    <button
                        onClick={handleAll}
                        style={{ padding: '8px 16px', borderRadius: '20px', border: '2px solid var(--border-subtle)', background: 'var(--bg-color)', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
                        onMouseEnter={e => { e.target.style.borderColor = 'var(--accent-color)'; e.target.style.color = 'var(--accent-color)'; }}
                        onMouseLeave={e => { e.target.style.borderColor = 'var(--border-subtle)'; e.target.style.color = 'var(--text-primary)'; }}
                    >
                        All
                    </button>
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => handleCategory(cat)}
                            style={{ padding: '8px 16px', borderRadius: '20px', border: '2px solid var(--border-subtle)', background: 'var(--bg-color)', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
                            onMouseEnter={e => { e.target.style.borderColor = 'var(--accent-color)'; e.target.style.color = 'var(--accent-color)'; e.target.style.background = '#ffefe6'; }}
                            onMouseLeave={e => { e.target.style.borderColor = 'var(--border-subtle)'; e.target.style.color = 'var(--text-primary)'; e.target.style.background = 'var(--bg-color)'; }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
