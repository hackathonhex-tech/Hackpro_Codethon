import { z } from 'zod';
export const createParticipantSchema = z.object({
    email: z.string().email('Invalid email address'),
    name: z.string().optional().default(''),
    rollNumber: z.string().optional().default(''),
    password: z.string().optional().default('Hackpro@2026'),
    department: z.string().optional().default('General'),
    yearOrSemester: z.string().optional().default('Final Year'),
});
export const updateParticipantSchema = createParticipantSchema.partial();
export const bulkCreateParticipantsSchema = z.object({
    participants: z.array(createParticipantSchema),
});
export const createTeamSchema = z.object({
    name: z.string().min(2, 'Team name is required'),
    description: z.string().optional().default(''),
    leaderId: z.string().optional(),
    memberIds: z.array(z.string()).default([]),
});
export const assignParticipantsSchema = z.object({
    contestId: z.string().min(1, 'Contest ID is required'),
    participantIds: z.array(z.string()).optional().default([]),
    teamIds: z.array(z.string()).optional().default([]),
});
