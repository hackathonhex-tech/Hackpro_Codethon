import { z } from 'zod';

export const RUBRIC_CRITERIA_TYPES = [
  'test_cases_passed_pct',
  'hidden_test_cases_passed_pct',
  'completion_time',
  'mcq_accuracy',
  'attempts_penalty',
  'runtime_efficiency',
  'code_quality_manual',
] as const;

export type RubricCriteriaType = (typeof RUBRIC_CRITERIA_TYPES)[number];

export const rubricCriterionSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Criterion name is required'),
  type: z.string().optional().default('test_cases_passed_pct'),
  weight: z.number().min(1, 'Weight must be at least 1').max(100),
  description: z.string().optional().default(''),
});

export const createRubricSchema = z.object({
  name: z.string().min(2, 'Rubric name is required'),
  description: z.string().optional().default(''),
  isPredefined: z.boolean().default(false),
  criteria: z.array(rubricCriterionSchema).min(1, 'At least one criterion is required').refine(
    (items) => {
      const sum = items.reduce((acc, curr) => acc + curr.weight, 0);
      return Math.round(sum) === 100;
    },
    { message: 'Sum of criteria weights must exactly equal 100%' }
  ),
});

export const updateRubricSchema = createRubricSchema.partial().refine(
  (data) => {
    if (data.criteria) {
      const sum = data.criteria.reduce((acc, curr) => acc + curr.weight, 0);
      return Math.round(sum) === 100;
    }
    return true;
  },
  { message: 'Sum of criteria weights must exactly equal 100%' }
);

export type RubricCriterion = z.infer<typeof rubricCriterionSchema>;
export type CreateRubricInput = z.infer<typeof createRubricSchema>;
export type UpdateRubricInput = z.infer<typeof updateRubricSchema>;
