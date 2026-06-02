import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { listingSchema } from '../listingSchemas';
import { useCreateListingMutation } from '../hooks/useListings';

const AddItemModal = ({ isOpen, onClose, onSuccess, categories }) => {
    const [imageFile, setImageFile] = useState(null);
    const createListingMutation = useCreateListingMutation();
    const isSubmitting = createListingMutation.isPending;

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: zodResolver(listingSchema),
        defaultValues: {
            name: '',
            description: '',
            price: '',
            imageUrl: '',
            category: 'Tools',
        }
    });

    const onSubmit = (data) => {
        const formData = new FormData();
        const itemData = {
            name: data.name,
            description: data.description,
            price: parseFloat(data.price),
            category: data.category,
            available: true,
            imageUrl: data.imageUrl
        };

        const itemBlob = new Blob([JSON.stringify(itemData)], { type: "application/json" });
        formData.append('item', itemBlob);
        if (imageFile) formData.append('image', imageFile);

        createListingMutation.mutate(formData, {
            onSuccess: () => {
                reset();
                setImageFile(null);
                onSuccess();
                window.alert('Item published successfully!');
            },
            onError: (error) => {
                console.error("Error adding item", error);
                const msg = error.response?.data?.message || "Failed to post item.";
                window.alert(`Error: ${msg}`);
            }
        });
    };

    const handleClose = () => {
        reset();
        setImageFile(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content modal-content-wide">
                <h3 style={{ fontSize: '24px', marginBottom: '24px' }}>Lend an Item</h3>
                <form onSubmit={handleSubmit(onSubmit)} className="add-item-form-grid">
                    
                    <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>ITEM NAME</label>
                        <input 
                            placeholder="e.g. Cordless Drill" 
                            className="input-field" 
                            disabled={isSubmitting}
                            style={{ marginTop: '4px', marginBottom: '4px' }}
                            {...register('name')}
                        />
                        {errors.name && (
                            <p style={{ color: '#f87171', fontSize: '0.75rem', textAlign: 'left', margin: '0 0 0 4px' }}>
                                {errors.name.message}
                            </p>
                        )}
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>DESCRIPTION</label>
                        <textarea 
                            placeholder="Provide details about condition, usage instructions..." 
                            className="input-field" 
                            rows="3" 
                            disabled={isSubmitting}
                            style={{ marginTop: '4px', marginBottom: '4px' }}
                            {...register('description')}
                        />
                        {errors.description && (
                            <p style={{ color: '#f87171', fontSize: '0.75rem', textAlign: 'left', margin: '0 0 0 4px' }}>
                                {errors.description.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>PRICE PER DAY (₹)</label>
                        <input 
                            type="number" 
                            placeholder="Price per day" 
                            className="input-field" 
                            disabled={isSubmitting}
                            style={{ marginTop: '4px', marginBottom: '4px' }}
                            {...register('price')}
                        />
                        {errors.price && (
                            <p style={{ color: '#f87171', fontSize: '0.75rem', textAlign: 'left', margin: '0 0 0 4px' }}>
                                {errors.price.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>CATEGORY</label>
                        <select 
                            className="input-field" 
                            disabled={isSubmitting}
                            style={{ marginTop: '4px', marginBottom: '4px' }}
                            {...register('category')}
                        >
                            {categories.filter(c => c.name !== 'All').map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
                        </select>
                        {errors.category && (
                            <p style={{ color: '#f87171', fontSize: '0.75rem', textAlign: 'left', margin: '0 0 0 4px' }}>
                                {errors.category.message}
                            </p>
                        )}
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>IMAGE FILE</label>
                        <input 
                            type="file" 
                            className="input-field" 
                            accept="image/*" 
                            onChange={e => setImageFile(e.target.files[0])} 
                            disabled={isSubmitting}
                            style={{ marginTop: '4px', marginBottom: '10px' }}
                        />
                        
                        <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>OR IMAGE URL</label>
                        <input 
                            placeholder="https://example.com/image.jpg" 
                            className="input-field" 
                            disabled={isSubmitting}
                            style={{ marginTop: '4px', marginBottom: '4px' }}
                            {...register('imageUrl')}
                        />
                        {errors.imageUrl && (
                            <p style={{ color: '#f87171', fontSize: '0.75rem', textAlign: 'left', margin: '0 0 0 4px' }}>
                                {errors.imageUrl.message}
                            </p>
                        )}
                    </div>

                    <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                        <button type="button" onClick={handleClose} className="btn-secondary" style={{ border: 'none' }} disabled={isSubmitting}>Cancel</button>
                        <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ opacity: isSubmitting ? 0.6 : 1 }}>
                            {isSubmitting ? 'Posting...' : 'Post Item'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddItemModal;
