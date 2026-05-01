import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);

    useEffect(() => {
        if (token) {
            try {
                // Decode token just to check if it's valid enough for now
                const decoded = JSON.parse(atob(token.split('.')[1]));
                // The API actually returns the user on login, so we might only have ID here when reloading
                // We fake a user object so it shows logged in.
                setUser({ id: decoded.id, name: "User" });
            } catch (e) {
                console.error("Invalid token");
                logout();
            }
        }
    }, [token]);

    const login = (newToken, userData) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
