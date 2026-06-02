import React, { useState, useEffect } from 'react';
import { listingService } from '../../../services/listingService';

// Premium category-specific stock image fallbacks to cycle through in the carousel
const CATEGORY_STOCK_IMAGES = {
  Tools: [
    'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1581147036324-c17da42efec2?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1534224039826-c7a0dea0e66a?w=500&auto=format&fit=crop&q=60',
  ],
  Electronics: [
    'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1527689368864-3a821dbccc34?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&auto=format&fit=crop&q=60',
  ],
  Furniture: [
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=500&auto=format&fit=crop&q=60',
  ],
  Vehicles: [
    'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?w=500&auto=format&fit=crop&q=60',
  ],
  CampingGear: [
    'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=500&auto=format&fit=crop&q=60',
  ],
  Other: [
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b91d?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=500&auto=format&fit=crop&q=60',
  ],
};

// Exact product-specific matching carousels containing AI-generated paths and premium browser photos
const PRODUCT_SPECIFIC_CAROUSELS = {
  camera: [
    '/images/dslr_camera.png', // AI generated
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=500&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1519741497674-611481863552?w=500&auto=format&fit=crop&q=80'
  ],
  bike: [
    '/images/mountain_bike.png', // AI generated
    'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=500&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507582020474-9a35b7d455d5?w=500&auto=format&fit=crop&q=80'
  ],
  vr: [
    '/images/vr_headset.png', // AI generated
    'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=500&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?w=500&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=500&auto=format&fit=crop&q=80'
  ],
  guitar: [
    '/images/electric_guitar.png', // AI generated
    'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=500&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1550985616-10810253b84d?w=500&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1525201548982-be467cae8665?w=500&auto=format&fit=crop&q=80'
  ],
  tent: [
    'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=500&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=500&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=500&auto=format&fit=crop&q=80'
  ],
  washer: [
    'https://images.unsplash.com/photo-1581147036324-c17da42efec2?w=500&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1621905252507-b354bc25edac?w=500&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=500&auto=format&fit=crop&q=80'
  ],
  espresso: [
    'https://images.unsplash.com/photo-1498804103079-a6351b050096?w=500&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1579888944880-d983411488c5?w=500&auto=format&fit=crop&q=80'
  ],
  kayak: [
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=500&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500305886407-b74bfdee6566?w=500&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1470246973918-29a93221c455?w=500&auto=format&fit=crop&q=80'
  ]
};

