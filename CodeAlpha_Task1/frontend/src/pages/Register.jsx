import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API_URL from '../api';
import { useNavigate, Link } from 'react-router-dom';
import { Store } from 'lucide-react';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.msg || data.error);
            
            login(data.token, data.user);
            navigate('/');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <Store size={40} color="var(--accent-color)" />
                <h1 style={{ fontSize: '2.5rem', color: 'var(--text-primary)' }}>The Corner Pantry</h1>
            </div>
            <div className="auth-form" style={{ marginTop: 0, width: '100%' }}>
                <h2 className="text-center mb-4">Create Account</h2>
                {error && <div style={{ color: 'var(--danger)', marginBottom: '15px', textAlign: 'center', fontWeight: 600 }}>{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Full Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>Email Address</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                    <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '10px', fontSize: '1.1rem' }}>Register</button>
                </form>
                <p className="text-center mt-4" style={{ color: 'var(--text-secondary)' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--accent-color)', fontWeight: 700 }}>Login securely</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
