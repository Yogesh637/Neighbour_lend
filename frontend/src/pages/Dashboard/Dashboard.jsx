import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import CategoryBar from '../../components/CategoryBar';
import ItemCard from '../../components/ItemCard';
import AddItemModal from '../../components/AddItemModal';
import RentModal from '../../components/RentModal';
import api from '../../api/axios';

const Dashboard = () => {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showRentModal, setShowRentModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [category, setCategory] = useState('All');
    const [sortBy, setSortBy] = useState('newest');

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const response = await api.get('/items');
            setItems(response.data);
        } catch (error) {
            console.error("Error fetching items", error);
        }
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

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategory = category === 'All' || item.category === category;
        return matchesSearch && matchesCategory;
    }).sort((a, b) => {
        if (sortBy === 'price_low') return (a.price || 0) - (b.price || 0);
        if (sortBy === 'price_high') return (b.price || 0) - (a.price || 0);
        if (sortBy === 'alpha_asc') return a.name.localeCompare(b.name);
        if (sortBy === 'alpha_desc') return b.name.localeCompare(a.name);
        return b.id - a.id;
    });

    const openRentModal = (item) => {
        setSelectedItem(item);
        setShowRentModal(true);
    };

    return (
        <>
            <Navbar />

            <CategoryBar
                categories={categories}
                selectedCategory={category}
                onCategoryChange={setCategory}
            />

            <div className="dashboard-container" style={{ paddingTop: '220px' }}>
                {/* Search Bar */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '48px' }}>
                    <div className="search-bar-container">
                        <div style={{ flex: 1, borderRight: '1px solid #ddd', paddingRight: '16px', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: '#222', marginBottom: '2px' }}>Search</div>
                            <input
                                placeholder="Find something..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', width: '100%', color: '#222', padding: '0' }}
                            />
                        </div>
                        <div style={{ flex: 1, paddingLeft: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: '#222', marginBottom: '2px' }}>Filter</div>
                            <div style={{ fontSize: '14px', color: '#717171' }}>{category === 'All' ? 'All categories' : category}</div>
                        </div>
                        <button className="search-button">🔍</button>
                    </div>
                </div>

                {/* Post Item Action */}
                {user && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: '600' }}>NeighbourLend Experiences</h2>
                        <button className="btn-secondary" onClick={() => setShowAddModal(true)} style={{ borderRadius: '24px' }}>
                            Host your gear
                        </button>
                    </div>
                )}

                {/* Components */}
                <AddItemModal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => {
                        setShowAddModal(false);
                        fetchItems();
                    }}
                    categories={categories}
                />

                <RentModal
                    isOpen={showRentModal}
                    item={selectedItem}
                    onClose={() => setShowRentModal(false)}
                    onSuccess={() => {
                        setShowRentModal(false);
                        fetchItems();
                    }}
                />

                <div className="item-grid">
                    {filteredItems.map(item => (
                        <ItemCard
                            key={item.id}
                            item={item}
                            onRentClick={openRentModal}
                        />
                    ))}
                </div>
            </div>
        </>
    );
};

export default Dashboard;