const ItemCard = ({ item, onRentClick, isWishlisted: propWishlisted, onWishlistToggle }) => {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [localWishlisted, setLocalWishlisted] = useState(false);

  // Initialize wishlist state from local storage fallback
  useEffect(() => {
    if (propWishlisted === undefined) {
      try {
        const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        setLocalWishlisted(wishlist.includes(item.id));
      } catch (e) {
        console.error('Error reading wishlist from localStorage', e);
      }
    }
  }, [item.id, propWishlisted]);

  const isWishlisted = propWishlisted !== undefined ? propWishlisted : localWishlisted;

  const toggleWishlist = (e) => {
    e.stopPropagation();
    if (onWishlistToggle) {
      onWishlistToggle(item.id);
      return;
    }
    try {
      const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
      let updatedWishlist;
      if (wishlist.includes(item.id)) {
        updatedWishlist = wishlist.filter(id => id !== item.id);
        setLocalWishlisted(false);
      } else {
        updatedWishlist = [...wishlist, item.id];
        setLocalWishlisted(true);
      }
      localStorage.setItem('wishlist', JSON.stringify(updatedWishlist));
    } catch (err) {
      console.error('Error updating wishlist', err);
    }
  };

  // Compile image list for the carousel
  const getItemSpecificCarousel = () => {
    const primaryImage = item.hasImage
      ? listingService.getImageUrl(item.id)
      : (item.imageUrl || 'https://images.unsplash.com/photo-1580587771525-78b9dba3b91d?w=500');

    const cleanCategory = item.category || 'Other';
    const categoryKey = CATEGORY_STOCK_IMAGES[cleanCategory] ? cleanCategory : 'Other';
    
    // Check if we have a specific product carousel for additional images
    const itemName = (item.name || '').toLowerCase();
    let productCarousels = [];
    if (itemName.includes('camera') || itemName.includes('dslr')) {
      productCarousels = PRODUCT_SPECIFIC_CAROUSELS.camera;
    } else if (itemName.includes('bike') || itemName.includes('bicycle')) {
      productCarousels = PRODUCT_SPECIFIC_CAROUSELS.bike;
    } else if (itemName.includes('vr') || itemName.includes('headset')) {
      productCarousels = PRODUCT_SPECIFIC_CAROUSELS.vr;
    } else if (itemName.includes('guitar') || itemName.includes('instrument')) {
      productCarousels = PRODUCT_SPECIFIC_CAROUSELS.guitar;
    } else if (itemName.includes('tent') || itemName.includes('camp')) {
      productCarousels = PRODUCT_SPECIFIC_CAROUSELS.tent;
    } else if (itemName.includes('washer') || itemName.includes('pressure')) {
      productCarousels = PRODUCT_SPECIFIC_CAROUSELS.washer;
    } else if (itemName.includes('espresso') || itemName.includes('coffee') || itemName.includes('machine')) {
      productCarousels = PRODUCT_SPECIFIC_CAROUSELS.espresso;
    } else if (itemName.includes('kayak') || itemName.includes('inflatable')) {
      productCarousels = PRODUCT_SPECIFIC_CAROUSELS.kayak;
    }

    // Filter out old mock paths starting with /images/
    const additionalImages = productCarousels.filter(img => !img.startsWith('/images/'));

    return [primaryImage, ...additionalImages, ...CATEGORY_STOCK_IMAGES[categoryKey]];
  };

  const carouselImages = getItemSpecificCarousel();

  const handleNextImage = (e) => {
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev + 1) % carouselImages.length);
  };

  const handlePrevImage = (e) => {
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
  };

  // Format date helper
  const formatAvailability = (dateStr) => {
    if (!dateStr) return "Available Now";
    const date = new Date(dateStr);
    const now = new Date();
    if (date <= now) return "Available Now";

    return `Available ${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
  };

  // Consistent simulated ratings and reviews based on item ID
  const simulatedRating = (4.4 + (item.id % 7) * 0.1).toFixed(1);
  const simulatedReviewsCount = ((item.id * 17) % 40) + 4;

  const isBooked = item.nextAvailableDate && new Date(item.nextAvailableDate) > new Date();

  return (
    <div className="item-card" onClick={() => onRentClick(item)}>
      {/* Wishlist Button */}
      <button className="wishlist-btn" onClick={toggleWishlist}>
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill={isWishlisted ? '#ff385c' : 'rgba(0,0,0,0.35)'}
          stroke={isWishlisted ? 'none' : '#ffffff'}
          strokeWidth="2.5"
          style={{ transition: 'all 0.25s ease' }}
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </button>

      {/* Image Carousel Container */}
      <div style={{ position: 'relative', width: '100%', height: '200px', borderRadius: '12px', overflow: 'hidden', marginBottom: '12px' }}>
        <img
          className="card-image"
          src={carouselImages[currentImgIndex]}
          alt={item.name}
          loading="lazy"
          width="360"
          height="200"
          style={{ width: '100%', height: '100%', objectFit: 'cover', margin: 0 }}
        />
        
        {/* Navigation Arrows */}
        <div style={{ position: 'absolute', top: '50%', left: '10px', transform: 'translateY(-50%)', display: 'flex', width: 'calc(100% - 20px)', justifyContent: 'space-between', pointerEvents: 'none' }}>
          <button className="carousel-btn" style={{ pointerEvents: 'auto' }} onClick={handlePrevImage}>
            ‹
          </button>
          <button className="carousel-btn" style={{ pointerEvents: 'auto' }} onClick={handleNextImage}>
            ›
          </button>
        </div>

        {/* Indicator dots */}
        <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '4px', zIndex: 10 }}>
          {carouselImages.map((_, i) => (
            <div
              key={i}
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: currentImgIndex === i ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
                transition: 'background-color 0.2s'
              }}
            />
          ))}
        </div>
      </div>

      {/* Card Info Section */}
      <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, gap: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Location badge */}
          <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
            📍 {item.city ? `${item.city}, ${item.state}` : (item.owner?.address || 'Nearby')}
          </span>
          {/* Rating */}
          <span style={{ fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '3px' }}>
            ⭐ {simulatedRating} <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>({simulatedReviewsCount})</span>
          </span>
        </div>

        {/* Category Badge & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
          <span style={{
            fontSize: '0.65rem',
            fontWeight: '800',
            textTransform: 'uppercase',
            backgroundColor: 'var(--border-color, #f1f5f9)',
            color: 'var(--text-muted, #64748b)',
            padding: '2px 6px',
            borderRadius: '4px',
            letterSpacing: '0.3px'
          }}>
            {item.category}
          </span>
        </div>

        <h3 style={{ fontSize: '1.05rem', fontWeight: '600', margin: '4px 0', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          {item.name}
        </h3>

        {/* Owner details */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
          <img
            src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(item.owner?.email || 'owner')}&backgroundColor=f43f5e,6366f1,3b82f6,10b981`}
            alt="Owner avatar"
            style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-color)' }}
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Lent by {item.ownerName || item.owner?.email?.split('@')[0] || 'Neighbour'}
          </span>
        </div>

        {/* Deposit & Weekly Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0', padding: '4px 0', borderTop: '1px dashed #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Security Deposit:</span>
            <span style={{ fontWeight: '600', color: 'var(--text-dark, #1e293b)' }}>₹{item.securityDeposit || Math.round((item.price || 0) * 0.10)}</span>
          </div>
          {item.weeklyRate && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Weekly Rate:</span>
              <span style={{ fontWeight: '600', color: 'var(--text-dark, #1e293b)' }}>₹{item.weeklyRate}</span>
            </div>
          )}
        </div>

        {/* Pricing & Availability */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
          <div>
            <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--secondary-color)' }}>₹{item.price}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}> / day</span>
          </div>

          <span style={{
            padding: '3px 8px',
            borderRadius: '50px',
            fontSize: '0.7rem',
            fontWeight: '700',
            backgroundColor: isBooked ? '#fee2e2' : '#d1fae5',
            color: isBooked ? '#ef4444' : '#10b981',
            textTransform: 'uppercase',
            letterSpacing: '0.3px'
          }}>
            {formatAvailability(item.nextAvailableDate)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ItemCard;
