import React from 'react';

const CategoryBar = ({ categories, selectedCategory, onCategoryChange }) => {
    return (
        <div style={{ position: 'fixed', top: '80px', left: 0, right: 0, background: 'white', zIndex: 900, borderBottom: '1px solid #ebebeb' }}>
            <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 40px', display: 'flex', alignItems: 'center', gap: '32px', overflowX: 'auto', scrollbarWidth: 'none' }}>
                {categories.map(cat => (
                    <div
                        key={cat.name}
                        className={`category-item ${selectedCategory === cat.name ? 'active' : ''}`}
                        onClick={() => onCategoryChange(cat.name)}
                    >
                        <span className="category-icon">{cat.icon}</span>
                        <span>{cat.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CategoryBar;
