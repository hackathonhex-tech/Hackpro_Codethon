import { z } from 'zod';
export const reportOverrideSchema = z.object({
    contestId: z.string().min(1),
    overrides: z.object({
        totalRegistered: z.number().optional(),
        totalAttended: z.number().optional(),
        totalSubmitted: z.number().optional(),
        averageScore: z.number().optional(),
        highestScore: z.number().optional(),
        accuracyRate: z.number().optional(),
    }),
    note: z.string().optional().default('Presentation adjustment'),
});
