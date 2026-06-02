import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { useNotificationsQuery, useUnreadNotificationsCountQuery, useMarkNotificationReadMutation } from '../features/notifications/hooks/useNotifications';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showNotifications, setShowNotifications] = useState(false);
    const dropdownRef = useRef(null);

    const { data: unreadCountData } = useUnreadNotificationsCountQuery();
    const { data: notificationData } = useNotificationsQuery({ page: 0, size: 5 });
    const markReadMutation = useMarkNotificationReadMutation();

    const unreadCount = unreadCountData?.unreadCount || 0;
    const notifications = notificationData?.content || [];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Close notifications dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = (id) => {
        markReadMutation.mutate(id);
    };

    return (
        <nav className="navbar" style={{ zIndex: 1000 }}>
            <Link to="/" className="logo">
                NeighbourLend
            </Link>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', position: 'relative' }}>
                {user ? (
                    <>
                        <Link to="/">Marketplace</Link>
                        <Link to="/dashboard">Dashboard</Link>
                        {user.roles && (user.roles.includes('ADMIN') || user.roles.includes('ROLE_ADMIN')) && (
                            <Link to="/admin" style={{ color: 'var(--accent-color)', fontWeight: '700' }}>Admin Panel</Link>
                        )}
                        
                        {/* Notification Bell */}
                        <div ref={dropdownRef} style={{ position: 'relative' }}>
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    fontSize: '1.35rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    position: 'relative',
                                    padding: '4px'
                                }}
                            >
                                🔔
                                {unreadCount > 0 && (
                                    <span
                                        style={{
                                            position: 'absolute',
                                            top: '-2px',
                                            right: '-2px',
                                            backgroundColor: '#ff385c',
                                            color: 'white',
                                            borderRadius: '50%',
                                            width: '16px',
                                            height: '16px',
                                            fontSize: '10px',
                                            fontWeight: '800',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Notifications Dropdown Panel */}
                            {showNotifications && (
                                <div
                                    className="glass-panel"
                                    style={{
                                        position: 'absolute',
                                        right: 0,
                                        top: '40px',
                                        width: '320px',
                                        borderRadius: '16px',
                                        boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                                        border: '1px solid var(--border-color)',
                                        backgroundColor: 'white',
                                        padding: '16px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '12px',
                                        animation: 'fadeIn 0.2s ease-out'
                                    }}
                                >
                                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: 'var(--secondary-color)' }}>
                                        Recent Notifications
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
                                        {notifications.length === 0 ? (
                                            <p style={{ margin: '8px 0', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                                                No notifications yet.
                                            </p>
                                        ) : (
                                            notifications.map((n) => (
                                                <div
                                                    key={n.id}
                                                    onClick={() => !n.readStatus && handleNotificationClick(n.id)}
                                                    style={{
                                                        padding: '10px 12px',
                                                        borderRadius: '8px',
                                                        border: '1px solid var(--border-color)',
                                                        backgroundColor: n.readStatus ? '#fafafa' : '#fff5f6',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ fontWeight: '700', fontSize: '0.8rem', color: n.readStatus ? 'var(--text-dark)' : 'var(--primary-color)' }}>
                                                            {n.title}
                                                        </span>
                                                        {!n.readStatus && (
                                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ff385c' }} />
                                                        )}
                                                    </div>
                                                    <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                        {n.message}
                                                    </p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <button onClick={handleLogout} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login" style={{ marginRight: '0.5rem' }}>Login</Link>
                        <Link to="/register" className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem', color: 'white' }}>
                            Register
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
