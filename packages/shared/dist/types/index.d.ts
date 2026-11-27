import { AttemptStatus, ContestStatus } from '../constants/statuses.js';
import { PermissionKey } from '../constants/permissions.js';
import { CodingDisplayToggles } from '../schemas/question.schema.js';
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
}
export interface PaginatedResponse<T = any> {
    items: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export interface UserSession {
    userId: string;
    name: string;
    email: string;
    rollNumber?: string;
    role: string;
    roleName?: string;
    permissions: PermissionKey[];
    contestScope?: string[];
    isSuperAdmin?: boolean;
}
export interface ClientContestView {
    id: string;
    title: string;
    description: string;
    instructions: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    status: ContestStatus;
    proctorConfig: {
        enabled: boolean;
        detectTabSwitch: boolean;
        detectWindowBlur: boolean;
        blockCopyPaste: boolean;
        blockRightClick: boolean;
        enforceFullscreen: boolean;
        blockDevTools: boolean;
        blockPrintScreen: boolean;
        blockTextSelection: boolean;
        maxViolations: number;
    };
    leaderboardConfig: {
        enabled: boolean;
        displayMode: string;
    };
    attempt?: {
        id: string;
        status: AttemptStatus;
        startedAt: string;
        endsAt: string;
        remainingSeconds: number;
    };
}
export interface ClientQuestionView {
    id: string;
    sectionId: string;
    type: 'mcq' | 'coding';
    title: string;
    statement: string;
    marks: number;
    negativeMarks: number;
    order: number;
    isMultiSelect?: boolean;
    mcqOptions?: {
        id: string;
        text: string;
    }[];
    codingConfig?: {
        inputFormat?: string;
        outputFormat?: string;
        examples?: string;
        constraints?: string;
        timeLimitMs: number;
        memoryLimitMb: number;
        displayToggles: CodingDisplayToggles;
        allowedLanguages: string[];
        starterCode: Record<string, string>;
        sampleTestCases: {
            id: string;
            input: string;
            expectedOutput: string;
            explanation?: string;
        }[];
        hiddenTestCasesCount?: number;
    };
}
export interface LeaderboardEntry {
    rank: number;
    userId: string;
    name: string;
    rollNumber?: string;
    teamName?: string;
    score: number;
    mcqScore: number;
    codingScore: number;
    testCasesPassed: number;
    totalTestCases: number;
    completionTimeSeconds: number;
    lastSubmissionTime?: string;
}
//# sourceMappingURL=index.d.ts.map