import React, { useState } from 'react';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../store/authStore';
import { useListingsQuery, useWishlistQuery, useToggleWishlistMutation } from '../../features/listings/hooks/useListings';
import { useMyBookingsQuery, useBookingRequestsQuery, useUpdateBookingStatusMutation } from '../../features/bookings/hooks/useBookings';
import ItemCard from '../../features/listings/components/ItemCard';
import RentModal from '../../features/bookings/components/RentModal';
import { useCreateReviewMutation } from '../../features/reviews/hooks/useReviews';

const DashboardPage = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('renter'); // 'renter' or 'owner'

    const [renterPage, setRenterPage] = useState(0);
    const [ownerPage, setOwnerPage] = useState(0);

    const [selectedRentItem, setSelectedRentItem] = useState(null);
    const [showRentModal, setShowRentModal] = useState(false);

    // Review Modal States
    const [reviewingBooking, setReviewingBooking] = useState(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');

    // Fetch listings and bookings data
    const { data: itemsData, isLoading: isLoadingListings } = useListingsQuery({ page: 0, size: 100 });
    const { data: renterData, isLoading: isLoadingRenter } = useMyBookingsQuery({ page: renterPage, size: 10 });
    const { data: incomingData, isLoading: isLoadingRequests } = useBookingRequestsQuery({ page: ownerPage, size: 10 });
    const { data: wishlist = [] } = useWishlistQuery();
    
    const updateStatusMutation = useUpdateBookingStatusMutation();
    const toggleWishlistMutation = useToggleWishlistMutation();
    const createReviewMutation = useCreateReviewMutation();

    const handleWishlistToggle = (itemId) => {
        toggleWishlistMutation.mutate(itemId);
    };

    const handleReviewSubmit = (e) => {
        e.preventDefault();
        if (!reviewingBooking) return;
        createReviewMutation.mutate({
            itemId: reviewingBooking.item.id,
            bookingId: reviewingBooking.id,
            rating,
            comment
        }, {
            onSuccess: () => {
                window.alert("Review submitted successfully!");
                setReviewingBooking(null);
                setRating(5);
                setComment('');
            },
            onError: (err) => {
                const msg = err.response?.data?.message || err.message || "Failed to submit review.";
                window.alert(`Error: ${msg}`);
            }
        });
    };

    const isLoading = isLoadingListings || isLoadingRenter || isLoadingRequests || updateStatusMutation.isPending;

    // Helper: calculate days between two dates
    const calculateDays = (start, end) => {
        const diff = new Date(end) - new Date(start);
        return Math.ceil(diff / (1000 * 60 * 60 * 24)) || 1;
    };

    const renterBookings = renterData?.content || [];
    const incomingRequests = incomingData?.content || [];
    const items = itemsData?.content || [];

    // --- Renter Analytics & Data Segmentation ---
    const activeRentals = renterBookings.filter(b => b.status === 'APPROVED' && new Date(b.endDate) > new Date());
    const pendingRentals = renterBookings.filter(b => b.status === 'PENDING');
    const completedRentals = renterBookings.filter(b => b.status === 'APPROVED' && new Date(b.endDate) <= new Date());
    
    const totalSpent = renterBookings
        .filter(b => b.status === 'APPROVED')
        .reduce((sum, b) => sum + (b.item?.price || 0) * calculateDays(b.startDate, b.endDate), 0);

    const avgDuration = renterBookings.length > 0 
        ? (renterBookings.reduce((sum, b) => sum + calculateDays(b.startDate, b.endDate), 0) / renterBookings.length).toFixed(1)
        : 0;

    // --- Owner Analytics & Data Segmentation ---
    const ownerListings = items.filter(item => item.owner?.email === user?.email);
    const approvedRequests = incomingRequests.filter(b => b.status === 'APPROVED');
    const pendingRequests = incomingRequests.filter(b => b.status === 'PENDING');

    const totalEarnings = approvedRequests.reduce((sum, b) => sum + (b.item?.price || 0) * calculateDays(b.startDate, b.endDate), 0);
    const occupancyRate = ownerListings.length > 0 
        ? Math.min(Math.round((approvedRequests.length / ownerListings.length) * 100), 100) 
        : 0;

    // Simulated monthly values for Owner Earnings SVG Chart
    const monthlyEarningsMock = [
        { month: 'Jan', amt: Math.round(totalEarnings * 0.1) || 200 },
        { month: 'Feb', amt: Math.round(totalEarnings * 0.15) || 450 },
        { month: 'Mar', amt: Math.round(totalEarnings * 0.25) || 800 },
        { month: 'Apr', amt: Math.round(totalEarnings * 0.2) || 600 },
        { month: 'May', amt: Math.round(totalEarnings * 0.3) || 1200 },
        { month: 'Jun', amt: totalEarnings || 1500 }
    ];

    const maxAmt = Math.max(...monthlyEarningsMock.map(d => d.amt), 1);

    const handleAction = (id, status) => {
        updateStatusMutation.mutate({ id, status }, {
            onSuccess: () => {
                window.alert(`Booking request ${status.toLowerCase()} successfully!`);
            },
            onError: (error) => {
                console.error(`Error updating booking status`, error);
                const msg = error.response?.data?.message || error.message || "Failed to update booking status.";
                window.alert(`Error: ${msg}`);
            }
        });
    };

    return (
        <>
            <Navbar />
            <div className="dashboard-container" style={{ paddingTop: '100px' }}>
                
                {/* Header title */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                    <div>
                        <h2 style={{ fontSize: '26px', fontWeight: '800' }}>User Hub</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '2px' }}>Account: {user?.email}</p>
                    </div>
                    
                    {/* Tab Navigation */}
                    <div className="tab-container" style={{ marginBottom: 0 }}>
                        <button
                            className={`tab-button ${activeTab === 'renter' ? 'active' : 'inactive'}`}
                            onClick={() => setActiveTab('renter')}
                        >
                            Renter Panel
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'owner' ? 'active' : 'inactive'}`}
                            onClick={() => setActiveTab('owner')}
                        >
                            Owner Panel
                        </button>
                    </div>
                </div>

                {isLoadingRenter || isLoadingRequests || isLoadingListings ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                        <div className="shimmer" style={{ height: '100px', borderRadius: '16px', margin: '20px auto', width: '100%' }}></div>
                        <div className="shimmer" style={{ height: '300px', borderRadius: '16px', margin: '20px auto', width: '100%' }}></div>
                        <p>Aggregating analytics data...</p>
                    </div>
                ) : activeTab === 'renter' ? (
                    /* ==================== RENTER DASHBOARD ==================== */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', animation: 'fadeIn 0.3s ease-out' }}>
                        
                        {/* Renter Spending Analytics Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                            <div className="analytics-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Spending</span>
                                <span style={{ fontSize: '2.2rem', fontWeight: '800', color: 'var(--secondary-color)' }}>₹{totalSpent}</span>
                                <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: '600' }}>↑ 12% from last month</span>
                            </div>
                            <div className="analytics-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rentals Count</span>
                                <span style={{ fontSize: '2.2rem', fontWeight: '800', color: 'var(--secondary-color)' }}>{renterBookings.length}</span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Items borrowed from neighbours</span>
                            </div>
                            <div className="analytics-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Average Period</span>
                                <span style={{ fontSize: '2.2rem', fontWeight: '800', color: 'var(--secondary-color)' }}>{avgDuration} <span style={{ fontSize: '1.25rem', fontWeight: '500' }}>days</span></span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Typical usage length</span>
                            </div>
                        </div>

                        {/* Active Rentals Table */}
                        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '16px' }}>Active Rentals</h3>
                            {activeRentals.length > 0 ? (
                                <div className="table-responsive-container">
                                    <table className="dashboard-table">
                                        <thead>
                                            <tr>
                                                <th>Item Name</th>
                                                <th>Dates</th>
                                                <th>Daily Price</th>
                                                <th>Total Billing</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {activeRentals.map(b => (
                                                <tr key={b.id}>
                                                    <td style={{ fontWeight: '600' }}>{b.item?.name}</td>
                                                    <td>{new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}</td>
                                                    <td>₹{b.item?.price}</td>
                                                    <td style={{ fontWeight: '700' }}>₹{(b.item?.price || 0) * calculateDays(b.startDate, b.endDate)}</td>
                                                    <td><span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700', backgroundColor: '#d1fae5', color: '#10b981' }}>ACTIVE</span></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No current active rentals.</p>}
                        </div>

                        {/* Saved Wishlist Section */}
                        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '16px' }}>Saved Wishlist</h3>
                            {wishlist.length > 0 ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                                    {wishlist.map(item => (
                                        <ItemCard
                                            key={item.id}
                                            item={item}
                                            onRentClick={() => {
                                                setSelectedRentItem(item);
                                                setShowRentModal(true);
                                            }}
                                            isWishlisted={true}
                                            onWishlistToggle={handleWishlistToggle}
                                        />
                                    ))}
                                </div>
                            ) : <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No wishlisted items yet.</p>}
                        </div>

                        {/* Pending Requests Table */}
                        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '16px' }}>Pending Approvals</h3>
                            {pendingRentals.length > 0 ? (
                                <div className="table-responsive-container">
                                    <table className="dashboard-table">
                                        <thead>
                                            <tr>
                                                <th>Item Name</th>
                                                <th>Duration Requested</th>
                                                <th>Total Price</th>
                                                <th>Status</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pendingRentals.map(b => (
                                                <tr key={b.id}>
                                                    <td style={{ fontWeight: '600' }}>{b.item?.name}</td>
                                                    <td>{calculateDays(b.startDate, b.endDate)} days</td>
                                                    <td style={{ fontWeight: '700' }}>₹{(b.item?.price || 0) * calculateDays(b.startDate, b.endDate)}</td>
                                                    <td><span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700', backgroundColor: '#fef9c3', color: '#ca8a04' }}>PENDING</span></td>
                                                    <td>
                                                        <button 
                                                            className="btn-secondary" 
                                                            style={{ padding: '6px 12px', fontSize: '0.75rem', borderColor: '#ef4444', color: '#ef4444', background: 'transparent' }}
                                                            onClick={() => {
                                                                if (window.confirm("Cancel request?")) handleAction(b.id, 'CANCELLED');
                                                            }}
                                                            disabled={isLoading}
                                                        >
                                                            Cancel Request
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No pending approval requests.</p>}
                        </div>

                        {/* Completed History Table */}
                        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '16px' }}>Rentals History</h3>
                            {completedRentals.length > 0 ? (
                                <div className="table-responsive-container">
                                    <table className="dashboard-table">
                                        <thead>
                                            <tr>
                                                <th>Item Name</th>
                                                <th>Dates</th>
                                                <th>Spent</th>
                                                <th>Owner</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {completedRentals.map(b => (
                                                <tr key={b.id}>
                                                    <td style={{ fontWeight: '600' }}>{b.item?.name}</td>
                                                    <td>{new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}</td>
                                                    <td style={{ fontWeight: '700' }}>₹{(b.item?.price || 0) * calculateDays(b.startDate, b.endDate)}</td>
                                                    <td>{b.item?.owner?.email?.split('@')[0]}</td>
                                                    <td>
                                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                            <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700', backgroundColor: '#e2e8f0', color: '#475569' }}>COMPLETED</span>
                                                            <button 
                                                                className="btn-primary"
                                                                style={{ padding: '4px 10px', fontSize: '0.7rem', minHeight: 'auto', borderRadius: '8px', boxShadow: 'none' }}
                                                                onClick={() => setReviewingBooking(b)}
                                                            >
                                                                ★ Review
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No past rentals found.</p>}
                        </div>

                        {/* Renter Pagination Controls */}
                        {renterData && renterData.totalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '20px' }}>
                                <button
                                    className="btn-secondary"
                                    disabled={renterPage === 0}
                                    onClick={() => setRenterPage(prev => Math.max(0, prev - 1))}
                                    style={{ padding: '6px 12px', opacity: renterPage === 0 ? 0.5 : 1, cursor: renterPage === 0 ? 'not-allowed' : 'pointer' }}
                                >
                                    ← Prev
                                </button>
                                <span style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-dark)' }}>
                                    Page {renterPage + 1} of {renterData.totalPages}
                                </span>
                                <button
                                    className="btn-secondary"
                                    disabled={renterData.last}
                                    onClick={() => setRenterPage(prev => prev + 1)}
                                    style={{ padding: '6px 12px', opacity: renterData.last ? 0.5 : 1, cursor: renterData.last ? 'not-allowed' : 'pointer' }}
                                >
                                    Next →
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    /* ==================== OWNER DASHBOARD ==================== */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', animation: 'fadeIn 0.3s ease-out' }}>
                        
                        {/* Metrics summary */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                            <div className="analytics-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Revenue</span>
                                <span style={{ fontSize: '2.2rem', fontWeight: '800', color: 'var(--secondary-color)' }}>₹{totalEarnings}</span>
                                <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: '600' }}>↑ 18% month-over-month</span>
                            </div>
                            <div className="analytics-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Listings</span>
                                <span style={{ fontSize: '2.2rem', fontWeight: '800', color: 'var(--secondary-color)' }}>{ownerListings.length}</span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Items hosted on NeighbourLend</span>
                            </div>
                            <div className="analytics-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Occupancy Rate</span>
                                <span style={{ fontSize: '2.2rem', fontWeight: '800', color: 'var(--secondary-color)' }}>{occupancyRate}%</span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Booking ratio per listing</span>
                            </div>
                        </div>

                        {/* Revenue SVG Chart and Booking requests */}
                        <div className="owner-dashboard-grid">
                            
                            {/* SVG Monthly Income Chart */}
                            <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>Revenue Growth (2026)</h3>
                                <div style={{ height: '220px', width: '100%', position: 'relative' }}>
                                    <svg viewBox="0 0 450 200" width="100%" height="100%">
                                        {/* Chart Grid Lines */}
                                        <line x1="0" y1="170" x2="450" y2="170" stroke="#cbd5e1" strokeWidth="1.5" />
                                        <line x1="0" y1="120" x2="450" y2="120" stroke="#f1f5f9" strokeWidth="1" />
                                        <line x1="0" y1="70" x2="450" y2="70" stroke="#f1f5f9" strokeWidth="1" />
                                        <line x1="0" y1="20" x2="450" y2="20" stroke="#f1f5f9" strokeWidth="1" />

                                        {/* Dynamic Bar Plots */}
                                        {monthlyEarningsMock.map((item, index) => {
                                            const barWidth = 35;
                                            const gap = 40;
                                            const startX = 40 + index * (barWidth + gap);
                                            const barHeight = Math.max((item.amt / maxAmt) * 140, 10);
                                            const startY = 170 - barHeight;

                                            return (
                                                <g key={item.month}>
                                                    {/* Gradient Fill Bar */}
                                                    <defs>
                                                        <linearGradient id={`barGrad-${index}`} x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="var(--primary-color)" />
                                                            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.7" />
                                                        </linearGradient>
                                                    </defs>
                                                    <rect
                                                        x={startX}
                                                        y={startY}
                                                        width={barWidth}
                                                        height={barHeight}
                                                        rx="6"
                                                        fill={`url(#barGrad-${index})`}
                                                    />
                                                    {/* Amount hover labels */}
                                                    <text
                                                        x={startX + barWidth / 2}
                                                        y={startY - 6}
                                                        textAnchor="middle"
                                                        fill="var(--text-dark)"
                                                        fontSize="9"
                                                        fontWeight="700"
                                                    >
                                                        ₹{item.amt}
                                                    </text>
                                                    {/* Month labels */}
                                                    <text
                                                        x={startX + barWidth / 2}
                                                        y="185"
                                                        textAnchor="middle"
                                                        fill="var(--text-muted)"
                                                        fontSize="10"
                                                        fontWeight="600"
                                                    >
                                                        {item.month}
                                                    </text>
                                                </g>
                                            );
                                        })}
                                    </svg>
                                </div>
                            </div>

                            {/* Booking Requests actions card */}
                            <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '16px' }}>Booking Requests</h3>
                                {pendingRequests.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {pendingRequests.map(req => (
                                            <div key={req.id} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', background: '#fafafa' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <h4 style={{ fontSize: '0.95rem', fontWeight: '700' }}>{req.item?.name}</h4>
                                                    <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--primary-color)' }}>₹{(req.item?.price || 0) * calculateDays(req.startDate, req.endDate)}</span>
                                                </div>
                                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Renter: {req.user?.email}</p>
                                                <div style={{ fontSize: '0.8rem', marginTop: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '8px', opacity: 0.8 }}>
                                                    <p>🗓️ {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}</p>
                                                    <p>⏱️ Duration: {calculateDays(req.startDate, req.endDate)} days</p>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                                    <button
                                                        className="btn-primary"
                                                        style={{ padding: '6px 14px', fontSize: '0.75rem', background: '#10b981', minHeight: 'auto', flex: 1, boxShadow: 'none' }}
                                                        onClick={() => handleAction(req.id, 'APPROVED')}
                                                        disabled={isLoading}
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        className="btn-secondary"
                                                        style={{ padding: '6px 14px', fontSize: '0.75rem', borderColor: '#ef4444', color: '#ef4444', flex: 1 }}
                                                        onClick={() => handleAction(req.id, 'REJECTED')}
                                                        disabled={isLoading}
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No pending request decisions.</p>}

                                {/* Owner Requests Pagination Controls */}
                                {incomingData && incomingData.totalPages > 1 && (
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '16px' }}>
                                        <button
                                            className="btn-secondary"
                                            disabled={ownerPage === 0}
                                            onClick={() => setOwnerPage(prev => Math.max(0, prev - 1))}
                                            style={{ padding: '6px 12px', opacity: ownerPage === 0 ? 0.5 : 1, cursor: ownerPage === 0 ? 'not-allowed' : 'pointer' }}
                                        >
                                            ← Prev
                                        </button>
                                        <span style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-dark)' }}>
                                            Page {ownerPage + 1} of {incomingData.totalPages}
                                        </span>
                                        <button
                                            className="btn-secondary"
                                            disabled={incomingData.last}
                                            onClick={() => setOwnerPage(prev => prev + 1)}
                                            style={{ padding: '6px 12px', opacity: incomingData.last ? 0.5 : 1, cursor: incomingData.last ? 'not-allowed' : 'pointer' }}
                                        >
                                            Next →
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Active Hosting Listings */}
                        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '16px' }}>Active Hosting Listings</h3>
                            {ownerListings.length > 0 ? (
                                <div className="table-responsive-container">
                                    <table className="dashboard-table">
                                        <thead>
                                            <tr>
                                                <th>Listing</th>
                                                <th>Category</th>
                                                <th>Daily Price</th>
                                                <th>Availability Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ownerListings.map(item => {
                                                const isCurrentlyBooked = item.nextAvailableDate && new Date(item.nextAvailableDate) > new Date();
                                                return (
                                                    <tr key={item.id}>
                                                        <td style={{ fontWeight: '600' }}>{item.name}</td>
                                                        <td>{item.category}</td>
                                                        <td style={{ fontWeight: '700' }}>₹{item.price}</td>
                                                        <td>
                                                            <span style={{ 
                                                                padding: '3px 8px', 
                                                                borderRadius: '12px', 
                                                                fontSize: '0.75rem', 
                                                                fontWeight: '700', 
                                                                backgroundColor: isCurrentlyBooked ? '#fee2e2' : '#d1fae5', 
                                                                color: isCurrentlyBooked ? '#ef4444' : '#10b981' 
                                                            }}>
                                                                {isCurrentlyBooked ? 'RENTED OUT' : 'AVAILABLE'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>You are not hosting any gear yet.</p>}
                        </div>

                    </div>
                )}
            </div>

            {/* Modals */}
            <RentModal
                isOpen={showRentModal}
                item={selectedRentItem}
                onClose={() => setShowRentModal(false)}
                onSuccess={() => setShowRentModal(false)}
            />

            {reviewingBooking && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10000,
                    fontFamily: 'Outfit, sans-serif'
                }}>
                    <div className="glass-panel" style={{ padding: '28px', borderRadius: '24px', width: '420px', backgroundColor: 'white' }}>
                        <h3 style={{ margin: '0 0 12px 0', fontSize: '1.25rem', fontWeight: '800' }}>Review your experience</h3>
                        <p style={{ margin: '0 0 20px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            Share your feedback for <strong>{reviewingBooking.item?.name}</strong>.
                        </p>
                        <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                                    Rating
                                </label>
                                <div style={{ display: 'flex', gap: '8px', fontSize: '1.5rem' }}>
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <span
                                            key={star}
                                            style={{ cursor: 'pointer', color: star <= rating ? '#eab308' : '#e2e8f0' }}
                                            onClick={() => setRating(star)}
                                        >
                                            ★
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                                    Review Details
                                </label>
                                <textarea
                                    value={comment}
                                    onChange={e => setComment(e.target.value)}
                                    placeholder="Write your review here... How was the item? Was the owner helpful?"
                                    required
                                    style={{
                                        width: '100%',
                                        height: '100px',
                                        padding: '12px 14px',
                                        borderRadius: '12px',
                                        border: '1.5px solid var(--border-color)',
                                        fontFamily: 'inherit',
                                        fontSize: '0.9rem',
                                        outline: 'none',
                                        resize: 'none'
                                    }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setReviewingBooking(null)}
                                    style={{ flex: 1, padding: '10px 16px', fontSize: '0.85rem' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    style={{ flex: 1, padding: '10px 16px', fontSize: '0.85rem', minHeight: 'auto' }}
                                >
                                    Submit Review
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default DashboardPage;
