import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const RentModal = ({ isOpen, item, onClose, onSuccess }) => {
    const [startDay, setStartDay] = useState('');
    const [startHour, setStartHour] = useState('12');
    const [startMin, setStartMin] = useState('00');
    const [startAmPm, setStartAmPm] = useState('AM');

    const [endDay, setEndDay] = useState('');
    const [endHour, setEndHour] = useState('12');
    const [endMin, setEndMin] = useState('00');
    const [endAmPm, setEndAmPm] = useState('AM');

    useEffect(() => {
        if (isOpen) {
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);

            setStartDay(now.toISOString().split('T')[0]);
            setEndDay(tomorrow.toISOString().split('T')[0]);
        }
    }, [isOpen]);

    const formatTo24h = (h, m, period) => {
        let hour = parseInt(h);
        if (period === 'PM' && hour !== 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;
        return `${hour.toString().padStart(2, '0')}:${m}`;
    };

    const getLocalDateTime = (day, h, m, period) => {
        if (!day) return null;
        return `${day}T${formatTo24h(h, m, period)}`;
    };

    const currentStartDate = getLocalDateTime(startDay, startHour, startMin, startAmPm);
    const currentEndDate = getLocalDateTime(endDay, endHour, endMin, endAmPm);

    const handleRentSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/bookings', {
                itemId: item.id,
                startDate: currentStartDate,
                endDate: currentEndDate
            });
            onSuccess();
            window.alert('Request sent successfully!');
        } catch (error) {
            console.error("Booking failed", error);
            const msg = error.response?.data?.message || error.response?.data || "Failed to book item.";
            window.alert(`Error: ${msg}`);
        }
    };

    if (!isOpen || !item) return null;

    const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
    const minutes = ["00", "15", "30", "45"];

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000
        }}>
            <div className="glass-panel" style={{ padding: '32px', width: '480px', borderRadius: '24px' }}>
                <h2 style={{ fontSize: '22px', marginBottom: '24px' }}>Reserve {item.name}</h2>
                <form onSubmit={handleRentSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ padding: '16px', border: '1px solid #ddd', borderRadius: '12px 12px 0 0' }}>
                            <label style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase' }}>Check-In</label>
                            <input type="date" value={startDay} onChange={e => setStartDay(e.target.value)} style={{ width: '100%', border: 'none', outline: 'none' }} />
                            <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                                <select value={startHour} onChange={e => setStartHour(e.target.value)} style={{ border: 'none' }}>{hours.map(h => <option key={h} value={h}>{h}</option>)}</select>
                                <select value={startMin} onChange={e => setStartMin(e.target.value)} style={{ border: 'none' }}>{minutes.map(m => <option key={m} value={m}>{m}</option>)}</select>
                                <select value={startAmPm} onChange={e => setStartAmPm(e.target.value)} style={{ border: 'none' }}><option>AM</option><option>PM</option></select>
                            </div>
                        </div>
                        <div style={{ padding: '16px', border: '1px solid #ddd', borderTop: 'none', borderRadius: '0 0 12px 12px' }}>
                            <label style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase' }}>Check-Out</label>
                            <input type="date" value={endDay} onChange={e => setEndDay(e.target.value)} style={{ width: '100%', border: 'none', outline: 'none' }} />
                            <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                                <select value={endHour} onChange={e => setEndHour(e.target.value)} style={{ border: 'none' }}>{hours.map(h => <option key={h} value={h}>{h}</option>)}</select>
                                <select value={endMin} onChange={e => setEndMin(e.target.value)} style={{ border: 'none' }}>{minutes.map(m => <option key={m} value={m}>{m}</option>)}</select>
                                <select value={endAmPm} onChange={e => setEndAmPm(e.target.value)} style={{ border: 'none' }}><option>AM</option><option>PM</option></select>
                            </div>
                        </div>
                    </div>

                    {currentStartDate && currentEndDate && (
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <span style={{ textDecoration: 'underline' }}>₹{item.price} x {(() => {
                                    const diff = (new Date(currentEndDate) - new Date(currentStartDate)) / (1000 * 60 * 60);
                                    return Math.ceil(diff / 24);
                                })()} nights</span>
                                <span>₹{Math.ceil(((new Date(currentEndDate) - new Date(currentStartDate)) / (1000 * 60 * 60 * 24)) * item.price) || item.price * 0.75}</span>
                            </div>
                            <div style={{ borderTop: '1px solid #ddd', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '18px' }}>
                                <span>Total</span>
                                <span>₹{(() => {
                                    const diff = (new Date(currentEndDate) - new Date(currentStartDate)) / (1000 * 60 * 60);
                                    if (diff <= 24) return Math.ceil(item.price * 0.75);
                                    return Math.ceil(diff / 24) * item.price;
                                })()}</span>
                            </div>
                        </div>
                    )}

                    <button type="submit" className="btn-primary" style={{ width: '100%', borderRadius: '8px', fontSize: '16px' }}>Reserve</button>
                    <button type="button" onClick={onClose} style={{ width: '100%', background: 'none', border: 'none', marginTop: '16px', color: '#222', textDecoration: 'underline', cursor: 'pointer' }}>Close</button>
                </form>
            </div>
        </div>
    );
};

export default RentModal;
