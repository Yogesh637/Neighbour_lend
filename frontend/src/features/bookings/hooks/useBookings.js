import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingService } from '../../../services/bookingService';

export const useMyBookingsQuery = (params = {}) => {
  return useQuery({
    queryKey: ['bookings', 'my', params],
    queryFn: () => bookingService.getMyBookings(params),
  });
};

export const useBookingRequestsQuery = (params = {}) => {
  return useQuery({
    queryKey: ['bookings', 'requests', params],
    queryFn: () => bookingService.getBookingRequests(params),
  });
};

export const useCreateBookingMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingData) => bookingService.createBooking(bookingData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
};

export const useUpdateBookingStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => bookingService.updateBookingStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
};
