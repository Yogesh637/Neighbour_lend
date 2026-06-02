import axiosClient from '../api/axiosClient';

export const reviewService = {
  createReview: async (reviewData) => {
    const response = await axiosClient.post('/reviews', reviewData);
    return response.data;
  },
  getItemReviews: async (itemId) => {
    const response = await axiosClient.get(`/reviews/item/${itemId}`);
    return response.data;
  }
};
