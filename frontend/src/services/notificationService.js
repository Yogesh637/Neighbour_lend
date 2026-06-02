import axiosClient from '../api/axiosClient';

export const notificationService = {
  getNotifications: async (params = {}) => {
    const response = await axiosClient.get('/notifications', { params });
    return response.data;
  },
  getUnreadCount: async () => {
    const response = await axiosClient.get('/notifications/unread-count');
    return response.data;
  },
  markAsRead: async (id) => {
    const response = await axiosClient.put(`/notifications/${id}/read`);
    return response.data;
  }
};
