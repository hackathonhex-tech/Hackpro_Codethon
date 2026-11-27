import { z } from 'zod';

export const saveAnswerSchema = z.object({
  questionId: z.string().min(1),
  selectedOptions: z.array(z.string()).optional(), // for MCQ
  isMarkedForReview: z.boolean().optional().default(false),
  draftCode: z.string().optional(), // for coding
  language: z.string().optional(),
});

export const runCodeSchema = z.object({
  questionId: z.string().min(1),
  code: z.string().min(1, 'Code cannot be empty'),
  language: z.string().min(1, 'Language is required'),
  customInput: z.string().optional(),
});

export const submitCodeSchema = z.object({
  questionId: z.string().min(1),
  code: z.string().min(1, 'Code cannot be empty'),
  language: z.string().min(1, 'Language is required'),
});

export const finishAttemptSchema = z.object({
  contestId: z.string().min(1),
  reason: z.string().optional().default('user_submit'),
});

export const revokeSubmissionSchema = z.object({
  attemptId: z.string().min(1, 'Attempt ID is required'),
  reason: z.string().min(1, 'Revocation reason is required').default('Administrative unlock'),
  extensionMinutes: z.number().int().min(0).default(0), // optional extra time given on reopen
  resetAnswers: z.boolean().optional().default(true),
});

export type SaveAnswerInput = z.infer<typeof saveAnswerSchema>;
export type RunCodeInput = z.infer<typeof runCodeSchema>;
export type SubmitCodeInput = z.infer<typeof submitCodeSchema>;
export type FinishAttemptInput = z.infer<typeof finishAttemptSchema>;
export type RevokeSubmissionInput = z.infer<typeof revokeSubmissionSchema>;
