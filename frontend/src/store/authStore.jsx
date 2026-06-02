import { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const isTokenExpired = (token) => {
        try {
            const decoded = jwtDecode(token);
            const now = Date.now() / 1000;
            return decoded.exp < now;
        } catch (e) {
            return true;
        }
    };

    const loginUser = (token, refreshToken) => {
        localStorage.setItem('token', token);
        if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
        }
        const payload = jwtDecode(token);
        const userEmail = payload.sub;
        const roles = payload.roles || [];
        const userObj = { token, email: userEmail, roles };
        setUser(userObj);
        return userObj;
    };

    const logout = async () => {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
            try {
                await axiosClient.post('/auth/logout', { refreshToken });
            } catch (e) {
                console.error("Failed to revoke refresh token on logout", e);
            }
        }
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        setUser(null);
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            const refreshToken = localStorage.getItem('refreshToken');
            try {
                const payload = jwtDecode(token);
                const email = payload.sub;
                const roles = payload.roles || [];
                // Set user even if expired if we have a refresh token, so axios client can refresh on first query
                if (isTokenExpired(token) && !refreshToken) {
                    localStorage.removeItem('token');
                    setUser(null);
                } else {
                    setUser({ token, email, roles });
                }
            } catch (e) {
                console.error("Invalid token on load", e);
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                setUser(null);
            }
        }
        setLoading(false);
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, loginUser, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
