import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import api from '../../api/axios';

const MyBookings = () => {
    const [myRentals, setMyRentals] = useState([]);
    const [incomingRequests, setIncomingRequests] = useState([]);
    const [activeTab, setActiveTab] = useState('rentals'); // 'rentals' or 'requests'

    useEffect(() => {
        fetchRentals();
        fetchRequests();
    }, []);

    const fetchRentals = async () => {
        try {
            const response = await api.get('/bookings/my');
            setMyRentals(response.data);
        } catch (error) {
            console.error("Error fetching my rentals", error);
        }
    };

    const fetchRequests = async () => {
        try {
            const response = await api.get('/bookings/requests');
            setIncomingRequests(response.data);
        } catch (error) {
            console.error("Error fetching requests", error);
        }
    };

    const handleAction = async (id, status) => {
        try {
            await api.put(`/bookings/${id}/status?status=${status}`);
            fetchRequests();
            window.alert(`Booking ${status.toLowerCase()} successfully!`);
        } catch (error) {
            console.error(`Error updating booking status`, error);
        }
    };

    return (
        <>
            <Navbar />
            <div className="dashboard-container">
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                    <button
                        className="btn-primary"
                        style={{
                            backgroundColor: activeTab === 'rentals' ? '#000000' : '#e0e0e0',
                            color: activeTab === 'rentals' ? '#ffffff' : '#333333',
                            border: 'none'
                        }}
                        onClick={() => setActiveTab('rentals')}
                    >
                        My Rentals
                    </button>
                    <button
                        className="btn-primary"
                        style={{
                            backgroundColor: activeTab === 'requests' ? '#000000' : '#e0e0e0',
                            color: activeTab === 'requests' ? '#ffffff' : '#333333',
                            border: 'none'
                        }}
                        onClick={() => setActiveTab('requests')}
                    >
                        Incoming Requests
                    </button>
                </div>

                <div className="item-grid">
                    {activeTab === 'rentals' ? (
                        myRentals.length > 0 ? myRentals.map(booking => (
                            <div key={booking.id} className="glass-panel item-card">
                                <h3 style={{ fontSize: '1.25rem' }}>{booking.item?.name || "Unknown Item"}</h3>
                                <div style={{ marginTop: '1rem', opacity: 0.8 }}>
                                    <p>Start: {new Date(booking.startDate).toLocaleDateString()}</p>
                                    <p>End: {new Date(booking.endDate).toLocaleDateString()}</p>
                                </div>
                                <div style={{ marginTop: '1rem' }}>
                                    <span style={{
                                        padding: '4px 12px',
                                        borderRadius: '50px',
                                        fontSize: '0.8rem',
                                        backgroundColor: booking.status === 'APPROVED' ? 'rgba(34, 197, 94, 0.2)' : booking.status === 'REJECTED' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                                        color: booking.status === 'APPROVED' ? '#4ade80' : booking.status === 'REJECTED' ? '#f87171' : '#facc15'
                                    }}>
                                        {booking.status}
                                    </span>
                                </div>
                            </div>
                        )) : <p>No active rentals.</p>
                    ) : (
                        incomingRequests.length > 0 ? incomingRequests.map(booking => (
                            <div key={booking.id} className="glass-panel item-card">
                                <h3 style={{ fontSize: '1.25rem' }}>{booking.item?.name || "Unknown Item"}</h3>
                                <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>Requested by: {booking.user?.email}</p>
                                <div style={{ marginTop: '1rem', opacity: 0.8 }}>
                                    <p>Start: {new Date(booking.startDate).toLocaleDateString()}</p>
                                    <p>End: {new Date(booking.endDate).toLocaleDateString()}</p>
                                </div>

                                {booking.status === 'PENDING' ? (
                                    <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            className="btn-primary"
                                            onClick={() => handleAction(booking.id, 'APPROVED')}
                                            style={{ backgroundColor: '#22c55e', fontSize: '0.8rem', padding: '6px 12px' }}
                                        >
                                            Approve
                                        </button>
                                        <button
                                            className="btn-primary"
                                            onClick={() => handleAction(booking.id, 'REJECTED')}
                                            style={{ backgroundColor: '#ef4444', fontSize: '0.8rem', padding: '6px 12px' }}
                                        >
                                            Reject
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ marginTop: '1rem' }}>
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '50px',
                                            fontSize: '0.8rem',
                                            backgroundColor: booking.status === 'APPROVED' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                            color: booking.status === 'APPROVED' ? '#4ade80' : '#f87171'
                                        }}>
                                            {booking.status}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )) : <p>No incoming requests.</p>
                    )}
                </div>
            </div>
        </>
    );
};

export default MyBookings;
