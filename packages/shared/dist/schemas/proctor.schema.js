import { z } from 'zod';
export const logProctorEventSchema = z.object({
    contestId: z.string().min(1),
    attemptId: z.string().optional().default(''),
    type: z.string().min(1),
    timestamp: z.string().optional(),
    details: z.record(z.any()).optional().default({}),
});
