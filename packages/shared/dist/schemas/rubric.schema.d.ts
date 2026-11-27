import { z } from 'zod';
export declare const RUBRIC_CRITERIA_TYPES: readonly ["test_cases_passed_pct", "hidden_test_cases_passed_pct", "completion_time", "mcq_accuracy", "attempts_penalty", "runtime_efficiency", "code_quality_manual"];
export type RubricCriteriaType = (typeof RUBRIC_CRITERIA_TYPES)[number];
export declare const rubricCriterionSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    type: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    weight: z.ZodNumber;
    description: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    type: string;
    name: string;
    description: string;
    weight: number;
    id?: string | undefined;
}, {
    name: string;
    weight: number;
    type?: string | undefined;
    description?: string | undefined;
    id?: string | undefined;
}>;
export declare const createRubricSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    isPredefined: z.ZodDefault<z.ZodBoolean>;
    criteria: z.ZodEffects<z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        name: z.ZodString;
        type: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        weight: z.ZodNumber;
        description: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        name: string;
        description: string;
        weight: number;
        id?: string | undefined;
    }, {
        name: string;
        weight: number;
        type?: string | undefined;
        description?: string | undefined;
        id?: string | undefined;
    }>, "many">, {
        type: string;
        name: string;
        description: string;
        weight: number;
        id?: string | undefined;
    }[], {
        name: string;
        weight: number;
        type?: string | undefined;
        description?: string | undefined;
        id?: string | undefined;
    }[]>;
}, "strip", z.ZodTypeAny, {
    name: string;
    description: string;
    isPredefined: boolean;
    criteria: {
        type: string;
        name: string;
        description: string;
        weight: number;
        id?: string | undefined;
    }[];
}, {
    name: string;
    criteria: {
        name: string;
        weight: number;
        type?: string | undefined;
        description?: string | undefined;
        id?: string | undefined;
    }[];
    description?: string | undefined;
    isPredefined?: boolean | undefined;
}>;
export declare const updateRubricSchema: z.ZodEffects<z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodString>>>;
    isPredefined: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    criteria: z.ZodOptional<z.ZodEffects<z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        name: z.ZodString;
        type: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        weight: z.ZodNumber;
        description: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        name: string;
        description: string;
        weight: number;
        id?: string | undefined;
    }, {
        name: string;
        weight: number;
        type?: string | undefined;
        description?: string | undefined;
        id?: string | undefined;
    }>, "many">, {
        type: string;
        name: string;
        description: string;
        weight: number;
        id?: string | undefined;
    }[], {
        name: string;
        weight: number;
        type?: string | undefined;
        description?: string | undefined;
        id?: string | undefined;
    }[]>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    isPredefined?: boolean | undefined;
    criteria?: {
        type: string;
        name: string;
        description: string;
        weight: number;
        id?: string | undefined;
    }[] | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    isPredefined?: boolean | undefined;
    criteria?: {
        name: string;
        weight: number;
        type?: string | undefined;
        description?: string | undefined;
        id?: string | undefined;
    }[] | undefined;
}>, {
    name?: string | undefined;
    description?: string | undefined;
    isPredefined?: boolean | undefined;
    criteria?: {
        type: string;
        name: string;
        description: string;
        weight: number;
        id?: string | undefined;
    }[] | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    isPredefined?: boolean | undefined;
    criteria?: {
        name: string;
        weight: number;
        type?: string | undefined;
        description?: string | undefined;
        id?: string | undefined;
    }[] | undefined;
}>;
export type RubricCriterion = z.infer<typeof rubricCriterionSchema>;
export type CreateRubricInput = z.infer<typeof createRubricSchema>;
export type UpdateRubricInput = z.infer<typeof updateRubricSchema>;
//# sourceMappingURL=rubric.schema.d.ts.map