import { z } from 'zod';
export declare const reportOverrideSchema: z.ZodObject<{
    contestId: z.ZodString;
    overrides: z.ZodObject<{
        totalRegistered: z.ZodOptional<z.ZodNumber>;
        totalAttended: z.ZodOptional<z.ZodNumber>;
        totalSubmitted: z.ZodOptional<z.ZodNumber>;
        averageScore: z.ZodOptional<z.ZodNumber>;
        highestScore: z.ZodOptional<z.ZodNumber>;
        accuracyRate: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        totalRegistered?: number | undefined;
        totalAttended?: number | undefined;
        totalSubmitted?: number | undefined;
        averageScore?: number | undefined;
        highestScore?: number | undefined;
        accuracyRate?: number | undefined;
    }, {
        totalRegistered?: number | undefined;
        totalAttended?: number | undefined;
        totalSubmitted?: number | undefined;
        averageScore?: number | undefined;
        highestScore?: number | undefined;
        accuracyRate?: number | undefined;
    }>;
    note: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    contestId: string;
    overrides: {
        totalRegistered?: number | undefined;
        totalAttended?: number | undefined;
        totalSubmitted?: number | undefined;
        averageScore?: number | undefined;
        highestScore?: number | undefined;
        accuracyRate?: number | undefined;
    };
    note: string;
}, {
    contestId: string;
    overrides: {
        totalRegistered?: number | undefined;
        totalAttended?: number | undefined;
        totalSubmitted?: number | undefined;
        averageScore?: number | undefined;
        highestScore?: number | undefined;
        accuracyRate?: number | undefined;
    };
    note?: string | undefined;
}>;
export type ReportOverrideInput = z.infer<typeof reportOverrideSchema>;
//# sourceMappingURL=report.schema.d.ts.map