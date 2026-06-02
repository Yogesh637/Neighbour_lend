import { useMutation } from '@tanstack/react-query';
import { authService } from '../../../services/authService';
import { useAuth } from '../../../store/authStore';

export const useLoginMutation = () => {
  const { loginUser } = useAuth();
  return useMutation({
    mutationFn: ({ email, password }) => authService.login(email, password),
    onSuccess: (data) => {
      if (data?.token) {
        loginUser(data.token, data.refreshToken);
      }
    },
  });
};

export const useRegisterMutation = () => {
  return useMutation({
    mutationFn: (userData) => authService.register(userData),
  });
};

export const useVerifyOtpMutation = () => {
  const { loginUser } = useAuth();
  return useMutation({
    mutationFn: ({ email, otp }) => authService.verifyOtp(email, otp),
    onSuccess: (data) => {
      if (data?.token) {
        loginUser(data.token, data.refreshToken);
      }
    },
  });
};

export const useGoogleLoginMutation = () => {
  const { loginUser } = useAuth();
  return useMutation({
    mutationFn: (googleToken) => authService.googleLogin(googleToken),
    onSuccess: (data) => {
      if (data?.token) {
        loginUser(data.token, data.refreshToken);
      }
    },
  });
};

export const useResendOtpMutation = () => {
  return useMutation({
    mutationFn: (email) => authService.resendOtp(email),
  });
};
