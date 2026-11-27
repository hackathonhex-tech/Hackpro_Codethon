import { z } from 'zod';
export declare const saveAnswerSchema: z.ZodObject<{
    questionId: z.ZodString;
    selectedOptions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    isMarkedForReview: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    draftCode: z.ZodOptional<z.ZodString>;
    language: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    questionId: string;
    isMarkedForReview: boolean;
    selectedOptions?: string[] | undefined;
    draftCode?: string | undefined;
    language?: string | undefined;
}, {
    questionId: string;
    selectedOptions?: string[] | undefined;
    isMarkedForReview?: boolean | undefined;
    draftCode?: string | undefined;
    language?: string | undefined;
}>;
export declare const runCodeSchema: z.ZodObject<{
    questionId: z.ZodString;
    code: z.ZodString;
    language: z.ZodString;
    customInput: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    code: string;
    questionId: string;
    language: string;
    customInput?: string | undefined;
}, {
    code: string;
    questionId: string;
    language: string;
    customInput?: string | undefined;
}>;
export declare const submitCodeSchema: z.ZodObject<{
    questionId: z.ZodString;
    code: z.ZodString;
    language: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
    questionId: string;
    language: string;
}, {
    code: string;
    questionId: string;
    language: string;
}>;
export declare const finishAttemptSchema: z.ZodObject<{
    contestId: z.ZodString;
    reason: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    reason: string;
    contestId: string;
}, {
    contestId: string;
    reason?: string | undefined;
}>;
export declare const revokeSubmissionSchema: z.ZodObject<{
    attemptId: z.ZodString;
    reason: z.ZodDefault<z.ZodString>;
    extensionMinutes: z.ZodDefault<z.ZodNumber>;
    resetAnswers: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    extensionMinutes: number;
    reason: string;
    attemptId: string;
    resetAnswers: boolean;
}, {
    attemptId: string;
    extensionMinutes?: number | undefined;
    reason?: string | undefined;
    resetAnswers?: boolean | undefined;
}>;
export type SaveAnswerInput = z.infer<typeof saveAnswerSchema>;
export type RunCodeInput = z.infer<typeof runCodeSchema>;
export type SubmitCodeInput = z.infer<typeof submitCodeSchema>;
export type FinishAttemptInput = z.infer<typeof finishAttemptSchema>;
export type RevokeSubmissionInput = z.infer<typeof revokeSubmissionSchema>;
//# sourceMappingURL=submission.schema.d.ts.map