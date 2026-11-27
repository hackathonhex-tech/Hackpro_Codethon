import { z } from 'zod';
export declare const logProctorEventSchema: z.ZodObject<{
    contestId: z.ZodString;
    attemptId: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    type: z.ZodString;
    timestamp: z.ZodOptional<z.ZodString>;
    details: z.ZodDefault<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
}, "strip", z.ZodTypeAny, {
    type: string;
    contestId: string;
    attemptId: string;
    details: Record<string, any>;
    timestamp?: string | undefined;
}, {
    type: string;
    contestId: string;
    attemptId?: string | undefined;
    timestamp?: string | undefined;
    details?: Record<string, any> | undefined;
}>;
export type LogProctorEventInput = z.infer<typeof logProctorEventSchema>;
//# sourceMappingURL=proctor.schema.d.ts.map