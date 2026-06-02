import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ItemCard from './ItemCard';

// Mock listingService
vi.mock('../../../services/listingService', () => ({
  listingService: {
    getImageUrl: vi.fn((id) => `http://mocked-url/image-${id}.png`),
  }
}));

describe('ItemCard Component', () => {
  const mockItem = {
    id: 1,
    name: 'DSLR Camera',
    price: 500,
    category: 'Electronics',
    imageUrl: 'http://custom-image.png',
    hasImage: false,
    owner: {
      email: 'owner@gmail.com',
      address: 'Indiranagar, Bangalore'
    },
    nextAvailableDate: null
  };

  const mockRentClick = vi.fn();
  const mockWishlistToggle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders item details correctly', () => {
    render(
      <ItemCard 
        item={mockItem} 
        onRentClick={mockRentClick} 
        isWishlisted={false} 
        onWishlistToggle={mockWishlistToggle} 
      />
    );

    expect(screen.getByText('DSLR Camera')).toBeInTheDocument();
    expect(screen.getByText('₹500')).toBeInTheDocument();
    expect(screen.getByText('📍 Indiranagar, Bangalore')).toBeInTheDocument();
    expect(screen.getByText('Lent by owner')).toBeInTheDocument();
    expect(screen.getByText('Available Now')).toBeInTheDocument();
  });

  it('calls onRentClick when the card is clicked', () => {
    render(
      <ItemCard 
        item={mockItem} 
        onRentClick={mockRentClick} 
        isWishlisted={false} 
        onWishlistToggle={mockWishlistToggle} 
      />
    );

    fireEvent.click(screen.getByText('DSLR Camera'));
    expect(mockRentClick).toHaveBeenCalledWith(mockItem);
  });

  it('calls onWishlistToggle when the wishlist button is clicked', () => {
    render(
      <ItemCard 
        item={mockItem} 
        onRentClick={mockRentClick} 
        isWishlisted={false} 
        onWishlistToggle={mockWishlistToggle} 
      />
    );

    const wishlistBtn = screen.getByRole('button', { name: '' }); // SVG only button
    fireEvent.click(wishlistBtn);
    expect(mockWishlistToggle).toHaveBeenCalledWith(mockItem.id);
  });

  it('cycles images on carousel next button click', () => {
    // Modify item name to not match specific product carousels to test standard categories
    const customItem = { ...mockItem, name: 'Generic Item' };
    render(
      <ItemCard 
        item={customItem} 
        onRentClick={mockRentClick} 
        isWishlisted={false} 
        onWishlistToggle={mockWishlistToggle} 
      />
    );

    const img = screen.getByRole('img', { name: 'Generic Item' });
    const originalSrc = img.getAttribute('src');

    // Click next button
    const nextBtn = screen.getByText('›');
    fireEvent.click(nextBtn);

    const newSrc = img.getAttribute('src');
    expect(newSrc).not.toBe(originalSrc);
  });
});
