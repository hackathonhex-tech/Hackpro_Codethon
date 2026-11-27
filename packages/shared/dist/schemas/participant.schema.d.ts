import { z } from 'zod';
export declare const createParticipantSchema: z.ZodObject<{
    email: z.ZodString;
    name: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    rollNumber: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    password: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    department: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    yearOrSemester: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    password: string;
    email: string;
    name: string;
    rollNumber: string;
    department: string;
    yearOrSemester: string;
}, {
    email: string;
    password?: string | undefined;
    name?: string | undefined;
    rollNumber?: string | undefined;
    department?: string | undefined;
    yearOrSemester?: string | undefined;
}>;
export declare const updateParticipantSchema: z.ZodObject<{
    email: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodString>>>;
    rollNumber: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodString>>>;
    password: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodString>>>;
    department: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodString>>>;
    yearOrSemester: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodString>>>;
}, "strip", z.ZodTypeAny, {
    password?: string | undefined;
    email?: string | undefined;
    name?: string | undefined;
    rollNumber?: string | undefined;
    department?: string | undefined;
    yearOrSemester?: string | undefined;
}, {
    password?: string | undefined;
    email?: string | undefined;
    name?: string | undefined;
    rollNumber?: string | undefined;
    department?: string | undefined;
    yearOrSemester?: string | undefined;
}>;
export declare const bulkCreateParticipantsSchema: z.ZodObject<{
    participants: z.ZodArray<z.ZodObject<{
        email: z.ZodString;
        name: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        rollNumber: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        password: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        department: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        yearOrSemester: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        password: string;
        email: string;
        name: string;
        rollNumber: string;
        department: string;
        yearOrSemester: string;
    }, {
        email: string;
        password?: string | undefined;
        name?: string | undefined;
        rollNumber?: string | undefined;
        department?: string | undefined;
        yearOrSemester?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    participants: {
        password: string;
        email: string;
        name: string;
        rollNumber: string;
        department: string;
        yearOrSemester: string;
    }[];
}, {
    participants: {
        email: string;
        password?: string | undefined;
        name?: string | undefined;
        rollNumber?: string | undefined;
        department?: string | undefined;
        yearOrSemester?: string | undefined;
    }[];
}>;
export declare const createTeamSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    leaderId: z.ZodOptional<z.ZodString>;
    memberIds: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    description: string;
    memberIds: string[];
    leaderId?: string | undefined;
}, {
    name: string;
    description?: string | undefined;
    leaderId?: string | undefined;
    memberIds?: string[] | undefined;
}>;
export declare const assignParticipantsSchema: z.ZodObject<{
    contestId: z.ZodString;
    participantIds: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    teamIds: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
}, "strip", z.ZodTypeAny, {
    contestId: string;
    participantIds: string[];
    teamIds: string[];
}, {
    contestId: string;
    participantIds?: string[] | undefined;
    teamIds?: string[] | undefined;
}>;
export type CreateParticipantInput = z.infer<typeof createParticipantSchema>;
export type UpdateParticipantInput = z.infer<typeof updateParticipantSchema>;
export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type AssignParticipantsInput = z.infer<typeof assignParticipantsSchema>;
//# sourceMappingURL=participant.schema.d.ts.map