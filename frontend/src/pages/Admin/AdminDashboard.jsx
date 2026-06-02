import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import axiosClient from '../../api/axiosClient';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [analytics, setAnalytics] = useState(null);
    const [users, setUsers] = useState([]);
    const [listings, setListings] = useState([]);
    const [bookings, setBookings] = useState([]);

    const [userPage, setUserPage] = useState(0);
    const [userTotalPages, setUserTotalPages] = useState(1);
    
    const [listingPage, setListingPage] = useState(0);
    const [listingTotalPages, setListingTotalPages] = useState(1);

    const [bookingPage, setBookingPage] = useState(0);
    const [bookingTotalPages, setBookingTotalPages] = useState(1);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch stats
    const fetchAnalytics = async () => {
        try {
            const res = await axiosClient.get('/admin/analytics');
            setAnalytics(res.data);
        } catch (err) {
            console.error("Failed to load analytics", err);
            setError("Failed to load platform analytics.");
        }
    };

    // Fetch users (paginated)
    const fetchUsers = async (page = 0) => {
        setLoading(true);
        try {
            const res = await axiosClient.get(`/admin/users?page=${page}&size=8`);
            setUsers(res.data.content);
            setUserTotalPages(res.data.totalPages);
            setUserPage(res.data.page);
        } catch (err) {
            console.error("Failed to load users", err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch listings (paginated)
    const fetchListings = async (page = 0) => {
        setLoading(true);
        try {
            const res = await axiosClient.get(`/admin/items?page=${page}&size=8`);
            setListings(res.data.content);
            setListingTotalPages(res.data.totalPages);
            setListingPage(res.data.page);
        } catch (err) {
            console.error("Failed to load listings", err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch bookings (paginated)
    const fetchBookings = async (page = 0) => {
        setLoading(true);
        try {
            const res = await axiosClient.get(`/admin/bookings?page=${page}&size=8`);
            setBookings(res.data.content);
            setBookingTotalPages(res.data.totalPages);
            setBookingPage(res.data.page);
        } catch (err) {
            console.error("Failed to load bookings", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    useEffect(() => {
        if (activeTab === 'users') fetchUsers(0);
        if (activeTab === 'listings') fetchListings(0);
        if (activeTab === 'bookings') fetchBookings(0);
    }, [activeTab]);

    const handleRoleChange = async (userId, currentRoles, roleToToggle) => {
        let newRoles = [...currentRoles];
        if (newRoles.includes(roleToToggle)) {
            newRoles = newRoles.filter(r => r !== roleToToggle);
        } else {
            newRoles.push(roleToToggle);
        }
        
        try {
            await axiosClient.put(`/admin/users/${userId}/role`, { roles: newRoles });
            fetchUsers(userPage);
        } catch (err) {
            alert("Failed to update user role");
        }
    };

    const handleUserStatusToggle = async (userId) => {
        try {
            await axiosClient.put(`/admin/users/${userId}/status`);
            fetchUsers(userPage);
        } catch (err) {
            alert("Failed to toggle user status");
        }
    };

    const handleListingModerate = async (itemId) => {
        try {
            await axiosClient.put(`/admin/items/${itemId}/moderate`);
            fetchListings(listingPage);
        } catch (err) {
            alert("Failed to moderate listing");
        }
    };

    const handleBookingCancel = async (bookingId) => {
        if (!confirm("Are you sure you want to force-cancel this booking?")) return;
        try {
            await axiosClient.put(`/admin/bookings/${bookingId}/force-cancel`);
            fetchBookings(bookingPage);
            fetchAnalytics(); // Refresh revenue overview
        } catch (err) {
            alert("Failed to cancel booking");
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-light)', display: 'flex', flexDirection: 'column' }}>
            <Navbar />
            
            <div style={{ flex: 1, padding: '40px 24px', maxWidth: '1280px', width: '100%', margin: '0 auto', fontFamily: 'Outfit, sans-serif' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontSize: '2.2rem', color: 'var(--secondary-color)', fontWeight: '800' }}>Admin Control Center</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '4px' }}>Platform analytics, moderation controls, and configuration overrides.</p>
                    </div>
                    <span style={{ padding: '8px 16px', borderRadius: '30px', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-color)', fontWeight: '700', fontSize: '0.85rem' }}>
                        🛡️ System Admin Mode
                    </span>
                </div>

                {error && (
                    <div className="glass-panel" style={{ padding: '16px', color: 'var(--primary-color)', backgroundColor: 'rgba(255, 56, 92, 0.05)', borderRadius: '16px', marginBottom: '24px', fontWeight: '600' }}>
                        ⚠️ {error}
                    </div>
                )}

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                    {['overview', 'users', 'listings', 'bookings'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '12px',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.95rem',
                                fontWeight: '600',
                                textTransform: 'capitalize',
                                transition: 'all 0.2s ease',
                                backgroundColor: activeTab === tab ? 'var(--secondary-color)' : 'transparent',
                                color: activeTab === tab ? 'white' : 'var(--text-muted)'
                            }}
                        >
                            {tab === 'overview' ? '📊 Analytics' : tab === 'users' ? '👥 Users' : tab === 'listings' ? '📦 Listings' : '📅 Bookings'}
                        </button>
                    ))}
                </div>

                {/* Tab Contents */}
                {activeTab === 'overview' && analytics && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', animation: 'fadeIn 0.25s ease-out' }}>
                        {/* Summary Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                            <div className="glass-panel" style={{ padding: '24px', borderRadius: '24px', backgroundColor: 'white', border: '1px solid var(--border-color)' }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>TOTAL PLATFORM USERS</div>
                                <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--secondary-color)', marginTop: '8px' }}>{analytics.totalUsers}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--accent-color)', marginTop: '8px', fontWeight: '600' }}>Active Members</div>
                            </div>
                            <div className="glass-panel" style={{ padding: '24px', borderRadius: '24px', backgroundColor: 'white', border: '1px solid var(--border-color)' }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>TOTAL LISTED ITEMS</div>
                                <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--secondary-color)', marginTop: '8px' }}>{analytics.totalItems}</div>
                                <div style={{ fontSize: '0.75rem', color: 'green', marginTop: '8px', fontWeight: '600' }}>Shareable Inventory</div>
                            </div>
                            <div className="glass-panel" style={{ padding: '24px', borderRadius: '24px', backgroundColor: 'white', border: '1px solid var(--border-color)' }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>TOTAL SYSTEM BOOKINGS</div>
                                <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--secondary-color)', marginTop: '8px' }}>{analytics.totalBookings}</div>
                                <div style={{ fontSize: '0.75rem', color: 'orange', marginTop: '8px', fontWeight: '600' }}>Platform Transactions</div>
                            </div>
                            <div className="glass-panel" style={{ padding: '24px', borderRadius: '24px', backgroundColor: 'white', border: '1px solid var(--border-color)' }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>TOTAL BOOKING VOLUME</div>
                                <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--secondary-color)', marginTop: '8px' }}>₹{analytics.totalBookingValue.toFixed(2)}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', fontWeight: '600' }}>Circulating Value</div>
                            </div>
                            <div className="glass-panel" style={{ padding: '24px', borderRadius: '24px', backgroundColor: 'white', border: '1px solid var(--primary-color)', boxShadow: '0 8px 30px rgba(255, 56, 92, 0.05)' }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: '700' }}>PLATFORM REVENUE (5%)</div>
                                <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--secondary-color)', marginTop: '8px' }}>₹{analytics.totalRevenue.toFixed(2)}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--primary-color)', marginTop: '8px', fontWeight: '700' }}>System Net Profits</div>
                            </div>
                        </div>

                        {/* Chart Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
                            {/* SVG Monthly Revenue Chart */}
                            <div className="glass-panel" style={{ padding: '24px', borderRadius: '24px', backgroundColor: 'white', display: 'flex', flexDirection: 'column' }}>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '20px' }}>Platform Monthly Revenue (5% Fee Share)</h3>
                                <div style={{ display: 'flex', height: '220px', alignItems: 'flex-end', justifyContent: 'space-around', padding: '10px 0', borderBottom: '2px solid var(--border-color)', position: 'relative' }}>
                                    {Object.entries(analytics.monthlyRevenue || {}).map(([month, val]) => {
                                        const maxVal = Math.max(...Object.values(analytics.monthlyRevenue || {}), 100);
                                        const heightPercent = Math.min((val / maxVal) * 180, 180); // cap at 180px
                                        return (
                                            <div key={month} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '60px', gap: '8px' }}>
                                                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--primary-color)' }}>₹{val.toFixed(0)}</span>
                                                <div style={{
                                                    width: '32px',
                                                    height: `${heightPercent}px`,
                                                    background: 'linear-gradient(180deg, var(--primary-color), var(--accent-color))',
                                                    borderRadius: '8px 8px 0 0',
                                                    transition: 'all 0.5s ease',
                                                    boxShadow: '0 4px 12px rgba(255, 56, 92, 0.2)'
                                                }}></div>
                                                <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>{month}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Listings Categories / Stats list */}
                            <div className="glass-panel" style={{ padding: '24px', borderRadius: '24px', backgroundColor: 'white' }}>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '20px' }}>Listings Distribution by Category</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {Object.entries(analytics.itemsByCategory || {}).map(([cat, count]) => {
                                        const total = analytics.totalItems || 1;
                                        const pct = (count / total) * 100;
                                        return (
                                            <div key={cat}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: '600', marginBottom: '6px' }}>
                                                    <span>{cat}</span>
                                                    <span style={{ color: 'var(--text-muted)' }}>{count} item(s) ({pct.toFixed(0)}%)</span>
                                                </div>
                                                <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${pct}%`, height: '100%', backgroundColor: 'var(--accent-color)', borderRadius: '4px' }}></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {Object.keys(analytics.itemsByCategory || {}).length === 0 && (
                                        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                            No listings created yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab: Users */}
                {activeTab === 'users' && (
                    <div className="glass-panel" style={{ padding: '24px', borderRadius: '24px', backgroundColor: 'white', animation: 'fadeIn 0.25s ease-out' }}>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>User Account Moderation & Roles</h3>
                        <div className="table-responsive-container" style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        <th style={{ padding: '16px 12px' }}>EMAIL</th>
                                        <th style={{ padding: '16px 12px' }}>ADDRESS</th>
                                        <th style={{ padding: '16px 12px' }}>STATUS</th>
                                        <th style={{ padding: '16px 12px' }}>ROLES</th>
                                        <th style={{ padding: '16px 12px', textAlign: 'right' }}>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                                            <td style={{ padding: '16px 12px', fontWeight: '700', color: 'var(--secondary-color)' }}>{u.email}</td>
                                            <td style={{ padding: '16px 12px', color: 'var(--text-muted)' }}>{u.address}</td>
                                            <td style={{ padding: '16px 12px' }}>
                                                <span style={{
                                                    padding: '4px 10px',
                                                    borderRadius: '20px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '700',
                                                    backgroundColor: u.verified ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                    color: u.verified ? 'green' : 'red'
                                                }}>
                                                    {u.verified ? 'Active / Verified' : 'Banned / Blocked'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px 12px' }}>
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    {u.roles.map(role => (
                                                        <span key={role} style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontWeight: '600' }}>
                                                            {role}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    <button
                                                        onClick={() => handleRoleChange(u.id, u.roles, 'ADMIN')}
                                                        className="btn-primary"
                                                        style={{ padding: '6px 12px', fontSize: '0.75rem', minHeight: 'auto', backgroundColor: u.roles.includes('ADMIN') ? '#cbd5e1' : 'var(--accent-color)', color: u.roles.includes('ADMIN') ? 'black' : 'white' }}
                                                    >
                                                        {u.roles.includes('ADMIN') ? 'Demote Admin' : 'Make Admin'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleUserStatusToggle(u.id)}
                                                        className="btn-primary"
                                                        style={{ padding: '6px 12px', fontSize: '0.75rem', minHeight: 'auto', backgroundColor: u.verified ? 'var(--primary-color)' : 'green' }}
                                                    >
                                                        {u.verified ? 'Ban User' : 'Unban User'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination controls */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Page {userPage + 1} of {userTotalPages}</span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button disabled={userPage === 0} onClick={() => fetchUsers(userPage - 1)} className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.8rem', minHeight: 'auto', backgroundColor: userPage === 0 ? '#cbd5e1' : 'var(--secondary-color)' }}>Prev</button>
                                <button disabled={userPage + 1 >= userTotalPages} onClick={() => fetchUsers(userPage + 1)} className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.8rem', minHeight: 'auto', backgroundColor: userPage + 1 >= userTotalPages ? '#cbd5e1' : 'var(--secondary-color)' }}>Next</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab: Listings */}
                {activeTab === 'listings' && (
                    <div className="glass-panel" style={{ padding: '24px', borderRadius: '24px', backgroundColor: 'white', animation: 'fadeIn 0.25s ease-out' }}>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Listing Item Moderation</h3>
                        <div className="table-responsive-container" style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        <th style={{ padding: '16px 12px' }}>NAME</th>
                                        <th style={{ padding: '16px 12px' }}>CATEGORY</th>
                                        <th style={{ padding: '16px 12px' }}>PRICE / DAY</th>
                                        <th style={{ padding: '16px 12px' }}>OWNER</th>
                                        <th style={{ padding: '16px 12px' }}>STATUS</th>
                                        <th style={{ padding: '16px 12px', textAlign: 'right' }}>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {listings.map(l => (
                                        <tr key={l.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                                            <td style={{ padding: '16px 12px', fontWeight: '700', color: 'var(--secondary-color)' }}>{l.name}</td>
                                            <td style={{ padding: '16px 12px', color: 'var(--text-muted)' }}>{l.category}</td>
                                            <td style={{ padding: '16px 12px', fontWeight: '600' }}>₹{l.price.toFixed(2)}</td>
                                            <td style={{ padding: '16px 12px', color: 'var(--text-muted)' }}>{l.ownerEmail}</td>
                                            <td style={{ padding: '16px 12px' }}>
                                                <span style={{
                                                    padding: '4px 10px',
                                                    borderRadius: '20px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '700',
                                                    backgroundColor: l.available ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                    color: l.available ? 'green' : 'red'
                                                }}>
                                                    {l.available ? 'Active / Visible' : 'Suspended / Hidden'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                                                <button
                                                    onClick={() => handleListingModerate(l.id)}
                                                    className="btn-primary"
                                                    style={{ padding: '6px 12px', fontSize: '0.75rem', minHeight: 'auto', backgroundColor: l.available ? 'var(--primary-color)' : 'green' }}
                                                >
                                                    {l.available ? 'Suspend Listing' : 'Approve Listing'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination controls */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Page {listingPage + 1} of {listingTotalPages}</span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button disabled={listingPage === 0} onClick={() => fetchListings(listingPage - 1)} className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.8rem', minHeight: 'auto', backgroundColor: listingPage === 0 ? '#cbd5e1' : 'var(--secondary-color)' }}>Prev</button>
                                <button disabled={listingPage + 1 >= listingTotalPages} onClick={() => fetchListings(listingPage + 1)} className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.8rem', minHeight: 'auto', backgroundColor: listingPage + 1 >= listingTotalPages ? '#cbd5e1' : 'var(--secondary-color)' }}>Next</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab: Bookings */}
                {activeTab === 'bookings' && (
                    <div className="glass-panel" style={{ padding: '24px', borderRadius: '24px', backgroundColor: 'white', animation: 'fadeIn 0.25s ease-out' }}>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Platform Bookings & Overrides</h3>
                        <div className="table-responsive-container" style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        <th style={{ padding: '16px 12px' }}>ID</th>
                                        <th style={{ padding: '16px 12px' }}>ITEM</th>
                                        <th style={{ padding: '16px 12px' }}>RENTER</th>
                                        <th style={{ padding: '16px 12px' }}>OWNER</th>
                                        <th style={{ padding: '16px 12px' }}>DATES</th>
                                        <th style={{ padding: '16px 12px' }}>STATUS</th>
                                        <th style={{ padding: '16px 12px', textAlign: 'right' }}>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookings.map(b => (
                                        <tr key={b.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                                            <td style={{ padding: '16px 12px', color: 'var(--text-muted)' }}>#{b.id}</td>
                                            <td style={{ padding: '16px 12px', fontWeight: '700', color: 'var(--secondary-color)' }}>{b.itemName}</td>
                                            <td style={{ padding: '16px 12px', color: 'var(--text-muted)' }}>{b.renterEmail}</td>
                                            <td style={{ padding: '16px 12px', color: 'var(--text-muted)' }}>{b.ownerEmail}</td>
                                            <td style={{ padding: '16px 12px', fontSize: '0.8rem' }}>
                                                {new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}
                                            </td>
                                            <td style={{ padding: '16px 12px' }}>
                                                <span style={{
                                                    padding: '4px 10px',
                                                    borderRadius: '20px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '700',
                                                    backgroundColor: b.status === 'COMPLETED' ? 'rgba(34, 197, 94, 0.1)' : b.status === 'PENDING' ? 'rgba(249, 115, 22, 0.1)' : b.status === 'APPROVED' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                    color: b.status === 'COMPLETED' ? 'green' : b.status === 'PENDING' ? 'orange' : b.status === 'APPROVED' ? 'blue' : 'red'
                                                }}>
                                                    {b.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                                                <button
                                                    onClick={() => handleBookingCancel(b.id)}
                                                    disabled={b.status === 'CANCELLED' || b.status === 'COMPLETED'}
                                                    className="btn-primary"
                                                    style={{
                                                        padding: '6px 12px',
                                                        fontSize: '0.75rem',
                                                        minHeight: 'auto',
                                                        backgroundColor: b.status === 'CANCELLED' || b.status === 'COMPLETED' ? '#cbd5e1' : 'var(--primary-color)',
                                                        color: b.status === 'CANCELLED' || b.status === 'COMPLETED' ? 'var(--text-muted)' : 'white',
                                                        cursor: b.status === 'CANCELLED' || b.status === 'COMPLETED' ? 'not-allowed' : 'pointer'
                                                    }}
                                                >
                                                    Force Cancel
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination controls */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Page {bookingPage + 1} of {bookingTotalPages}</span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button disabled={bookingPage === 0} onClick={() => fetchBookings(bookingPage - 1)} className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.8rem', minHeight: 'auto', backgroundColor: bookingPage === 0 ? '#cbd5e1' : 'var(--secondary-color)' }}>Prev</button>
                                <button disabled={bookingPage + 1 >= bookingTotalPages} onClick={() => fetchBookings(bookingPage + 1)} className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.8rem', minHeight: 'auto', backgroundColor: bookingPage + 1 >= bookingTotalPages ? '#cbd5e1' : 'var(--secondary-color)' }}>Next</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
