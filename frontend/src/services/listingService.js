import axiosClient from '../api/axiosClient';

export const listingService = {
  getListings: async (params = {}) => {
    const response = await axiosClient.get('/items', { params });
    return response.data;
  },
  createListing: async (formData) => {
    const response = await axiosClient.post('/items', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  toggleWishlist: async (itemId) => {
    const response = await axiosClient.post(`/wishlist/toggle/${itemId}`);
    return response.data;
  },
  getWishlist: async () => {
    const response = await axiosClient.get('/wishlist');
    return response.data;
  },
  getImageUrl: (itemId) => {
    return `${axiosClient.defaults.baseURL || 'http://localhost:8152'}/items/image/${itemId}`;
  }
};
