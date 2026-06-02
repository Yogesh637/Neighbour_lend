import React, { useState } from 'react';
import { useAuth } from '../../store/authStore';
import Navbar from '../../components/Navbar';
import CategoryBar from '../../features/listings/components/CategoryBar';
import ItemCard from '../../features/listings/components/ItemCard';
import AddItemModal from '../../features/listings/components/AddItemModal';
import RentModal from '../../features/bookings/components/RentModal';
import { useListingsQuery, useWishlistQuery, useToggleWishlistMutation } from '../../features/listings/hooks/useListings';

const Dashboard = () => {
    const { user } = useAuth();
    const [showAddModal, setShowAddModal] = useState(false);
    const [showRentModal, setShowRentModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    
    // Core Search & Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [category, setCategory] = useState('All');
    const [sortBy, setSortBy] = useState('newest');
    const [page, setPage] = useState(0);

    const handleCategoryChange = (newCat) => {
        setCategory(newCat);
        setPage(0);
    };

    const handleSearchChange = (val) => {
        setSearchQuery(val);
        setPage(0);
    };
    
    // Advanced Filter states
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [onlyAvailable, setOnlyAvailable] = useState('all'); // 'all', 'available', 'booked'

    // Map View state
    const [showMap, setShowMap] = useState(false);

    const { data: pagedData, isLoading } = useListingsQuery({
        page,
        size: 12,
        category: category,
        search: searchQuery
    });
    const items = pagedData?.content || [];

    const { data: wishlist = [] } = useWishlistQuery();
    const toggleWishlistMutation = useToggleWishlistMutation();

    const handleWishlistToggle = (itemId) => {
        toggleWishlistMutation.mutate(itemId);
    };

    const categories = [
        { name: "All", icon: "🏠" },
        { name: "Tools", icon: "🛠️" },
        { name: "Electronics", icon: "💻" },
        { name: "Furniture", icon: "🪑" },
        { name: "Vehicles", icon: "🚲" },
        { name: "Sports", icon: "⚽" },
        { name: "Books", icon: "📚" },
        { name: "Camping Gear", icon: "⛺" },
        { name: "Kitchen", icon: "🍳" },
        { name: "Instruments", icon: "🎸" },
        { name: "Other", icon: "📦" }
    ];

    // Filter and Sort implementation (category and search are already filtered by server-side pagination)
    const filteredItems = items.filter(item => {
        const priceVal = item.price || 0;
        const matchesMinPrice = minPrice === '' || priceVal >= parseFloat(minPrice);
        const matchesMaxPrice = maxPrice === '' || priceVal <= parseFloat(maxPrice);

        const isBooked = item.nextAvailableDate && new Date(item.nextAvailableDate) > new Date();
        const matchesAvailability = onlyAvailable === 'all' || 
            (onlyAvailable === 'available' && !isBooked) ||
            (onlyAvailable === 'booked' && isBooked);

        return matchesMinPrice && matchesMaxPrice && matchesAvailability;
    }).sort((a, b) => {
        if (sortBy === 'price_low') return (a.price || 0) - (b.price || 0);
        if (sortBy === 'price_high') return (b.price || 0) - (a.price || 0);
        if (sortBy === 'alpha_asc') return a.name.localeCompare(b.name);
        if (sortBy === 'alpha_desc') return b.name.localeCompare(a.name);
        return b.id - a.id;
    });

    // Segment items into Trending and Recommended
    const trendingItems = filteredItems.filter(item => item.id % 2 === 0).slice(0, 3);
    const recommendedItems = filteredItems.filter(item => item.id % 2 !== 0);

    const openRentModal = (item) => {
        setSelectedItem(item);
        setShowRentModal(true);
    };

    const handleClearFilters = () => {
        setMinPrice('');
        setMaxPrice('');
        setOnlyAvailable('all');
    };

    // Coordinates for simulated map pins
    const simulatedPins = filteredItems.map((item, index) => {
        // Deterministic mock positions in a bounding box
        const x = 15 + ((item.id * 19) % 70);
        const y = 20 + ((item.id * 23) % 65);
        return { item, x, y };
    });

    return (
        <>
            <Navbar />

            {/* Premium Category Bar */}
            <CategoryBar
                categories={categories}
                selectedCategory={category}
                onCategoryChange={handleCategoryChange}
            />

            <div className="dashboard-container" style={{ paddingTop: '180px' }}>
                <div className="hero-gradient-overlay" />

                {/* Hero Headers */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h1 style={{ fontSize: '3.2rem', fontWeight: '800', lineHeight: '1.1', color: 'var(--secondary-color)', marginBottom: '12px' }}>
                        Rent anything. <span style={{ color: 'var(--primary-color)' }}>Locally.</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.25rem', fontWeight: '400', maxWidth: '580px', margin: '0 auto' }}>
                        Instantly access tools, gear, electronics, and vehicles from trusted neighbours right in your community.
                    </p>
                </div>

                {/* Unified Search Experience */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
                    <div className="search-bar-container">
                        <div style={{ flex: 1.5, borderRight: '1px solid var(--border-color)', paddingRight: '16px', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-dark)', marginBottom: '2px' }}>Search Gear</div>
                            <input
                                placeholder="What do you need today?"
                                value={searchQuery}
                                onChange={e => handleSearchChange(e.target.value)}
                                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', width: '100%', color: 'var(--text-dark)', padding: '0', fontWeight: '500' }}
                            />
                        </div>
                        <div style={{ flex: 1, borderRight: '1px solid var(--border-color)', paddingLeft: '20px', paddingRight: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-dark)', marginBottom: '2px' }}>Category</div>
                            <div style={{ fontSize: '14px', color: 'var(--primary-color)', fontWeight: '600' }}>{category === 'All' ? 'All categories' : category}</div>
                        </div>
                        <div style={{ flex: 1, paddingLeft: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-dark)', marginBottom: '2px' }}>Sort By</div>
                            <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', color: 'var(--text-muted)', width: '100%', cursor: 'pointer', padding: 0, fontWeight: '500' }}
                            >
                                <option value="newest">Newest First</option>
                                <option value="price_low">Price: Low to High</option>
                                <option value="price_high">Price: High to Low</option>
                                <option value="alpha_asc">Alphabetical: A-Z</option>
                                <option value="alpha_desc">Alphabetical: Z-A</option>
                            </select>
                        </div>
                        <button className="search-button">🔍</button>
                    </div>

                    {/* Filter and Map toggles */}
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button 
                            className="btn-secondary" 
                            style={{ borderRadius: '24px', padding: '10px 20px', fontSize: '0.85rem' }}
                            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                        >
                            ⚙️ {showAdvancedFilters ? 'Hide Filters' : 'Filters'}
                            {(minPrice || maxPrice || onlyAvailable !== 'all') && ' • 🔴'}
                        </button>
                        <button 
                            className="btn-secondary"
                            style={{ borderRadius: '24px', padding: '10px 20px', fontSize: '0.85rem', backgroundColor: showMap ? 'var(--secondary-color)' : '', color: showMap ? 'white' : '' }}
                            onClick={() => setShowMap(!showMap)}
                        >
                            🗺️ {showMap ? 'Show Grid View' : 'Show Map View'}
                        </button>
                    </div>
                </div>

                {/* Expandable Advanced Filters Panel */}
                {showAdvancedFilters && (
                    <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', maxWidth: '820px', margin: '0 auto 32px auto', border: '1px solid var(--border-color)', animation: 'fadeIn 0.25s ease-out' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                            <div>
                                <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Min Price (₹)</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={minPrice}
                                    onChange={e => setMinPrice(e.target.value)}
                                    className="input-field"
                                    style={{ marginBottom: 0, padding: '10px 14px' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Max Price (₹)</label>
                                <input
                                    type="number"
                                    placeholder="Any"
                                    value={maxPrice}
                                    onChange={e => setMaxPrice(e.target.value)}
                                    className="input-field"
                                    style={{ marginBottom: 0, padding: '10px 14px' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Availability</label>
                                <select
                                    value={onlyAvailable}
                                    onChange={e => setOnlyAvailable(e.target.value)}
                                    className="input-field"
                                    style={{ marginBottom: 0, padding: '10px 14px' }}
                                >
                                    <option value="all">All Items</option>
                                    <option value="available">Available Now Only</option>
                                    <option value="booked">Currently Booked Only</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                            <button className="btn-secondary" style={{ border: 'none', padding: '8px 16px', fontSize: '0.8rem' }} onClick={handleClearFilters}>Clear All</button>
                            <button className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.8rem', minHeight: 'auto' }} onClick={() => setShowAdvancedFilters(false)}>Apply Filters</button>
                        </div>
                    </div>
                )}

                {/* Host button */}
                {user && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                        <h2 style={{ fontSize: '22px', fontWeight: '700' }}>Explore Local Rentals</h2>
                        <button className="btn-primary" onClick={() => setShowAddModal(true)} style={{ borderRadius: '24px', fontSize: '0.85rem', padding: '10px 20px' }}>
                            + Host your gear
                        </button>
                    </div>
                )}

                {/* Main Content Area */}
                {isLoading ? (
                    /* Skeleton Loader Grid */
                    <div className="item-grid">
                        {Array.from({ length: 6 }).map((_, idx) => (
                            <div key={idx} className="item-card" style={{ opacity: 0.8, cursor: 'default' }}>
                                <div className="shimmer" style={{ height: '200px', borderRadius: '12px', marginBottom: '12px' }}></div>
                                <div className="shimmer" style={{ height: '18px', width: '50%', borderRadius: '4px', marginBottom: '8px' }}></div>
                                <div className="shimmer" style={{ height: '22px', width: '75%', borderRadius: '4px', marginBottom: '12px' }}></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto' }}>
                                    <div className="shimmer" style={{ height: '24px', width: '35%', borderRadius: '4px' }}></div>
                                    <div className="shimmer" style={{ height: '18px', width: '25%', borderRadius: '50px' }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', border: '1.5px dashed var(--border-color)', borderRadius: '16px', background: '#fff' }}>
                        <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>🔍</span>
                        <h3>No items found matching your criteria.</h3>
                        <p style={{ marginTop: '4px' }}>Try clearing filters or adjusting your search phrase.</p>
                    </div>
                ) : showMap ? (
                    /* Interactive Map Split Screen Layout */
                    <div className="marketplace-map-layout" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                        {/* Left listings scroll */}
                        <div style={{ overflowY: 'auto', paddingRight: '8px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px', height: '100%' }}>
                            {filteredItems.map(item => (
                                <ItemCard
                                    key={item.id}
                                    item={item}
                                    onRentClick={openRentModal}
                                    isWishlisted={wishlist.some(w => w.id === item.id)}
                                    onWishlistToggle={handleWishlistToggle}
                                />
                            ))}
                        </div>

                        {/* Right interactive simulated map */}
                        <div className="glass-panel" style={{ position: 'relative', height: '100%', borderRadius: '16px', overflow: 'hidden', background: '#e2e8f0', border: '1px solid var(--border-color)' }}>
                            {/* Mock Map Vector Grid */}
                            <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                                <rect width="100%" height="100%" fill="#e6ebd8" />
                                {/* Blue river */}
                                <path d="M-50 450 Q 150 480, 250 300 T 600 200" fill="none" stroke="#a5dbf7" strokeWidth="60" opacity="0.8" />
                                {/* Green parks */}
                                <rect x="50" y="50" width="120" height="90" rx="20" fill="#c3ebc2" opacity="0.9" />
                                <rect x="350" y="400" width="160" height="130" rx="30" fill="#c3ebc2" opacity="0.9" />
                                {/* Street Grid lines */}
                                <line x1="80" y1="0" x2="80" y2="600" stroke="#fff" strokeWidth="6" />
                                <line x1="280" y1="0" x2="280" y2="600" stroke="#fff" strokeWidth="8" />
                                <line x1="480" y1="0" x2="480" y2="600" stroke="#fff" strokeWidth="6" />
                                <line x1="0" y1="180" x2="600" y2="180" stroke="#fff" strokeWidth="8" />
                                <line x1="0" y1="380" x2="600" y2="380" stroke="#fff" strokeWidth="6" />
                            </svg>

                            {/* Interactive Pins */}
                            {simulatedPins.map(({ item, x, y }) => (
                                <div
                                    key={item.id}
                                    style={{
                                        position: 'absolute',
                                        left: `${x}%`,
                                        top: `${y}%`,
                                        transform: 'translate(-50%, -50%)',
                                        cursor: 'pointer',
                                        zIndex: 50
                                    }}
                                    onClick={() => openRentModal(item)}
                                >
                                    <div style={{
                                        backgroundColor: '#ffffff',
                                        color: '#1e293b',
                                        padding: '4px 10px',
                                        borderRadius: '20px',
                                        fontWeight: '800',
                                        fontSize: '0.8rem',
                                        boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                                        border: '1.5px solid var(--primary-color)',
                                        whiteSpace: 'nowrap',
                                        transition: 'all 0.2s ease'
                                    }}
                                    className="map-pin-hover"
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'scale(1.1)';
                                        e.currentTarget.style.backgroundColor = 'var(--primary-color)';
                                        e.currentTarget.style.color = '#ffffff';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'scale(1)';
                                        e.currentTarget.style.backgroundColor = '#ffffff';
                                        e.currentTarget.style.color = '#1e293b';
                                    }}
                                    >
                                        ₹{item.price}
                                    </div>
                                    <div style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        backgroundColor: 'var(--primary-color)',
                                        margin: '2px auto 0 auto',
                                        boxShadow: '0 0 6px rgba(255, 56, 92, 0.8)'
                                    }} />
                                </div>
                            ))}

                            {/* Info overlay */}
                            <div style={{ position: 'absolute', bottom: '15px', left: '15px', background: 'rgba(15,23,42,0.85)', color: 'white', padding: '8px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '500', backdropFilter: 'blur(4px)' }}>
                                Click on any price tag on the map to inspect item details.
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Standard Grid View with Trending & Recommended sections */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
                        
                        {/* Trending Section */}
                        {trendingItems.length > 0 && searchQuery === '' && (
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Trending Near You</h3>
                                    <span style={{ backgroundColor: '#ffe4e6', color: '#f43f5e', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700' }}>🔥 TOP RATED</span>
                                </div>
                                <div className="item-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                                    {trendingItems.map(item => (
                                        <ItemCard
                                            key={item.id}
                                            item={item}
                                            onRentClick={openRentModal}
                                            isWishlisted={wishlist.some(w => w.id === item.id)}
                                            onWishlistToggle={handleWishlistToggle}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recommended / All listings section */}
                        <div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '20px' }}>
                                {searchQuery !== '' ? 'Search Results' : 'Recommended Listings'}
                            </h3>
                            <div className="item-grid">
                                {(searchQuery !== '' ? filteredItems : recommendedItems).map(item => (
                                    <ItemCard
                                        key={item.id}
                                        item={item}
                                        onRentClick={openRentModal}
                                        isWishlisted={wishlist.some(w => w.id === item.id)}
                                        onWishlistToggle={handleWishlistToggle}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Pagination Controls */}
                {pagedData && pagedData.totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '40px', marginBottom: '20px' }}>
                        <button
                            className="btn-secondary"
                            disabled={page === 0}
                            onClick={() => setPage(prev => Math.max(0, prev - 1))}
                            style={{ padding: '8px 16px', opacity: page === 0 ? 0.5 : 1, cursor: page === 0 ? 'not-allowed' : 'pointer' }}
                        >
                            ← Previous
                        </button>
                        <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-dark)' }}>
                            Page {page + 1} of {pagedData.totalPages}
                        </span>
                        <button
                            className="btn-secondary"
                            disabled={pagedData.last}
                            onClick={() => setPage(prev => prev + 1)}
                            style={{ padding: '8px 16px', opacity: pagedData.last ? 0.5 : 1, cursor: pagedData.last ? 'not-allowed' : 'pointer' }}
                        >
                            Next →
                        </button>
                    </div>
                )}
            </div>

            {/* Modals */}
            <AddItemModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={() => setShowAddModal(false)}
                categories={categories}
            />

            <RentModal
                isOpen={showRentModal}
                item={selectedItem}
                onClose={() => setShowRentModal(false)}
                onSuccess={() => setShowRentModal(false)}
            />
        </>
    );
};

export default Dashboard;
