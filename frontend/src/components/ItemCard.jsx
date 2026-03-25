import React from 'react';

const ItemCard = ({ item, onRentClick }) => {
    const formatAvailability = (dateStr) => {
        if (!dateStr) return "Available Now";
        const date = new Date(dateStr);
        const now = new Date();

        if (date <= now) return "Available Now";

        return `Available from ${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • ${date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    };

    return (
        <div className="item-card" onClick={() => onRentClick(item)}>
            <img
                className="card-image"
                src={item.hasImage ? `http://localhost:8152/items/image/${item.id}` : (item.imageUrl || 'https://images.unsplash.com/photo-1580587771525-78b9dba3b91d?w=500')}
                alt={item.name}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600' }}>
                <span>{item.name}</span>
                <div>
                    <span>₹{item.price}</span>
                    <span style={{ fontWeight: '400', color: '#717171' }}> day</span>
                </div>
            </div>
            <div style={{ color: '#717171', fontSize: '14px', marginTop: '4px' }}>
                {item.owner ? item.owner.address || "Nearby" : "Nearby"}
            </div>
            <div style={{
                marginTop: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: item.nextAvailableDate && new Date(item.nextAvailableDate) > new Date() ? '#E31C5F' : '#2f8d46'
            }}>
                {formatAvailability(item.nextAvailableDate)}
            </div>
        </div>
    );
};

export default ItemCard;
