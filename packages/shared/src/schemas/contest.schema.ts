import { z } from 'zod';
import { CONTEST_STATUS, LEADERBOARD_DISPLAY_MODE, PROCTOR_ACTION } from '../constants/statuses.js';

export const proctorConfigSchema = z.object({
  enabled: z.boolean().default(false),
  detectTabSwitch: z.boolean().default(true),
  detectWindowBlur: z.boolean().default(true),
  blockCopyPaste: z.boolean().default(true),
  blockRightClick: z.boolean().default(true),
  enforceFullscreen: z.boolean().default(true),
  blockDevTools: z.boolean().default(true),
  blockPrintScreen: z.boolean().default(true),
  blockTextSelection: z.boolean().default(true),
  maxViolations: z.number().int().min(1).default(5),
  violationAction: z.enum([PROCTOR_ACTION.WARN_ONLY, PROCTOR_ACTION.FLAG, PROCTOR_ACTION.AUTO_SUBMIT]).default(PROCTOR_ACTION.WARN_ONLY),
});

export const leaderboardConfigSchema = z.object({
  enabled: z.boolean().default(true),
  displayMode: z.enum([LEADERBOARD_DISPLAY_MODE.ANONYMOUS, LEADERBOARD_DISPLAY_MODE.WITH_NAMES]).default(LEADERBOARD_DISPLAY_MODE.WITH_NAMES),
  topN: z.number().int().min(1).max(500).default(50),
  freezeMinutesBeforeEnd: z.number().int().min(0).default(0),
});

export const createContestSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional().default(''),
  instructions: z.string().optional().default(''),
  batchCode: z.string().optional().default(''),
  startTime: z.string().datetime({ message: 'Invalid start time' }),
  endTime: z.string().datetime({ message: 'Invalid end time' }),
  durationMinutes: z.number().int().min(5, 'Duration must be at least 5 minutes'),
  gracePeriodMinutes: z.number().int().min(0).default(0),
  status: z.enum([
    CONTEST_STATUS.DRAFT,
    CONTEST_STATUS.SCHEDULED,
    CONTEST_STATUS.LIVE,
    CONTEST_STATUS.ENDED,
    CONTEST_STATUS.ARCHIVED,
  ]).default(CONTEST_STATUS.DRAFT),
  rubricId: z.string().optional(),
  activationMode: z.enum(['scheduled', 'manual']).default('scheduled'),
  showTotalPointsEarned: z.boolean().default(true),
  isTurnedOff: z.boolean().default(false),
  shuffleQuestions: z.boolean().default(false),
  shuffleOptions: z.boolean().default(false),
  randomizeQuestions: z.boolean().default(false),
  questionsPerParticipant: z.number().int().min(1).optional(),
  resultVisibility: z.enum(['immediate', 'after_contest', 'hidden']).default('immediate'),
  codeRunCooldownSeconds: z.number().int().min(0).default(30),
  maxCodeSubmissions: z.number().int().min(1).default(3),
  proctorConfig: proctorConfigSchema.default({}),
  leaderboardConfig: leaderboardConfigSchema.default({}),
});

export const updateContestSchema = createContestSchema.partial();

export const adjustTimingSchema = z.object({
  extensionMinutes: z.number().int().min(1, 'Extension must be at least 1 minute'),
  reason: z.string().min(3, 'Reason for extension is required'),
});

export type ProctorConfig = z.infer<typeof proctorConfigSchema>;
export type LeaderboardConfig = z.infer<typeof leaderboardConfigSchema>;
export type CreateContestInput = z.infer<typeof createContestSchema>;
export type UpdateContestInput = z.infer<typeof updateContestSchema>;
export type AdjustTimingInput = z.infer<typeof adjustTimingSchema>;
