import { z } from 'zod';

export const bookingFormSchema = z.object({
  startDay: z.string().min(1, 'Check-in date is required'),
  startHour: z.string().min(1),
  startMin: z.string().min(1),
  startAmPm: z.enum(['AM', 'PM']),
  endDay: z.string().min(1, 'Check-out date is required'),
  endHour: z.string().min(1),
  endMin: z.string().min(1),
  endAmPm: z.enum(['AM', 'PM']),
}).refine((data) => {
  const formatTo24h = (h, m, period) => {
    let hour = parseInt(h);
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    return `${hour.toString().padStart(2, '0')}:${m}`;
  };
  
  const startStr = `${data.startDay}T${formatTo24h(data.startHour, data.startMin, data.startAmPm)}`;
  const endStr = `${data.endDay}T${formatTo24h(data.endHour, data.endMin, data.endAmPm)}`;
  const start = new Date(startStr);
  const end = new Date(endStr);
  return end > start;
}, {
  message: 'Check-out time must be after check-in time',
  path: ['endDay']
});
