import axiosClient from '../api/axiosClient';

export const authService = {
  login: async (email, password) => {
    const response = await axiosClient.post('/auth/login', { email, password });
    return response.data;
  },
  register: async (userData) => {
    const response = await axiosClient.post('/users/register', userData);
    return response.data;
  },
  verifyOtp: async (email, otp) => {
    const response = await axiosClient.post('/auth/verify-otp', { email, otp });
    return response.data;
  },
  googleLogin: async (googleToken) => {
    const response = await axiosClient.post('/auth/google', { token: googleToken });
    return response.data;
  },
  resendOtp: async (email) => {
    const response = await axiosClient.post('/auth/resend-otp', { email });
    return response.data;
  }
};
