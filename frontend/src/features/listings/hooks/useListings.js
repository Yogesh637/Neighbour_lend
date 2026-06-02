import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listingService } from '../../../services/listingService';

export const useListingsQuery = (params = {}) => {
  return useQuery({
    queryKey: ['listings', params],
    queryFn: () => listingService.getListings(params),
  });
};

export const useCreateListingMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData) => listingService.createListing(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
};

export const useWishlistQuery = () => {
  return useQuery({
    queryKey: ['wishlist'],
    queryFn: listingService.getWishlist,
  });
};

export const useToggleWishlistMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId) => listingService.toggleWishlist(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
};
