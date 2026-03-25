import React, { useState } from 'react';
import api from '../api/axios';

const AddItemModal = ({ isOpen, onClose, onSuccess, categories }) => {
    const [newItem, setNewItem] = useState({ name: '', description: '', available: true, price: '', imageUrl: '', category: 'Tools' });
    const [imageFile, setImageFile] = useState(null);

    const handleAddItemSubmit = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            const itemData = {
                name: newItem.name,
                description: newItem.description,
                price: newItem.price,
                category: newItem.category,
                available: true,
                imageUrl: newItem.imageUrl
            };

            const itemBlob = new Blob([JSON.stringify(itemData)], { type: "application/json" });
            formData.append('item', itemBlob);
            if (imageFile) formData.append('image', imageFile);

            await api.post('/items', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setNewItem({ name: '', description: '', available: true, price: '', imageUrl: '', category: 'Tools' });
            setImageFile(null);
            onSuccess();
            window.alert('Item published successfully!');
        } catch (error) {
            console.error("Error adding item", error);
            window.alert('Failed to post item.');
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000
        }}>
            <div className="glass-panel" style={{ padding: '30px', width: '600px', borderRadius: '24px' }}>
                <h3 style={{ fontSize: '24px', marginBottom: '24px' }}>Lend an Item</h3>
                <form onSubmit={handleAddItemSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <input placeholder="Item Name" className="input-field" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} required style={{ gridColumn: 'span 2' }} />
                    <textarea placeholder="Description" className="input-field" rows="3" value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} style={{ gridColumn: 'span 2' }} />
                    <input type="number" placeholder="Price per day" className="input-field" value={newItem.price} onChange={e => setNewItem({ ...newItem, price: e.target.value })} required />
                    <select className="input-field" value={newItem.category || 'Other'} onChange={e => setNewItem({ ...newItem, category: e.target.value })}>
                        {categories.filter(c => c.name !== 'All').map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
                    </select>
                    <div style={{ gridColumn: 'span 2' }}>
                        <input type="file" className="input-field" accept="image/*" onChange={e => setImageFile(e.target.files[0])} />
                        <input placeholder="Or Image URL" className="input-field" value={newItem.imageUrl} onChange={e => setNewItem({ ...newItem, imageUrl: e.target.value })} style={{ marginTop: '10px' }} />
                    </div>
                    <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        <button type="button" onClick={onClose} className="btn-secondary" style={{ border: 'none' }}>Cancel</button>
                        <button type="submit" className="btn-primary">Post Item</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddItemModal;
