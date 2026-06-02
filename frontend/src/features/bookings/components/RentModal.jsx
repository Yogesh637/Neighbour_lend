import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { bookingFormSchema } from '../bookingSchemas';
import { useCreateBookingMutation } from '../hooks/useBookings';
import { useChat } from '../../../context/ChatContext';

const RentModal = ({ isOpen, item, onClose, onSuccess }) => {
    const createBookingMutation = useCreateBookingMutation();
    const isSubmitting = createBookingMutation.isPending;
    const { setActiveChatUser } = useChat();

    const handleMessageHost = () => {
        if (item.owner?.email) {
            setActiveChatUser(item.owner.email);
            onClose();
        }
    };

    const todayStr = new Date().toISOString().split('T')[0];

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(bookingFormSchema),
        defaultValues: {
            startDay: '',
            startHour: '12',
            startMin: '00',
            startAmPm: 'AM',
            endDay: '',
            endHour: '12',
            endMin: '00',
            endAmPm: 'AM',
        }
    });

    useEffect(() => {
        if (isOpen) {
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);

            setValue('startDay', now.toISOString().split('T')[0]);
            setValue('startHour', '12');
            setValue('startMin', '00');
            setValue('startAmPm', 'AM');

            setValue('endDay', tomorrow.toISOString().split('T')[0]);
            setValue('endHour', '12');
            setValue('endMin', '00');
            setValue('endAmPm', 'AM');
        }
    }, [isOpen, setValue]);

    const startDay = watch('startDay');
    const startHour = watch('startHour');
    const startMin = watch('startMin');
    const startAmPm = watch('startAmPm');
    
    const endDay = watch('endDay');
    const endHour = watch('endHour');
    const endMin = watch('endMin');
    const endAmPm = watch('endAmPm');

    const formatTo24h = (h, m, period) => {
        let hour = parseInt(h || '12');
        if (period === 'PM' && hour !== 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;
        return `${hour.toString().padStart(2, '0')}:${m || '00'}`;
    };

    const getLocalDateTime = (day, h, m, period) => {
        if (!day) return null;
        return `${day}T${formatTo24h(h, m, period)}`;
    };

    const currentStartDate = getLocalDateTime(startDay, startHour, startMin, startAmPm);
    const currentEndDate = getLocalDateTime(endDay, endHour, endMin, endAmPm);

    const dateError = errors.endDay?.message || '';

    // Calculate premium billing breakdowns
    const calculateReceiptBreakdown = () => {
        if (dateError || !currentStartDate || !currentEndDate || !item) {
            return { days: 0, basePrice: 0, serviceFee: 0, securityDeposit: 0, tax: 0, grandTotal: 0, weeklyDiscount: 0 };
        }
        const diff = (new Date(currentEndDate) - new Date(currentStartDate)) / (1000 * 60 * 60);
        const days = Math.ceil(diff / 24) || 1;
        
        const standardPrice = days * (item.price || 0);
        let basePrice = standardPrice;
        let weeklyDiscount = 0;

        if (days >= 7 && item.weeklyRate) {
            const discountedPrice = Math.floor(days / 7) * item.weeklyRate + (days % 7) * (item.price || 0);
            if (discountedPrice < standardPrice) {
                basePrice = discountedPrice;
                weeklyDiscount = standardPrice - discountedPrice;
            }
        }

        const serviceFee = Math.round(basePrice * 0.05); // 5% platform fee
        const securityDeposit = item.securityDeposit != null ? item.securityDeposit : Math.round(basePrice * 0.10);
        const tax = Math.round(basePrice * 0.18); // 18% local GST/Tax
        const grandTotal = basePrice + serviceFee + securityDeposit + tax;

        return { days, basePrice, serviceFee, securityDeposit, tax, grandTotal, weeklyDiscount };
    };

    const { days, basePrice, serviceFee, securityDeposit, tax, grandTotal, weeklyDiscount } = calculateReceiptBreakdown();

    const onSubmit = (data) => {
        if (dateError) return;

        createBookingMutation.mutate({
            itemId: item.id,
            startDate: currentStartDate,
            endDate: currentEndDate
        }, {
            onSuccess: () => {
                onSuccess();
                window.alert('Rental request submitted successfully!');
            },
            onError: (error) => {
                console.error("Booking failed", error);
                const msg = error.response?.data?.message || error.response?.data || "Failed to book item.";
                window.alert(`Error: ${msg}`);
            }
        });
    };

    if (!isOpen || !item) return null;

    const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
    const minutes = ["00", "15", "30", "45"];

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ padding: '28px', maxWidth: '480px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Confirm Reservation</h2>
                    <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary-color)' }}>₹{item.price}<span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'normal' }}> / day</span></span>
                </div>
                
                {dateError && (
                    <div style={{
                        color: '#ef4444',
                        padding: '10px 14px',
                        backgroundColor: '#fee2e2',
                        borderRadius: '10px',
                        fontSize: '0.85rem',
                        marginBottom: '16px',
                        fontWeight: '600',
                        border: '1px solid #fca5a5'
                    }}>
                        ⚠️ {dateError}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)}>
                    {/* Booking Dates Input Box */}
                    <div style={{ marginBottom: '20px', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                        <div style={{ padding: '12px 16px', backgroundColor: '#fff' }}>
                            <label style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)' }}>CHECK-IN DATE</label>
                            <input 
                                type="date" 
                                min={todayStr}
                                style={{ width: '100%', border: 'none', outline: 'none', marginTop: '4px', fontSize: '0.95rem', fontWeight: '500', fontFamily: 'inherit' }} 
                                disabled={isSubmitting}
                                {...register('startDay')}
                            />
                            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                                <select style={{ border: 'none', background: 'transparent', fontSize: '0.8rem', outline: 'none' }} disabled={isSubmitting} {...register('startHour')}>{hours.map(h => <option key={h} value={h}>{h}</option>)}</select>
                                <select style={{ border: 'none', background: 'transparent', fontSize: '0.8rem', outline: 'none' }} disabled={isSubmitting} {...register('startMin')}>{minutes.map(m => <option key={m} value={m}>{m}</option>)}</select>
                                <select style={{ border: 'none', background: 'transparent', fontSize: '0.8rem', outline: 'none' }} disabled={isSubmitting} {...register('startAmPm')}><option>AM</option><option>PM</option></select>
                            </div>
                        </div>
                        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)', backgroundColor: '#fff' }}>
                            <label style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)' }}>CHECK-OUT DATE</label>
                            <input 
                                type="date" 
                                min={startDay || todayStr}
                                style={{ width: '100%', border: 'none', outline: 'none', marginTop: '4px', fontSize: '0.95rem', fontWeight: '500', fontFamily: 'inherit' }} 
                                disabled={isSubmitting}
                                {...register('endDay')}
                            />
                            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                                <select style={{ border: 'none', background: 'transparent', fontSize: '0.8rem', outline: 'none' }} disabled={isSubmitting} {...register('endHour')}>{hours.map(h => <option key={h} value={h}>{h}</option>)}</select>
                                <select style={{ border: 'none', background: 'transparent', fontSize: '0.8rem', outline: 'none' }} disabled={isSubmitting} {...register('endMin')}>{minutes.map(m => <option key={m} value={m}>{m}</option>)}</select>
                                <select style={{ border: 'none', background: 'transparent', fontSize: '0.8rem', outline: 'none' }} disabled={isSubmitting} {...register('endAmPm')}><option>AM</option><option>PM</option></select>
                            </div>
                        </div>
                    </div>

                    {/* Receipt Breakdown Card */}
                    {!dateError && days > 0 && (
                        <div style={{ marginBottom: '24px', backgroundColor: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                            <h4 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>Fee Breakdown</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>₹{item.price} × {days} days</span>
                                    <span style={{ fontWeight: '500' }}>₹{days * (item.price || 0)}</span>
                                </div>
                                {weeklyDiscount > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', fontWeight: '600' }}>
                                        <span>Weekly Discount</span>
                                        <span>-₹{weeklyDiscount}</span>
                                    </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Service Fee (5%)</span>
                                    <span style={{ fontWeight: '500' }}>₹{serviceFee}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Refundable Deposit</span>
                                    <span style={{ fontWeight: '500' }}>₹{securityDeposit}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Local Tax (18% GST)</span>
                                    <span style={{ fontWeight: '500' }}>₹{tax}</span>
                                </div>
                                <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '4px 0' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '1.05rem', color: 'var(--secondary-color)' }}>
                                    <span>Grand Total</span>
                                    <span>₹{grandTotal}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <button 
                        type="submit" 
                        className="btn-primary" 
                        style={{ width: '100%', borderRadius: '10px', fontSize: '15px', padding: '14px', opacity: (isSubmitting || !!dateError) ? 0.6 : 1 }}
                        disabled={isSubmitting || !!dateError}
                    >
                        {isSubmitting ? 'Submitting Request...' : 'Confirm & Reserve'}
                    </button>
                    {item.owner?.email && (
                        <button 
                            type="button" 
                            onClick={handleMessageHost} 
                            style={{ 
                                width: '100%', 
                                background: '#f1f5f9', 
                                border: '1px solid var(--border-color)', 
                                borderRadius: '10px', 
                                marginTop: '12px', 
                                color: 'var(--secondary-color)', 
                                padding: '10px', 
                                cursor: 'pointer', 
                                fontSize: '0.85rem', 
                                fontWeight: '700' 
                            }}
                        >
                            💬 Message Host
                        </button>
                    )}
                    <button 
                        type="button" 
                        onClick={onClose} 
                        style={{ width: '100%', background: 'none', border: 'none', marginTop: '14px', color: 'var(--text-muted)', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.85rem' }}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                </form>
            </div>
        </div>
    );
};

export default RentModal;
