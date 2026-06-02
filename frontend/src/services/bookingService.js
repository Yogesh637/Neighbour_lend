import axiosClient from '../api/axiosClient';

export const bookingService = {
  getMyBookings: async (params = {}) => {
    const response = await axiosClient.get('/bookings/my', { params });
    return response.data;
  },
  getBookingRequests: async (params = {}) => {
    const response = await axiosClient.get('/bookings/requests', { params });
    return response.data;
  },
  createBooking: async (bookingData) => {
    const response = await axiosClient.post('/bookings', bookingData);
    return response.data;
  },
  updateBookingStatus: async (id, status) => {
    const response = await axiosClient.put(`/bookings/${id}/status?status=${status}`);
    return response.data;
  }
};
