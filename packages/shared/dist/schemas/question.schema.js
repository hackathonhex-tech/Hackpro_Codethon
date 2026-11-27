import { z } from 'zod';
export const sectionSchema = z.object({
    contestId: z.string().min(1),
    title: z.string().min(2, 'Section title is required'),
    description: z.string().optional().default(''),
    order: z.number().int().min(0).default(0),
    sectionTimerMinutes: z.number().int().min(0).optional(), // 0 or undefined = no section timer
    canRevisit: z.boolean().default(true),
});
export const mcqOptionSchema = z.object({
    id: z.string(),
    text: z.string().min(1, 'Option text is required'),
    isCorrect: z.boolean().default(false),
});
export const testCaseSchema = z.object({
    id: z.string().optional(),
    input: z.string(),
    expectedOutput: z.string(),
    isSample: z.boolean().default(false),
    isHidden: z.boolean().default(false),
    weight: z.number().min(0).default(1),
    explanation: z.string().optional().default(''),
});
export const codingDisplayTogglesSchema = z.object({
    showStatement: z.boolean().default(true),
    showInputFormat: z.boolean().default(true),
    showOutputFormat: z.boolean().default(true),
    showExamples: z.boolean().default(true),
    showConstraints: z.boolean().default(true),
    showLimits: z.boolean().default(true),
    showSampleTestCases: z.boolean().default(true),
    showHiddenTestCasesCount: z.boolean().default(true),
});
export const codingConfigSchema = z.object({
    inputFormat: z.string().optional().default(''),
    outputFormat: z.string().optional().default(''),
    examples: z.string().optional().default(''),
    constraints: z.string().optional().default(''),
    timeLimitMs: z.number().int().min(100).max(10000).default(2000),
    memoryLimitMb: z.number().int().min(16).max(1024).default(256),
    displayToggles: codingDisplayTogglesSchema.default({}),
    allowedLanguages: z.array(z.string()).min(1, 'At least one language must be enabled').default(['python', 'javascript', 'cpp', 'java']),
    starterCode: z.record(z.string()).default({}), // key: languageId -> code
    testCases: z.array(testCaseSchema).default([]),
});
export const createQuestionSchema = z.object({
    contestId: z.string().min(1),
    sectionId: z.string().min(1),
    type: z.enum(['mcq', 'coding']),
    title: z.string().min(2, 'Question title is required'),
    statement: z.string().min(5, 'Problem statement is required'),
    marks: z.number().min(1, 'Marks must be positive').default(10),
    negativeMarks: z.number().min(0).default(0),
    order: z.number().int().min(0).default(0),
    // MCQ specific
    isMultiSelect: z.boolean().optional().default(false),
    mcqOptions: z.array(mcqOptionSchema).optional().default([]),
    // Coding specific
    codingConfig: codingConfigSchema.optional(),
});
export const updateQuestionSchema = createQuestionSchema.partial();
export const bulkImportQuestionsSchema = z.object({
    contestId: z.string().min(1),
    sectionId: z.string().min(1),
    questions: z.array(createQuestionSchema.omit({ contestId: true, sectionId: true })),
});
