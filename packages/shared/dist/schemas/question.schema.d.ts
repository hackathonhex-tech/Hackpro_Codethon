import { z } from 'zod';
export declare const sectionSchema: z.ZodObject<{
    contestId: z.ZodString;
    title: z.ZodString;
    description: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    order: z.ZodDefault<z.ZodNumber>;
    sectionTimerMinutes: z.ZodOptional<z.ZodNumber>;
    canRevisit: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    description: string;
    title: string;
    contestId: string;
    order: number;
    canRevisit: boolean;
    sectionTimerMinutes?: number | undefined;
}, {
    title: string;
    contestId: string;
    description?: string | undefined;
    order?: number | undefined;
    sectionTimerMinutes?: number | undefined;
    canRevisit?: boolean | undefined;
}>;
export declare const mcqOptionSchema: z.ZodObject<{
    id: z.ZodString;
    text: z.ZodString;
    isCorrect: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    id: string;
    text: string;
    isCorrect: boolean;
}, {
    id: string;
    text: string;
    isCorrect?: boolean | undefined;
}>;
export declare const testCaseSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    input: z.ZodString;
    expectedOutput: z.ZodString;
    isSample: z.ZodDefault<z.ZodBoolean>;
    isHidden: z.ZodDefault<z.ZodBoolean>;
    weight: z.ZodDefault<z.ZodNumber>;
    explanation: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    input: string;
    expectedOutput: string;
    isSample: boolean;
    isHidden: boolean;
    weight: number;
    explanation: string;
    id?: string | undefined;
}, {
    input: string;
    expectedOutput: string;
    id?: string | undefined;
    isSample?: boolean | undefined;
    isHidden?: boolean | undefined;
    weight?: number | undefined;
    explanation?: string | undefined;
}>;
export declare const codingDisplayTogglesSchema: z.ZodObject<{
    showStatement: z.ZodDefault<z.ZodBoolean>;
    showInputFormat: z.ZodDefault<z.ZodBoolean>;
    showOutputFormat: z.ZodDefault<z.ZodBoolean>;
    showExamples: z.ZodDefault<z.ZodBoolean>;
    showConstraints: z.ZodDefault<z.ZodBoolean>;
    showLimits: z.ZodDefault<z.ZodBoolean>;
    showSampleTestCases: z.ZodDefault<z.ZodBoolean>;
    showHiddenTestCasesCount: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    showStatement: boolean;
    showInputFormat: boolean;
    showOutputFormat: boolean;
    showExamples: boolean;
    showConstraints: boolean;
    showLimits: boolean;
    showSampleTestCases: boolean;
    showHiddenTestCasesCount: boolean;
}, {
    showStatement?: boolean | undefined;
    showInputFormat?: boolean | undefined;
    showOutputFormat?: boolean | undefined;
    showExamples?: boolean | undefined;
    showConstraints?: boolean | undefined;
    showLimits?: boolean | undefined;
    showSampleTestCases?: boolean | undefined;
    showHiddenTestCasesCount?: boolean | undefined;
}>;
export declare const codingConfigSchema: z.ZodObject<{
    inputFormat: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    outputFormat: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    examples: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    constraints: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    timeLimitMs: z.ZodDefault<z.ZodNumber>;
    memoryLimitMb: z.ZodDefault<z.ZodNumber>;
    displayToggles: z.ZodDefault<z.ZodObject<{
        showStatement: z.ZodDefault<z.ZodBoolean>;
        showInputFormat: z.ZodDefault<z.ZodBoolean>;
        showOutputFormat: z.ZodDefault<z.ZodBoolean>;
        showExamples: z.ZodDefault<z.ZodBoolean>;
        showConstraints: z.ZodDefault<z.ZodBoolean>;
        showLimits: z.ZodDefault<z.ZodBoolean>;
        showSampleTestCases: z.ZodDefault<z.ZodBoolean>;
        showHiddenTestCasesCount: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        showStatement: boolean;
        showInputFormat: boolean;
        showOutputFormat: boolean;
        showExamples: boolean;
        showConstraints: boolean;
        showLimits: boolean;
        showSampleTestCases: boolean;
        showHiddenTestCasesCount: boolean;
    }, {
        showStatement?: boolean | undefined;
        showInputFormat?: boolean | undefined;
        showOutputFormat?: boolean | undefined;
        showExamples?: boolean | undefined;
        showConstraints?: boolean | undefined;
        showLimits?: boolean | undefined;
        showSampleTestCases?: boolean | undefined;
        showHiddenTestCasesCount?: boolean | undefined;
    }>>;
    allowedLanguages: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    starterCode: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
    testCases: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        input: z.ZodString;
        expectedOutput: z.ZodString;
        isSample: z.ZodDefault<z.ZodBoolean>;
        isHidden: z.ZodDefault<z.ZodBoolean>;
        weight: z.ZodDefault<z.ZodNumber>;
        explanation: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        input: string;
        expectedOutput: string;
        isSample: boolean;
        isHidden: boolean;
        weight: number;
        explanation: string;
        id?: string | undefined;
    }, {
        input: string;
        expectedOutput: string;
        id?: string | undefined;
        isSample?: boolean | undefined;
        isHidden?: boolean | undefined;
        weight?: number | undefined;
        explanation?: string | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    inputFormat: string;
    outputFormat: string;
    examples: string;
    constraints: string;
    timeLimitMs: number;
    memoryLimitMb: number;
    displayToggles: {
        showStatement: boolean;
        showInputFormat: boolean;
        showOutputFormat: boolean;
        showExamples: boolean;
        showConstraints: boolean;
        showLimits: boolean;
        showSampleTestCases: boolean;
        showHiddenTestCasesCount: boolean;
    };
    allowedLanguages: string[];
    starterCode: Record<string, string>;
    testCases: {
        input: string;
        expectedOutput: string;
        isSample: boolean;
        isHidden: boolean;
        weight: number;
        explanation: string;
        id?: string | undefined;
    }[];
}, {
    inputFormat?: string | undefined;
    outputFormat?: string | undefined;
    examples?: string | undefined;
    constraints?: string | undefined;
    timeLimitMs?: number | undefined;
    memoryLimitMb?: number | undefined;
    displayToggles?: {
        showStatement?: boolean | undefined;
        showInputFormat?: boolean | undefined;
        showOutputFormat?: boolean | undefined;
        showExamples?: boolean | undefined;
        showConstraints?: boolean | undefined;
        showLimits?: boolean | undefined;
        showSampleTestCases?: boolean | undefined;
        showHiddenTestCasesCount?: boolean | undefined;
    } | undefined;
    allowedLanguages?: string[] | undefined;
    starterCode?: Record<string, string> | undefined;
    testCases?: {
        input: string;
        expectedOutput: string;
        id?: string | undefined;
        isSample?: boolean | undefined;
        isHidden?: boolean | undefined;
        weight?: number | undefined;
        explanation?: string | undefined;
    }[] | undefined;
}>;
export declare const createQuestionSchema: z.ZodObject<{
    contestId: z.ZodString;
    sectionId: z.ZodString;
    type: z.ZodEnum<["mcq", "coding"]>;
    title: z.ZodString;
    statement: z.ZodString;
    marks: z.ZodDefault<z.ZodNumber>;
    negativeMarks: z.ZodDefault<z.ZodNumber>;
    order: z.ZodDefault<z.ZodNumber>;
    isMultiSelect: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    mcqOptions: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        text: z.ZodString;
        isCorrect: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        text: string;
        isCorrect: boolean;
    }, {
        id: string;
        text: string;
        isCorrect?: boolean | undefined;
    }>, "many">>>;
    codingConfig: z.ZodOptional<z.ZodObject<{
        inputFormat: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        outputFormat: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        examples: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        constraints: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        timeLimitMs: z.ZodDefault<z.ZodNumber>;
        memoryLimitMb: z.ZodDefault<z.ZodNumber>;
        displayToggles: z.ZodDefault<z.ZodObject<{
            showStatement: z.ZodDefault<z.ZodBoolean>;
            showInputFormat: z.ZodDefault<z.ZodBoolean>;
            showOutputFormat: z.ZodDefault<z.ZodBoolean>;
            showExamples: z.ZodDefault<z.ZodBoolean>;
            showConstraints: z.ZodDefault<z.ZodBoolean>;
            showLimits: z.ZodDefault<z.ZodBoolean>;
            showSampleTestCases: z.ZodDefault<z.ZodBoolean>;
            showHiddenTestCasesCount: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            showStatement: boolean;
            showInputFormat: boolean;
            showOutputFormat: boolean;
            showExamples: boolean;
            showConstraints: boolean;
            showLimits: boolean;
            showSampleTestCases: boolean;
            showHiddenTestCasesCount: boolean;
        }, {
            showStatement?: boolean | undefined;
            showInputFormat?: boolean | undefined;
            showOutputFormat?: boolean | undefined;
            showExamples?: boolean | undefined;
            showConstraints?: boolean | undefined;
            showLimits?: boolean | undefined;
            showSampleTestCases?: boolean | undefined;
            showHiddenTestCasesCount?: boolean | undefined;
        }>>;
        allowedLanguages: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        starterCode: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
        testCases: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            input: z.ZodString;
            expectedOutput: z.ZodString;
            isSample: z.ZodDefault<z.ZodBoolean>;
            isHidden: z.ZodDefault<z.ZodBoolean>;
            weight: z.ZodDefault<z.ZodNumber>;
            explanation: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            input: string;
            expectedOutput: string;
            isSample: boolean;
            isHidden: boolean;
            weight: number;
            explanation: string;
            id?: string | undefined;
        }, {
            input: string;
            expectedOutput: string;
            id?: string | undefined;
            isSample?: boolean | undefined;
            isHidden?: boolean | undefined;
            weight?: number | undefined;
            explanation?: string | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        inputFormat: string;
        outputFormat: string;
        examples: string;
        constraints: string;
        timeLimitMs: number;
        memoryLimitMb: number;
        displayToggles: {
            showStatement: boolean;
            showInputFormat: boolean;
            showOutputFormat: boolean;
            showExamples: boolean;
            showConstraints: boolean;
            showLimits: boolean;
            showSampleTestCases: boolean;
            showHiddenTestCasesCount: boolean;
        };
        allowedLanguages: string[];
        starterCode: Record<string, string>;
        testCases: {
            input: string;
            expectedOutput: string;
            isSample: boolean;
            isHidden: boolean;
            weight: number;
            explanation: string;
            id?: string | undefined;
        }[];
    }, {
        inputFormat?: string | undefined;
        outputFormat?: string | undefined;
        examples?: string | undefined;
        constraints?: string | undefined;
        timeLimitMs?: number | undefined;
        memoryLimitMb?: number | undefined;
        displayToggles?: {
            showStatement?: boolean | undefined;
            showInputFormat?: boolean | undefined;
            showOutputFormat?: boolean | undefined;
            showExamples?: boolean | undefined;
            showConstraints?: boolean | undefined;
            showLimits?: boolean | undefined;
            showSampleTestCases?: boolean | undefined;
            showHiddenTestCasesCount?: boolean | undefined;
        } | undefined;
        allowedLanguages?: string[] | undefined;
        starterCode?: Record<string, string> | undefined;
        testCases?: {
            input: string;
            expectedOutput: string;
            id?: string | undefined;
            isSample?: boolean | undefined;
            isHidden?: boolean | undefined;
            weight?: number | undefined;
            explanation?: string | undefined;
        }[] | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    type: "mcq" | "coding";
    title: string;
    contestId: string;
    order: number;
    sectionId: string;
    statement: string;
    marks: number;
    negativeMarks: number;
    isMultiSelect: boolean;
    mcqOptions: {
        id: string;
        text: string;
        isCorrect: boolean;
    }[];
    codingConfig?: {
        inputFormat: string;
        outputFormat: string;
        examples: string;
        constraints: string;
        timeLimitMs: number;
        memoryLimitMb: number;
        displayToggles: {
            showStatement: boolean;
            showInputFormat: boolean;
            showOutputFormat: boolean;
            showExamples: boolean;
            showConstraints: boolean;
            showLimits: boolean;
            showSampleTestCases: boolean;
            showHiddenTestCasesCount: boolean;
        };
        allowedLanguages: string[];
        starterCode: Record<string, string>;
        testCases: {
            input: string;
            expectedOutput: string;
            isSample: boolean;
            isHidden: boolean;
            weight: number;
            explanation: string;
            id?: string | undefined;
        }[];
    } | undefined;
}, {
    type: "mcq" | "coding";
    title: string;
    contestId: string;
    sectionId: string;
    statement: string;
    order?: number | undefined;
    marks?: number | undefined;
    negativeMarks?: number | undefined;
    isMultiSelect?: boolean | undefined;
    mcqOptions?: {
        id: string;
        text: string;
        isCorrect?: boolean | undefined;
    }[] | undefined;
    codingConfig?: {
        inputFormat?: string | undefined;
        outputFormat?: string | undefined;
        examples?: string | undefined;
        constraints?: string | undefined;
        timeLimitMs?: number | undefined;
        memoryLimitMb?: number | undefined;
        displayToggles?: {
            showStatement?: boolean | undefined;
            showInputFormat?: boolean | undefined;
            showOutputFormat?: boolean | undefined;
            showExamples?: boolean | undefined;
            showConstraints?: boolean | undefined;
            showLimits?: boolean | undefined;
            showSampleTestCases?: boolean | undefined;
            showHiddenTestCasesCount?: boolean | undefined;
        } | undefined;
        allowedLanguages?: string[] | undefined;
        starterCode?: Record<string, string> | undefined;
        testCases?: {
            input: string;
            expectedOutput: string;
            id?: string | undefined;
            isSample?: boolean | undefined;
            isHidden?: boolean | undefined;
            weight?: number | undefined;
            explanation?: string | undefined;
        }[] | undefined;
    } | undefined;
}>;
export declare const updateQuestionSchema: z.ZodObject<{
    contestId: z.ZodOptional<z.ZodString>;
    sectionId: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<["mcq", "coding"]>>;
    title: z.ZodOptional<z.ZodString>;
    statement: z.ZodOptional<z.ZodString>;
    marks: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    negativeMarks: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    order: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    isMultiSelect: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
    mcqOptions: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        text: z.ZodString;
        isCorrect: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        text: string;
        isCorrect: boolean;
    }, {
        id: string;
        text: string;
        isCorrect?: boolean | undefined;
    }>, "many">>>>;
    codingConfig: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        inputFormat: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        outputFormat: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        examples: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        constraints: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        timeLimitMs: z.ZodDefault<z.ZodNumber>;
        memoryLimitMb: z.ZodDefault<z.ZodNumber>;
        displayToggles: z.ZodDefault<z.ZodObject<{
            showStatement: z.ZodDefault<z.ZodBoolean>;
            showInputFormat: z.ZodDefault<z.ZodBoolean>;
            showOutputFormat: z.ZodDefault<z.ZodBoolean>;
            showExamples: z.ZodDefault<z.ZodBoolean>;
            showConstraints: z.ZodDefault<z.ZodBoolean>;
            showLimits: z.ZodDefault<z.ZodBoolean>;
            showSampleTestCases: z.ZodDefault<z.ZodBoolean>;
            showHiddenTestCasesCount: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            showStatement: boolean;
            showInputFormat: boolean;
            showOutputFormat: boolean;
            showExamples: boolean;
            showConstraints: boolean;
            showLimits: boolean;
            showSampleTestCases: boolean;
            showHiddenTestCasesCount: boolean;
        }, {
            showStatement?: boolean | undefined;
            showInputFormat?: boolean | undefined;
            showOutputFormat?: boolean | undefined;
            showExamples?: boolean | undefined;
            showConstraints?: boolean | undefined;
            showLimits?: boolean | undefined;
            showSampleTestCases?: boolean | undefined;
            showHiddenTestCasesCount?: boolean | undefined;
        }>>;
        allowedLanguages: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        starterCode: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
        testCases: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            input: z.ZodString;
            expectedOutput: z.ZodString;
            isSample: z.ZodDefault<z.ZodBoolean>;
            isHidden: z.ZodDefault<z.ZodBoolean>;
            weight: z.ZodDefault<z.ZodNumber>;
            explanation: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            input: string;
            expectedOutput: string;
            isSample: boolean;
            isHidden: boolean;
            weight: number;
            explanation: string;
            id?: string | undefined;
        }, {
            input: string;
            expectedOutput: string;
            id?: string | undefined;
            isSample?: boolean | undefined;
            isHidden?: boolean | undefined;
            weight?: number | undefined;
            explanation?: string | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        inputFormat: string;
        outputFormat: string;
        examples: string;
        constraints: string;
        timeLimitMs: number;
        memoryLimitMb: number;
        displayToggles: {
            showStatement: boolean;
            showInputFormat: boolean;
            showOutputFormat: boolean;
            showExamples: boolean;
            showConstraints: boolean;
            showLimits: boolean;
            showSampleTestCases: boolean;
            showHiddenTestCasesCount: boolean;
        };
        allowedLanguages: string[];
        starterCode: Record<string, string>;
        testCases: {
            input: string;
            expectedOutput: string;
            isSample: boolean;
            isHidden: boolean;
            weight: number;
            explanation: string;
            id?: string | undefined;
        }[];
    }, {
        inputFormat?: string | undefined;
        outputFormat?: string | undefined;
        examples?: string | undefined;
        constraints?: string | undefined;
        timeLimitMs?: number | undefined;
        memoryLimitMb?: number | undefined;
        displayToggles?: {
            showStatement?: boolean | undefined;
            showInputFormat?: boolean | undefined;
            showOutputFormat?: boolean | undefined;
            showExamples?: boolean | undefined;
            showConstraints?: boolean | undefined;
            showLimits?: boolean | undefined;
            showSampleTestCases?: boolean | undefined;
            showHiddenTestCasesCount?: boolean | undefined;
        } | undefined;
        allowedLanguages?: string[] | undefined;
        starterCode?: Record<string, string> | undefined;
        testCases?: {
            input: string;
            expectedOutput: string;
            id?: string | undefined;
            isSample?: boolean | undefined;
            isHidden?: boolean | undefined;
            weight?: number | undefined;
            explanation?: string | undefined;
        }[] | undefined;
    }>>>;
}, "strip", z.ZodTypeAny, {
    type?: "mcq" | "coding" | undefined;
    title?: string | undefined;
    contestId?: string | undefined;
    order?: number | undefined;
    sectionId?: string | undefined;
    statement?: string | undefined;
    marks?: number | undefined;
    negativeMarks?: number | undefined;
    isMultiSelect?: boolean | undefined;
    mcqOptions?: {
        id: string;
        text: string;
        isCorrect: boolean;
    }[] | undefined;
    codingConfig?: {
        inputFormat: string;
        outputFormat: string;
        examples: string;
        constraints: string;
        timeLimitMs: number;
        memoryLimitMb: number;
        displayToggles: {
            showStatement: boolean;
            showInputFormat: boolean;
            showOutputFormat: boolean;
            showExamples: boolean;
            showConstraints: boolean;
            showLimits: boolean;
            showSampleTestCases: boolean;
            showHiddenTestCasesCount: boolean;
        };
        allowedLanguages: string[];
        starterCode: Record<string, string>;
        testCases: {
            input: string;
            expectedOutput: string;
            isSample: boolean;
            isHidden: boolean;
            weight: number;
            explanation: string;
            id?: string | undefined;
        }[];
    } | undefined;
}, {
    type?: "mcq" | "coding" | undefined;
    title?: string | undefined;
    contestId?: string | undefined;
    order?: number | undefined;
    sectionId?: string | undefined;
    statement?: string | undefined;
    marks?: number | undefined;
    negativeMarks?: number | undefined;
    isMultiSelect?: boolean | undefined;
    mcqOptions?: {
        id: string;
        text: string;
        isCorrect?: boolean | undefined;
    }[] | undefined;
    codingConfig?: {
        inputFormat?: string | undefined;
        outputFormat?: string | undefined;
        examples?: string | undefined;
        constraints?: string | undefined;
        timeLimitMs?: number | undefined;
        memoryLimitMb?: number | undefined;
        displayToggles?: {
            showStatement?: boolean | undefined;
            showInputFormat?: boolean | undefined;
            showOutputFormat?: boolean | undefined;
            showExamples?: boolean | undefined;
            showConstraints?: boolean | undefined;
            showLimits?: boolean | undefined;
            showSampleTestCases?: boolean | undefined;
            showHiddenTestCasesCount?: boolean | undefined;
        } | undefined;
        allowedLanguages?: string[] | undefined;
        starterCode?: Record<string, string> | undefined;
        testCases?: {
            input: string;
            expectedOutput: string;
            id?: string | undefined;
            isSample?: boolean | undefined;
            isHidden?: boolean | undefined;
            weight?: number | undefined;
            explanation?: string | undefined;
        }[] | undefined;
    } | undefined;
}>;
export declare const bulkImportQuestionsSchema: z.ZodObject<{
    contestId: z.ZodString;
    sectionId: z.ZodString;
    questions: z.ZodArray<z.ZodObject<Omit<{
        contestId: z.ZodString;
        sectionId: z.ZodString;
        type: z.ZodEnum<["mcq", "coding"]>;
        title: z.ZodString;
        statement: z.ZodString;
        marks: z.ZodDefault<z.ZodNumber>;
        negativeMarks: z.ZodDefault<z.ZodNumber>;
        order: z.ZodDefault<z.ZodNumber>;
        isMultiSelect: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        mcqOptions: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            text: z.ZodString;
            isCorrect: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            text: string;
            isCorrect: boolean;
        }, {
            id: string;
            text: string;
            isCorrect?: boolean | undefined;
        }>, "many">>>;
        codingConfig: z.ZodOptional<z.ZodObject<{
            inputFormat: z.ZodDefault<z.ZodOptional<z.ZodString>>;
            outputFormat: z.ZodDefault<z.ZodOptional<z.ZodString>>;
            examples: z.ZodDefault<z.ZodOptional<z.ZodString>>;
            constraints: z.ZodDefault<z.ZodOptional<z.ZodString>>;
            timeLimitMs: z.ZodDefault<z.ZodNumber>;
            memoryLimitMb: z.ZodDefault<z.ZodNumber>;
            displayToggles: z.ZodDefault<z.ZodObject<{
                showStatement: z.ZodDefault<z.ZodBoolean>;
                showInputFormat: z.ZodDefault<z.ZodBoolean>;
                showOutputFormat: z.ZodDefault<z.ZodBoolean>;
                showExamples: z.ZodDefault<z.ZodBoolean>;
                showConstraints: z.ZodDefault<z.ZodBoolean>;
                showLimits: z.ZodDefault<z.ZodBoolean>;
                showSampleTestCases: z.ZodDefault<z.ZodBoolean>;
                showHiddenTestCasesCount: z.ZodDefault<z.ZodBoolean>;
            }, "strip", z.ZodTypeAny, {
                showStatement: boolean;
                showInputFormat: boolean;
                showOutputFormat: boolean;
                showExamples: boolean;
                showConstraints: boolean;
                showLimits: boolean;
                showSampleTestCases: boolean;
                showHiddenTestCasesCount: boolean;
            }, {
                showStatement?: boolean | undefined;
                showInputFormat?: boolean | undefined;
                showOutputFormat?: boolean | undefined;
                showExamples?: boolean | undefined;
                showConstraints?: boolean | undefined;
                showLimits?: boolean | undefined;
                showSampleTestCases?: boolean | undefined;
                showHiddenTestCasesCount?: boolean | undefined;
            }>>;
            allowedLanguages: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            starterCode: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
            testCases: z.ZodDefault<z.ZodArray<z.ZodObject<{
                id: z.ZodOptional<z.ZodString>;
                input: z.ZodString;
                expectedOutput: z.ZodString;
                isSample: z.ZodDefault<z.ZodBoolean>;
                isHidden: z.ZodDefault<z.ZodBoolean>;
                weight: z.ZodDefault<z.ZodNumber>;
                explanation: z.ZodDefault<z.ZodOptional<z.ZodString>>;
            }, "strip", z.ZodTypeAny, {
                input: string;
                expectedOutput: string;
                isSample: boolean;
                isHidden: boolean;
                weight: number;
                explanation: string;
                id?: string | undefined;
            }, {
                input: string;
                expectedOutput: string;
                id?: string | undefined;
                isSample?: boolean | undefined;
                isHidden?: boolean | undefined;
                weight?: number | undefined;
                explanation?: string | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            inputFormat: string;
            outputFormat: string;
            examples: string;
            constraints: string;
            timeLimitMs: number;
            memoryLimitMb: number;
            displayToggles: {
                showStatement: boolean;
                showInputFormat: boolean;
                showOutputFormat: boolean;
                showExamples: boolean;
                showConstraints: boolean;
                showLimits: boolean;
                showSampleTestCases: boolean;
                showHiddenTestCasesCount: boolean;
            };
            allowedLanguages: string[];
            starterCode: Record<string, string>;
            testCases: {
                input: string;
                expectedOutput: string;
                isSample: boolean;
                isHidden: boolean;
                weight: number;
                explanation: string;
                id?: string | undefined;
            }[];
        }, {
            inputFormat?: string | undefined;
            outputFormat?: string | undefined;
            examples?: string | undefined;
            constraints?: string | undefined;
            timeLimitMs?: number | undefined;
            memoryLimitMb?: number | undefined;
            displayToggles?: {
                showStatement?: boolean | undefined;
                showInputFormat?: boolean | undefined;
                showOutputFormat?: boolean | undefined;
                showExamples?: boolean | undefined;
                showConstraints?: boolean | undefined;
                showLimits?: boolean | undefined;
                showSampleTestCases?: boolean | undefined;
                showHiddenTestCasesCount?: boolean | undefined;
            } | undefined;
            allowedLanguages?: string[] | undefined;
            starterCode?: Record<string, string> | undefined;
            testCases?: {
                input: string;
                expectedOutput: string;
                id?: string | undefined;
                isSample?: boolean | undefined;
                isHidden?: boolean | undefined;
                weight?: number | undefined;
                explanation?: string | undefined;
            }[] | undefined;
        }>>;
    }, "contestId" | "sectionId">, "strip", z.ZodTypeAny, {
        type: "mcq" | "coding";
        title: string;
        order: number;
        statement: string;
        marks: number;
        negativeMarks: number;
        isMultiSelect: boolean;
        mcqOptions: {
            id: string;
            text: string;
            isCorrect: boolean;
        }[];
        codingConfig?: {
            inputFormat: string;
            outputFormat: string;
            examples: string;
            constraints: string;
            timeLimitMs: number;
            memoryLimitMb: number;
            displayToggles: {
                showStatement: boolean;
                showInputFormat: boolean;
                showOutputFormat: boolean;
                showExamples: boolean;
                showConstraints: boolean;
                showLimits: boolean;
                showSampleTestCases: boolean;
                showHiddenTestCasesCount: boolean;
            };
            allowedLanguages: string[];
            starterCode: Record<string, string>;
            testCases: {
                input: string;
                expectedOutput: string;
                isSample: boolean;
                isHidden: boolean;
                weight: number;
                explanation: string;
                id?: string | undefined;
            }[];
        } | undefined;
    }, {
        type: "mcq" | "coding";
        title: string;
        statement: string;
        order?: number | undefined;
        marks?: number | undefined;
        negativeMarks?: number | undefined;
        isMultiSelect?: boolean | undefined;
        mcqOptions?: {
            id: string;
            text: string;
            isCorrect?: boolean | undefined;
        }[] | undefined;
        codingConfig?: {
            inputFormat?: string | undefined;
            outputFormat?: string | undefined;
            examples?: string | undefined;
            constraints?: string | undefined;
            timeLimitMs?: number | undefined;
            memoryLimitMb?: number | undefined;
            displayToggles?: {
                showStatement?: boolean | undefined;
                showInputFormat?: boolean | undefined;
                showOutputFormat?: boolean | undefined;
                showExamples?: boolean | undefined;
                showConstraints?: boolean | undefined;
                showLimits?: boolean | undefined;
                showSampleTestCases?: boolean | undefined;
                showHiddenTestCasesCount?: boolean | undefined;
            } | undefined;
            allowedLanguages?: string[] | undefined;
            starterCode?: Record<string, string> | undefined;
            testCases?: {
                input: string;
                expectedOutput: string;
                id?: string | undefined;
                isSample?: boolean | undefined;
                isHidden?: boolean | undefined;
                weight?: number | undefined;
                explanation?: string | undefined;
            }[] | undefined;
        } | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    contestId: string;
    sectionId: string;
    questions: {
        type: "mcq" | "coding";
        title: string;
        order: number;
        statement: string;
        marks: number;
        negativeMarks: number;
        isMultiSelect: boolean;
        mcqOptions: {
            id: string;
            text: string;
            isCorrect: boolean;
        }[];
        codingConfig?: {
            inputFormat: string;
            outputFormat: string;
            examples: string;
            constraints: string;
            timeLimitMs: number;
            memoryLimitMb: number;
            displayToggles: {
                showStatement: boolean;
                showInputFormat: boolean;
                showOutputFormat: boolean;
                showExamples: boolean;
                showConstraints: boolean;
                showLimits: boolean;
                showSampleTestCases: boolean;
                showHiddenTestCasesCount: boolean;
            };
            allowedLanguages: string[];
            starterCode: Record<string, string>;
            testCases: {
                input: string;
                expectedOutput: string;
                isSample: boolean;
                isHidden: boolean;
                weight: number;
                explanation: string;
                id?: string | undefined;
            }[];
        } | undefined;
    }[];
}, {
    contestId: string;
    sectionId: string;
    questions: {
        type: "mcq" | "coding";
        title: string;
        statement: string;
        order?: number | undefined;
        marks?: number | undefined;
        negativeMarks?: number | undefined;
        isMultiSelect?: boolean | undefined;
        mcqOptions?: {
            id: string;
            text: string;
            isCorrect?: boolean | undefined;
        }[] | undefined;
        codingConfig?: {
            inputFormat?: string | undefined;
            outputFormat?: string | undefined;
            examples?: string | undefined;
            constraints?: string | undefined;
            timeLimitMs?: number | undefined;
            memoryLimitMb?: number | undefined;
            displayToggles?: {
                showStatement?: boolean | undefined;
                showInputFormat?: boolean | undefined;
                showOutputFormat?: boolean | undefined;
                showExamples?: boolean | undefined;
                showConstraints?: boolean | undefined;
                showLimits?: boolean | undefined;
                showSampleTestCases?: boolean | undefined;
                showHiddenTestCasesCount?: boolean | undefined;
            } | undefined;
            allowedLanguages?: string[] | undefined;
            starterCode?: Record<string, string> | undefined;
            testCases?: {
                input: string;
                expectedOutput: string;
                id?: string | undefined;
                isSample?: boolean | undefined;
                isHidden?: boolean | undefined;
                weight?: number | undefined;
                explanation?: string | undefined;
            }[] | undefined;
        } | undefined;
    }[];
}>;
export type SectionInput = z.infer<typeof sectionSchema>;
export type McqOption = z.infer<typeof mcqOptionSchema>;
export type TestCase = z.infer<typeof testCaseSchema>;
export type CodingDisplayToggles = z.infer<typeof codingDisplayTogglesSchema>;
export type CodingConfig = z.infer<typeof codingConfigSchema>;
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
//# sourceMappingURL=question.schema.d.ts.map