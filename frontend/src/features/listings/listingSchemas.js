import { z } from 'zod';

export const listingSchema = z.object({
  name: z.string().min(1, 'Item name is required').max(100, 'Item name must be under 100 characters'),
  description: z.string().max(1000, 'Description must be under 1000 characters').optional().or(z.literal('')),
  price: z.preprocess(
    (val) => {
      if (typeof val === 'string' && val.trim() === '') return undefined;
      const parsed = parseFloat(val);
      return isNaN(parsed) ? val : parsed;
    },
    z.number({ invalid_type_error: 'Price is required and must be a number' }).positive('Price must be greater than 0')
  ),
  category: z.string().min(1, 'Category is required'),
  imageUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
});
