import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewService } from '../../../services/reviewService';

export const useItemReviewsQuery = (itemId) => {
  return useQuery({
    queryKey: ['reviews', 'item', itemId],
    queryFn: () => reviewService.getItemReviews(itemId),
    enabled: !!itemId,
  });
};

export const useCreateReviewMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reviewData) => reviewService.createReview(reviewData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', 'item', variables.itemId] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
};
