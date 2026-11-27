'use client';
import { useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sectionsApi, questionsApi, contestsApi, rubricsApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/apiClient';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Spinner } from '@/components/ui/Spinner';
import { ContestAttendanceTab } from '@/components/contest/ContestAttendanceTab';
import { ContestAssignmentsTab } from '@/components/contest/ContestAssignmentsTab';
import { ContestLeaderboardTab } from '@/components/contest/ContestLeaderboardTab';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Code2,
  CheckSquare,
  Layers,
  FileQuestion,
  Users,
  Trophy,
  BarChart3,
  UserCheck,
  AlertCircle,
  X,
  Edit2,
  Power,
  PowerOff,
  Calendar,
  Mail,
} from 'lucide-react';

interface Section {
  _id: string;
  title: string;
  order: number;
}

interface Question {
  _id: string;
  title: string;
  statement: string;
  type: 'mcq' | 'coding';
  marks: number;
  negativeMarks?: number;
  sectionId: string;
  isMultiSelect?: boolean;
  mcqOptions?: McqOption[];
  codingConfig?: {
    inputFormat?: string;
    outputFormat?: string;
    constraints?: string;
    testCases?: Array<{
      id?: string;
      input: string;
      expectedOutput?: string;
      output?: string;
      isHidden?: boolean;
      isSample?: boolean;
      weight?: number;
      explanation?: string;
    }>;
  };
}

interface McqOption {
  id?: string;
  text: string;
  isCorrect: boolean;
}

interface TestCase {
  input: string;
  output: string;
  isHidden: boolean;
}

const EMPTY_MCQ = {
  title: '',
  statement: '',
  marks: 10,
  negativeMarks: 0,
  isMultiSelect: false,
  options: [
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ],
};

const EMPTY_CODING = {
  title: '',
  statement: '',
  marks: 50,
  negativeMarks: 0,
  inputFormat: '',
  outputFormat: '',
  constraints: '',
  testCases: [
    { input: '2\n3', output: '5', isHidden: false },
    { input: '10\n20', output: '30', isHidden: true },
  ],
};

export default function ContestDetailPage() {
  const { id: contestId } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'questions';

  const setTab = (tabKey: string) => {
    router.replace(`/contests/${contestId}?tab=${tabKey}`, { scroll: false });
  };

  const qc = useQueryClient();

  const [addSection, setAddSection] = useState(false);
  const [sectionTitle, setSectionTitle] = useState('');
  const [addQModal, setAddQModal] = useState<{ sectionId: string; type: 'mcq' | 'coding' } | null>(null);
  const [editQModal, setEditQModal] = useState<Question | null>(null);
  const [mcqForm, setMcqForm] = useState({ ...EMPTY_MCQ });
  const [codingForm, setCodingForm] = useState({ ...EMPTY_CODING });
  const [editMcqForm, setEditMcqForm] = useState({ ...EMPTY_MCQ });
  const [editCodingForm, setEditCodingForm] = useState({ ...EMPTY_CODING });
  const [deleteQ, setDeleteQ] = useState<string | null>(null);
  const [deleteSec, setDeleteSec] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: contestData } = useQuery({
    queryKey: ['contest', contestId],
    queryFn: () => contestsApi.get(contestId),
  });
  const contest = contestData as any;

  const { data: rubricsData } = useQuery({
    queryKey: ['rubrics'],
    queryFn: rubricsApi.list,
  });
  const rubrics: any[] = (rubricsData as any[]) || [];

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    batchCode: '',
    startTime: '',
    endTime: '',
    durationMinutes: 180,
    activationMode: 'scheduled',
    rubricId: '',
    description: '',
    instructions: '',
    proctorEnabled: true,
    detectTabSwitch: true,
    blockCopyPaste: true,
    enforceFullscreen: true,
    blockRightClick: true,
    maxViolations: 5,
    leaderboardEnabled: true,
    leaderboardAnonymous: false,
    leaderboardTopN: 50,
    showTotalPointsEarned: true,
    codeRunCooldownSeconds: 30,
    maxCodeSubmissions: 3,
    randomizeQuestions: false,
    questionsPerParticipant: 2,
  });

  const openEditContest = () => {
    if (!contest) return;
    setErrorMsg(null);
    setEditForm({
      title: contest.title || '',
      batchCode: contest.batchCode || '',
      startTime: contest.startTime?.slice(0, 16) || '',
      endTime: contest.endTime?.slice(0, 16) || '',
      durationMinutes: contest.durationMinutes || 60,
      activationMode: (contest as any).activationMode || 'scheduled',
      rubricId: contest.rubricId || '',
      description: contest.description || '',
      instructions: contest.instructions || '',
      proctorEnabled: contest.proctorConfig?.enabled ?? true,
      detectTabSwitch: contest.proctorConfig?.detectTabSwitch ?? true,
      blockCopyPaste: contest.proctorConfig?.blockCopyPaste ?? true,
      enforceFullscreen: contest.proctorConfig?.enforceFullscreen ?? true,
      blockRightClick: contest.proctorConfig?.blockRightClick ?? true,
      maxViolations: contest.proctorConfig?.maxViolations ?? 5,
      leaderboardEnabled: contest.leaderboardConfig?.enabled ?? true,
      leaderboardAnonymous: contest.leaderboardConfig?.displayMode === 'anonymous',
      leaderboardTopN: contest.leaderboardConfig?.topN ?? 50,
      showTotalPointsEarned: contest.showTotalPointsEarned ?? true,
      codeRunCooldownSeconds: contest.codeRunCooldownSeconds ?? 30,
      maxCodeSubmissions: contest.maxCodeSubmissions ?? 3,
      randomizeQuestions: Boolean(contest.randomizeQuestions),
      questionsPerParticipant: contest.questionsPerParticipant || 2,
    });
    setShowEditModal(true);
  };

  const toggleContestMutation = useMutation({
    mutationFn: (isTurnedOff: boolean) => contestsApi.toggleStatus(contestId, isTurnedOff),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contest', contestId] });
      qc.invalidateQueries({ queryKey: ['contests'] });
    },
    onError: (err: any) => {
      setErrorMsg(getErrorMessage(err, 'Failed to update contest status'));
    },
  });

  const updateContestMutation = useMutation({
    mutationFn: async () => {
      setErrorMsg(null);
      if (!editForm.title.trim()) {
        throw new Error('Contest title is required.');
      }
      const isManual = editForm.activationMode === 'manual';
      const startIso = isManual ? new Date().toISOString() : (editForm.startTime ? new Date(editForm.startTime).toISOString() : undefined);
      const endIso = isManual ? new Date(Date.now() + 365 * 86400000).toISOString() : (editForm.endTime ? new Date(editForm.endTime).toISOString() : undefined);

      return contestsApi.update(contestId, {
        title: editForm.title.trim(),
        batchCode: editForm.batchCode?.trim() || undefined,
        description: editForm.description.trim() || undefined,
        instructions: editForm.instructions.trim() || undefined,
        activationMode: editForm.activationMode || 'scheduled',
        startTime: startIso,
        endTime: endIso,
        durationMinutes: Number(editForm.durationMinutes) || 60,
        rubricId: editForm.rubricId || undefined,
        proctorConfig: {
          enabled: editForm.proctorEnabled,
          detectTabSwitch: editForm.detectTabSwitch,
          detectWindowBlur: true,
          blockCopyPaste: editForm.blockCopyPaste,
          blockRightClick: editForm.blockRightClick,
          enforceFullscreen: editForm.enforceFullscreen,
          blockDevTools: true,
          blockPrintScreen: true,
          blockTextSelection: true,
          maxViolations: Number(editForm.maxViolations) || 5,
          violationAction: 'warn',
        },
        leaderboardConfig: {
          enabled: editForm.leaderboardEnabled,
          displayMode: editForm.leaderboardAnonymous ? 'anonymous' : 'with_names',
          topN: Number(editForm.leaderboardTopN) || 50,
          freezeMinutesBeforeEnd: 0,
        },
        showTotalPointsEarned: editForm.showTotalPointsEarned,
        codeRunCooldownSeconds: Number(editForm.codeRunCooldownSeconds) ?? 30,
        maxCodeSubmissions: Number(editForm.maxCodeSubmissions) ?? 3,
        randomizeQuestions: editForm.randomizeQuestions,
        questionsPerParticipant: Number(editForm.questionsPerParticipant) || 2,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contest', contestId] });
      qc.invalidateQueries({ queryKey: ['contests'] });
      setShowEditModal(false);
    },
    onError: (err: any) => {
      setErrorMsg(getErrorMessage(err, 'Failed to update contest'));
    },
  });

  const { data: sectionsData, isLoading: secLoading } = useQuery({
    queryKey: ['sections', contestId],
    queryFn: () => sectionsApi.getByContest(contestId),
  });
  const sections: Section[] = (sectionsData as Section[]) || [];

  const { data: questionsData, isLoading: qLoading } = useQuery({
    queryKey: ['questions', contestId],
    queryFn: () => questionsApi.getByContest(contestId),
  });
  const questions: Question[] = (questionsData as Question[]) || [];

  const createSection = useMutation({
    mutationFn: async () => {
      setErrorMsg(null);
      return sectionsApi.create({
        contestId,
        title: sectionTitle.trim(),
        order: sections.length,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sections', contestId] });
      setAddSection(false);
      setSectionTitle('');
    },
    onError: (err: any) => {
      setErrorMsg(getErrorMessage(err, 'Failed to create section'));
    },
  });

  const deleteSection = useMutation({
    mutationFn: (id: string) => sectionsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sections', contestId] });
      setDeleteSec(null);
    },
  });

  const createMcq = useMutation({
    mutationFn: async (sectionId: string) => {
      setErrorMsg(null);
      const statement = mcqForm.statement.trim() || mcqForm.title.trim() || 'Select the correct answer.';
      if (statement.length < 5) {
        throw new Error('Problem statement must be at least 5 characters');
      }

      const mcqOptions = mcqForm.options
        .filter((o) => o.text.trim().length > 0)
        .map((o, idx) => ({
          id: `opt_${Date.now()}_${idx}`,
          text: o.text.trim(),
          isCorrect: Boolean(o.isCorrect),
        }));

      if (mcqOptions.length < 2) {
        throw new Error('Please provide at least 2 non-empty options for MCQ');
      }

      const hasCorrect = mcqOptions.some((o) => o.isCorrect);
      if (!hasCorrect) {
        throw new Error('Please mark at least one option as correct');
      }

      return questionsApi.create({
        contestId,
        sectionId,
        type: 'mcq',
        title: mcqForm.title.trim(),
        statement,
        marks: Number(mcqForm.marks) || 1,
        negativeMarks: Number(mcqForm.negativeMarks) || 0,
        isMultiSelect: mcqForm.isMultiSelect,
        mcqOptions,
        order: questions.filter((q) => q.sectionId === sectionId).length,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['questions', contestId] });
      setAddQModal(null);
      setMcqForm({ ...EMPTY_MCQ });
    },
    onError: (err: any) => {
      setErrorMsg(getErrorMessage(err, 'Failed to create MCQ'));
    },
  });

  const createCoding = useMutation({
    mutationFn: async (sectionId: string) => {
      setErrorMsg(null);
      const statement = codingForm.statement.trim() || codingForm.title.trim() || 'Write a program to solve this problem.';
      if (statement.length < 5) {
        throw new Error('Problem statement must be at least 5 characters');
      }

      const testCases = codingForm.testCases.map((tc, idx) => ({
        id: `tc_${Date.now()}_${idx}`,
        input: tc.input || '',
        expectedOutput: tc.output || '',
        isSample: !tc.isHidden,
        isHidden: Boolean(tc.isHidden),
        weight: 1,
        explanation: '',
      }));

      return questionsApi.create({
        contestId,
        sectionId,
        type: 'coding',
        title: codingForm.title.trim(),
        statement,
        marks: Number(codingForm.marks) || 10,
        negativeMarks: Number(codingForm.negativeMarks) || 0,
        order: questions.filter((q) => q.sectionId === sectionId).length,
        codingConfig: {
          inputFormat: codingForm.inputFormat || '',
          outputFormat: codingForm.outputFormat || '',
          constraints: codingForm.constraints || '',
          timeLimitMs: 2000,
          memoryLimitMb: 256,
          allowedLanguages: ['python', 'javascript', 'cpp', 'java'],
          starterCode: {
            python: '# Write your Python solution here\nimport sys\n\ndef solve():\n    lines = sys.stdin.read().splitlines()\n    # TODO\n\nif __name__ == "__main__":\n    solve()\n',
            javascript: '// Write your JavaScript solution here\nconst fs = require("fs");\nconst input = fs.readFileSync(0, "utf-8").trim();\nconsole.log(input);\n',
          },
          testCases,
        },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['questions', contestId] });
      setAddQModal(null);
      setCodingForm({ ...EMPTY_CODING });
    },
    onError: (err: any) => {
      setErrorMsg(getErrorMessage(err, 'Failed to create coding problem'));
    },
  });

  const deleteQuestion = useMutation({
    mutationFn: (id: string) => questionsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['questions', contestId] });
      setDeleteQ(null);
    },
  });

  const openAddQ = (sectionId: string, type: 'mcq' | 'coding') => {
    setErrorMsg(null);
    if (type === 'mcq') setMcqForm({ ...EMPTY_MCQ });
    else setCodingForm({ ...EMPTY_CODING });
    setAddQModal({ sectionId, type });
  };

  const openEditQ = (q: Question) => {
    setErrorMsg(null);
    setEditQModal(q);
    if (q.type === 'mcq') {
      const opts = (q.mcqOptions && q.mcqOptions.length > 0)
        ? q.mcqOptions.map((o: any, idx: number) => ({
            id: o.id || `opt_${idx}`,
            text: o.text || '',
            isCorrect: Boolean(o.isCorrect),
          }))
        : [...EMPTY_MCQ.options];
      setEditMcqForm({
        title: q.title || '',
        statement: q.statement || '',
        marks: Number(q.marks) || 10,
        negativeMarks: Number(q.negativeMarks) || 0,
        isMultiSelect: Boolean(q.isMultiSelect),
        options: opts,
      });
    } else {
      const tcs = (q.codingConfig?.testCases && q.codingConfig.testCases.length > 0)
        ? q.codingConfig.testCases.map((tc: any, idx: number) => ({
            id: tc.id || `tc_${idx}`,
            input: tc.input || '',
            output: tc.expectedOutput || tc.output || '',
            isHidden: Boolean(tc.isHidden),
            isSample: tc.isSample !== undefined ? tc.isSample : !tc.isHidden,
            weight: tc.weight ?? 1,
            explanation: tc.explanation || '',
          }))
        : [...EMPTY_CODING.testCases];
      setEditCodingForm({
        title: q.title || '',
        statement: q.statement || '',
        marks: Number(q.marks) || 50,
        negativeMarks: Number(q.negativeMarks) || 0,
        inputFormat: q.codingConfig?.inputFormat || '',
        outputFormat: q.codingConfig?.outputFormat || '',
        constraints: q.codingConfig?.constraints || '',
        testCases: tcs,
      });
    }
  };

  const updateQuestionMutation = useMutation({
    mutationFn: async () => {
      if (!editQModal) return;
      setErrorMsg(null);
      const qId = editQModal._id || (editQModal as any).id;

      if (editQModal.type === 'mcq') {
        const statement = editMcqForm.statement.trim() || editMcqForm.title.trim() || 'Select the correct answer.';
        if (statement.length < 5) {
          throw new Error('Problem statement must be at least 5 characters');
        }
        const existingOpts = editQModal.mcqOptions || [];
        const mcqOptions = editMcqForm.options
          .filter((o) => o.text.trim().length > 0)
          .map((o: any, idx) => ({
            id: o.id || existingOpts[idx]?.id || `opt_${Date.now()}_${idx}`,
            text: o.text.trim(),
            isCorrect: Boolean(o.isCorrect),
          }));
        if (mcqOptions.length < 2) {
          throw new Error('Please provide at least 2 non-empty options for MCQ');
        }
        if (!mcqOptions.some((o) => o.isCorrect)) {
          throw new Error('Please mark at least one option as correct');
        }

        return questionsApi.update(qId, {
          title: editMcqForm.title.trim(),
          statement,
          marks: Number(editMcqForm.marks) || 10,
          negativeMarks: Number(editMcqForm.negativeMarks) || 0,
          isMultiSelect: editMcqForm.isMultiSelect,
          mcqOptions,
        });
      } else {
        const statement = editCodingForm.statement.trim() || editCodingForm.title.trim() || 'Write a program to solve this problem.';
        if (statement.length < 5) {
          throw new Error('Problem statement must be at least 5 characters');
        }
        const existingConfig = editQModal.codingConfig || {};
        const existingTcs = existingConfig.testCases || [];
        const testCases = editCodingForm.testCases.map((tc: any, idx) => ({
          id: tc.id || existingTcs[idx]?.id || `tc_${Date.now()}_${idx}`,
          input: tc.input || '',
          expectedOutput: tc.output || '',
          isSample: tc.isSample !== undefined ? tc.isSample : !tc.isHidden,
          isHidden: Boolean(tc.isHidden),
          weight: tc.weight ?? existingTcs[idx]?.weight ?? 1,
          explanation: tc.explanation || existingTcs[idx]?.explanation || '',
        }));

        return questionsApi.update(qId, {
          title: editCodingForm.title.trim(),
          statement,
          marks: Number(editCodingForm.marks) || 50,
          negativeMarks: Number(editCodingForm.negativeMarks) || 0,
          codingConfig: {
            ...existingConfig,
            inputFormat: editCodingForm.inputFormat || existingConfig.inputFormat || '',
            outputFormat: editCodingForm.outputFormat || existingConfig.outputFormat || '',
            constraints: editCodingForm.constraints || existingConfig.constraints || '',
            testCases,
          },
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['questions', contestId] });
      setEditQModal(null);
    },
    onError: (err: any) => {
      setErrorMsg(getErrorMessage(err, 'Failed to update question'));
    },
  });

  const isLoading = secLoading || qLoading;

  const TABS = [
    { key: 'questions', label: 'Questions & Sections', icon: Layers },
    { key: 'assignments', label: 'Assignments', icon: Users },
    { key: 'invitations', label: 'Email Invitations', icon: Mail },
    { key: 'attendance', label: 'Live Attendance', icon: UserCheck },
    { key: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  ];

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/contests"
            className="flex items-center gap-1.5 text-xs font-semibold text-[#3760F8] hover:text-[#254EDB] px-3 py-1.5 rounded-lg bg-[#EEF2FF] hover:bg-[#E0E7FF] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Contests</span>
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{contest?.title || 'Contest Management'}</h1>
              {contest?.isTurnedOff ? (
                <Badge color="red">TURNED OFF</Badge>
              ) : (
                contest?.status && <Badge color="blue">{contest.status.toUpperCase()}</Badge>
              )}
              {contest?.batchCode && (
                <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-md bg-[#EEF2FF] text-[#3760F8] border border-[#C7D2FE]">
                  Batch: {contest.batchCode}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Centralized Hub &bull; Sections, Assignments, Attendance &amp; Rankings</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={contest?.isTurnedOff ? 'primary' : 'outline'}
            size="sm"
            className={contest?.isTurnedOff ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold' : 'text-amber-700 hover:bg-amber-50 border-amber-300'}
            onClick={() => toggleContestMutation.mutate(!contest?.isTurnedOff)}
            loading={toggleContestMutation.isPending}
            leftIcon={contest?.isTurnedOff ? <Power className="w-3.5 h-3.5" /> : <PowerOff className="w-3.5 h-3.5" />}
          >
            {contest?.isTurnedOff ? 'Turn Contest ON' : 'Turn Contest OFF'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={openEditContest}
            leftIcon={<Edit2 className="w-3.5 h-3.5 text-[#3760F8]" />}
          >
            Edit Contest
          </Button>
          <Link href={`/reports/${contestId}`}>
            <Button variant="outline" size="sm" leftIcon={<BarChart3 className="w-3.5 h-3.5 text-slate-500" />}>
              Analytics Report
            </Button>
          </Link>
        </div>
      </div>

      {/* Tab Navigation Strip (URL State Preserved) */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2 overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#3760F8] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Views */}
      {activeTab === 'assignments' ? (
        <ContestAssignmentsTab contestId={contestId} />
      ) : activeTab === 'invitations' ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#3760F8]" />
                <span>Candidate Email Invitations</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Dispatch official test invitation emails with credentials, batch code, portal URL, and login instructions.
              </p>
            </div>
            <Link href={`/invitations?contestId=${contestId}`}>
              <Button size="sm" leftIcon={<Mail className="w-3.5 h-3.5" />}>
                Open Full Invitations Hub &rarr;
              </Button>
            </Link>
          </div>
        </div>
      ) : activeTab === 'attendance' ? (
        <ContestAttendanceTab contestId={contestId} />
      ) : activeTab === 'leaderboard' ? (
        <ContestLeaderboardTab contestId={contestId} />
      ) : (
        /* ================== QUESTIONS & SECTIONS TAB ================== */
        isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Contest Questions & Total Marks Banner */}
            <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-white p-5 rounded-2xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <FileQuestion className="w-4 h-4 text-[#3760F8]" />
                  <span>Question-Wise Marks Allocation</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Assign marks per question. The total contest score is automatically calculated from the sum of question marks.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-white px-3.5 py-2 rounded-xl border border-blue-200 shadow-2xs text-center">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Questions</div>
                  <div className="text-base font-extrabold text-slate-800 font-mono">{questions.length}</div>
                </div>
                <div className="bg-white px-4 py-2 rounded-xl border border-[#3760F8]/30 shadow-2xs text-center">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#3760F8]">Total Contest Marks</div>
                  <div className="text-base font-extrabold text-[#3760F8] font-mono">
                    {questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0)} Marks
                  </div>
                </div>
              </div>
            </div>

          {sections.map((section) => {
            const sectionQuestions = questions.filter((q) => q.sectionId === section._id);
            return (
              <div
                key={section._id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden"
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4 text-[#3760F8]" />
                    <h2 className="font-bold text-slate-900 text-sm tracking-tight">{section.title}</h2>
                    <span className="text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full ml-1">
                      {sectionQuestions.length} Questions &bull; {sectionQuestions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0)} Marks Total
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openAddQ(section._id, 'mcq')}
                      leftIcon={<Plus className="w-3 h-3 text-[#3760F8]" />}
                    >
                      Add MCQ
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openAddQ(section._id, 'coding')}
                      leftIcon={<Plus className="w-3 h-3 text-[#3760F8]" />}
                    >
                      Add Coding
                    </Button>
                    <button
                      onClick={() => setDeleteSec(section._id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Delete Section"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {sectionQuestions.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No questions added yet to this section. Click &ldquo;Add MCQ&rdquo; or &ldquo;Add Coding&rdquo; above.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {sectionQuestions.map((q, qi) => (
                      <div
                        key={q._id}
                        className="flex items-center gap-3.5 px-6 py-3.5 hover:bg-slate-50/60 transition-colors"
                      >
                        <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 font-mono">
                          {qi + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-900 truncate tracking-tight">{q.title}</p>
                          {q.statement && <p className="text-[11px] text-slate-500 line-clamp-1">{q.statement}</p>}
                        </div>
                        <Badge color={q.type === 'coding' ? 'purple' : 'primary'}>
                          {q.type === 'coding' ? 'Coding' : 'MCQ'}
                        </Badge>
                        <span className="text-xs font-mono font-bold text-[#3760F8] bg-[#EEF2FF] px-2.5 py-0.5 rounded-md border border-[#C7D2FE]">
                          {q.marks} Marks
                        </span>
                        {q.negativeMarks ? (
                          <span className="text-xs font-mono font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                            -{q.negativeMarks} Penalty
                          </span>
                        ) : null}
                        <button
                          onClick={() => openEditQ(q)}
                          className="p-1.5 text-slate-400 hover:text-[#3760F8] hover:bg-[#EEF2FF] rounded-lg transition-colors ml-1"
                          title="Edit Question & Marks Allocation"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteQ(q._id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Question"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <button
            onClick={() => {
              setErrorMsg(null);
              setSectionTitle('');
              setAddSection(true);
            }}
            className="w-full border-2 border-dashed border-slate-200 hover:border-[#3760F8] rounded-2xl py-5 text-slate-500 hover:text-[#3760F8] hover:bg-[#EEF2FF]/20 transition-all text-xs font-semibold flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Contest Section</span>
          </button>
        </div>
      ))}

      {/* Add Section Modal */}
      <Modal open={addSection} onClose={() => setAddSection(false)} title="Add Contest Section" size="sm">
        <div className="space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          <Input
            label="Section Title"
            value={sectionTitle}
            onChange={(e) => setSectionTitle(e.target.value)}
            placeholder="e.g. Section A: Multiple Choice Questions"
          />
          <div className="flex gap-2.5 justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setAddSection(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => createSection.mutate()}
              loading={createSection.isPending}
              disabled={!sectionTitle.trim()}
            >
              Add Section
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add MCQ Modal */}
      <Modal
        open={!!addQModal && addQModal.type === 'mcq'}
        onClose={() => setAddQModal(null)}
        title="Create Multiple Choice Question"
        size="lg"
      >
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {errorMsg && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <Input
            label="Question Title *"
            value={mcqForm.title}
            onChange={(e) => setMcqForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Time complexity of QuickSelect"
          />

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Problem Statement / Question *</label>
            <textarea
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-[#3760F8]/30 focus:outline-none"
              rows={3}
              value={mcqForm.statement}
              onChange={(e) => setMcqForm((f) => ({ ...f, statement: e.target.value }))}
              placeholder="State the question clearly..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Allocated Marks (e.g. 10) *"
              type="number"
              min="1"
              value={String(mcqForm.marks)}
              onChange={(e) => setMcqForm((f) => ({ ...f, marks: Number(e.target.value) }))}
            />
            <Input
              label="Negative Penalty"
              type="number"
              min="0"
              value={String(mcqForm.negativeMarks)}
              onChange={(e) => setMcqForm((f) => ({ ...f, negativeMarks: Number(e.target.value) }))}
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 accent-[#3760F8] rounded"
              checked={mcqForm.isMultiSelect}
              onChange={(e) => setMcqForm((f) => ({ ...f, isMultiSelect: e.target.checked }))}
            />
            <span>Multiple Choice (Multiple Correct Options Allowed)</span>
          </label>

          <div className="space-y-2.5 pt-1">
            <label className="text-xs font-bold text-slate-800 block">
              Options &amp; Correct Answer Checkbox (Check the correct answer)
            </label>
            {mcqForm.options.map((opt, oi) => (
              <div key={oi} className="flex items-center gap-2.5">
                <input
                  type={mcqForm.isMultiSelect ? 'checkbox' : 'radio'}
                  name="mcqCorrectOption"
                  className="w-4 h-4 accent-[#3760F8] rounded cursor-pointer"
                  checked={opt.isCorrect}
                  onChange={(e) =>
                    setMcqForm((f) => ({
                      ...f,
                      options: f.options.map((o, i) =>
                        mcqForm.isMultiSelect
                          ? i === oi
                            ? { ...o, isCorrect: e.target.checked }
                            : o
                          : { ...o, isCorrect: i === oi }
                      ),
                    }))
                  }
                />
                <input
                  className="flex-1 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-[#3760F8]/30 focus:outline-none"
                  value={opt.text}
                  placeholder={`Option ${String.fromCharCode(65 + oi)} text`}
                  onChange={(e) =>
                    setMcqForm((f) => ({
                      ...f,
                      options: f.options.map((o, i) => (i === oi ? { ...o, text: e.target.value } : o)),
                    }))
                  }
                />
              </div>
            ))}
          </div>

          <div className="flex gap-2.5 justify-end pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setAddQModal(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => addQModal && createMcq.mutate(addQModal.sectionId)}
              loading={createMcq.isPending}
              disabled={!mcqForm.title.trim()}
            >
              Add MCQ Question
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Coding Modal */}
      <Modal
        open={!!addQModal && addQModal.type === 'coding'}
        onClose={() => setAddQModal(null)}
        title="Create Coding Problem"
        size="xl"
      >
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {errorMsg && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <Input
            label="Problem Title *"
            value={codingForm.title}
            onChange={(e) => setCodingForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Two Sum / Array Balancing"
          />

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Problem Description &amp; Requirements *</label>
            <textarea
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-[#3760F8]/30 focus:outline-none font-sans"
              rows={4}
              value={codingForm.statement}
              onChange={(e) => setCodingForm((f) => ({ ...f, statement: e.target.value }))}
              placeholder="Describe problem specification, inputs, outputs and constraints..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Allocated Marks (e.g. 50) *"
              type="number"
              min="1"
              value={String(codingForm.marks)}
              onChange={(e) => setCodingForm((f) => ({ ...f, marks: Number(e.target.value) }))}
            />
            <Input
              label="Negative Penalty"
              type="number"
              min="0"
              value={String(codingForm.negativeMarks)}
              onChange={(e) => setCodingForm((f) => ({ ...f, negativeMarks: Number(e.target.value) }))}
            />
          </div>

          {/* Test Cases */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">Test Cases Suite</label>
              <button
                type="button"
                className="text-xs font-semibold text-[#3760F8] hover:underline flex items-center gap-1"
                onClick={() =>
                  setCodingForm((f) => ({
                    ...f,
                    testCases: [...f.testCases, { input: '', output: '', isHidden: false }],
                  }))
                }
              >
                <Plus className="w-3.5 h-3.5" /> Add Test Case
              </button>
            </div>

            {codingForm.testCases.map((tc, ti) => (
              <div key={ti} className="border border-slate-200 rounded-2xl p-3.5 space-y-2.5 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 font-mono">Case #{ti + 1}</span>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        className="accent-[#3760F8] rounded"
                        checked={tc.isHidden}
                        onChange={(e) =>
                          setCodingForm((f) => ({
                            ...f,
                            testCases: f.testCases.map((t, i) => (i === ti ? { ...t, isHidden: e.target.checked } : t)),
                          }))
                        }
                      />
                      <span>Hidden Evaluation Test</span>
                    </label>
                    {codingForm.testCases.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setCodingForm((f) => ({
                            ...f,
                            testCases: f.testCases.filter((_, i) => i !== ti),
                          }))
                        }
                        className="text-slate-400 hover:text-rose-600"
                        title="Remove test case"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Standard Input (STDIN)</label>
                    <textarea
                      className="w-full border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono focus:ring-1 focus:ring-[#3760F8] focus:outline-none bg-white"
                      rows={2}
                      value={tc.input}
                      onChange={(e) =>
                        setCodingForm((f) => ({
                          ...f,
                          testCases: f.testCases.map((t, i) => (i === ti ? { ...t, input: e.target.value } : t)),
                        }))
                      }
                      placeholder="Input data"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Expected Output (STDOUT)</label>
                    <textarea
                      className="w-full border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono focus:ring-1 focus:ring-[#3760F8] focus:outline-none bg-white"
                      rows={2}
                      value={tc.output}
                      onChange={(e) =>
                        setCodingForm((f) => ({
                          ...f,
                          testCases: f.testCases.map((t, i) => (i === ti ? { ...t, output: e.target.value } : t)),
                        }))
                      }
                      placeholder="Expected output"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2.5 justify-end pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setAddQModal(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => addQModal && createCoding.mutate(addQModal.sectionId)}
              loading={createCoding.isPending}
              disabled={!codingForm.title.trim()}
            >
              Add Coding Problem
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Question & Marks Allocation Modal */}
      <Modal
        open={!!editQModal}
        onClose={() => setEditQModal(null)}
        title={editQModal?.type === 'coding' ? 'Edit Coding Problem & Marks Allocation' : 'Edit MCQ & Marks Allocation'}
        size={editQModal?.type === 'coding' ? 'xl' : 'lg'}
      >
        {editQModal?.type === 'mcq' ? (
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            {errorMsg && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <Input
              label="Question Title *"
              value={editMcqForm.title}
              onChange={(e) => setEditMcqForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Time complexity of QuickSelect"
            />

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Problem Statement / Question *</label>
              <textarea
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-[#3760F8]/30 focus:outline-none"
                rows={3}
                value={editMcqForm.statement}
                onChange={(e) => setEditMcqForm((f) => ({ ...f, statement: e.target.value }))}
                placeholder="State the question clearly..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Allocated Marks (e.g. 10) *"
                type="number"
                min="1"
                value={String(editMcqForm.marks)}
                onChange={(e) => setEditMcqForm((f) => ({ ...f, marks: Number(e.target.value) }))}
              />
              <Input
                label="Negative Penalty"
                type="number"
                min="0"
                value={String(editMcqForm.negativeMarks)}
                onChange={(e) => setEditMcqForm((f) => ({ ...f, negativeMarks: Number(e.target.value) }))}
              />
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 accent-[#3760F8] rounded"
                checked={editMcqForm.isMultiSelect}
                onChange={(e) => setEditMcqForm((f) => ({ ...f, isMultiSelect: e.target.checked }))}
              />
              <span>Multiple Choice (Multiple Correct Options Allowed)</span>
            </label>

            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 block">
                  Options &amp; Correct Answer Checkbox
                </label>
                <button
                  type="button"
                  className="text-xs font-semibold text-[#3760F8] hover:underline flex items-center gap-1"
                  onClick={() =>
                    setEditMcqForm((f) => ({
                      ...f,
                      options: [...f.options, { text: '', isCorrect: false }],
                    }))
                  }
                >
                  <Plus className="w-3.5 h-3.5" /> Add Option
                </button>
              </div>
              {editMcqForm.options.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2.5">
                  <input
                    type={editMcqForm.isMultiSelect ? 'checkbox' : 'radio'}
                    name="editMcqCorrectOption"
                    className="w-4 h-4 accent-[#3760F8] rounded cursor-pointer"
                    checked={opt.isCorrect}
                    onChange={(e) =>
                      setEditMcqForm((f) => ({
                        ...f,
                        options: f.options.map((o, i) =>
                          editMcqForm.isMultiSelect
                            ? i === oi
                              ? { ...o, isCorrect: e.target.checked }
                              : o
                            : { ...o, isCorrect: i === oi }
                        ),
                      }))
                    }
                  />
                  <input
                    className="flex-1 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-[#3760F8]/30 focus:outline-none"
                    value={opt.text}
                    placeholder={`Option ${String.fromCharCode(65 + oi)} text`}
                    onChange={(e) =>
                      setEditMcqForm((f) => ({
                        ...f,
                        options: f.options.map((o, i) => (i === oi ? { ...o, text: e.target.value } : o)),
                      }))
                    }
                  />
                  {editMcqForm.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() =>
                        setEditMcqForm((f) => ({
                          ...f,
                          options: f.options.filter((_, i) => i !== oi),
                        }))
                      }
                      className="text-slate-400 hover:text-rose-600 p-1"
                      title="Remove Option"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2.5 justify-end pt-3 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setEditQModal(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => updateQuestionMutation.mutate()}
                loading={updateQuestionMutation.isPending}
                disabled={!editMcqForm.title.trim()}
              >
                Save Changes
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            {errorMsg && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <Input
              label="Problem Title *"
              value={editCodingForm.title}
              onChange={(e) => setEditCodingForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Two Sum / Array Balancing"
            />

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Problem Description &amp; Requirements *</label>
              <textarea
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-[#3760F8]/30 focus:outline-none font-sans"
                rows={4}
                value={editCodingForm.statement}
                onChange={(e) => setEditCodingForm((f) => ({ ...f, statement: e.target.value }))}
                placeholder="Describe problem specification, inputs, outputs and constraints..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Allocated Marks (e.g. 50) *"
                type="number"
                min="1"
                value={String(editCodingForm.marks)}
                onChange={(e) => setEditCodingForm((f) => ({ ...f, marks: Number(e.target.value) }))}
              />
              <Input
                label="Negative Penalty"
                type="number"
                min="0"
                value={String(editCodingForm.negativeMarks)}
                onChange={(e) => setEditCodingForm((f) => ({ ...f, negativeMarks: Number(e.target.value) }))}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Input Format (Optional)"
                value={editCodingForm.inputFormat}
                onChange={(e) => setEditCodingForm((f) => ({ ...f, inputFormat: e.target.value }))}
                placeholder="e.g. First line contains N"
              />
              <Input
                label="Output Format (Optional)"
                value={editCodingForm.outputFormat}
                onChange={(e) => setEditCodingForm((f) => ({ ...f, outputFormat: e.target.value }))}
                placeholder="e.g. Print single integer"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Constraints (Optional)</label>
              <input
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-[#3760F8]/30 focus:outline-none"
                value={editCodingForm.constraints}
                onChange={(e) => setEditCodingForm((f) => ({ ...f, constraints: e.target.value }))}
                placeholder="e.g. 1 <= N <= 10^5"
              />
            </div>

            {/* Test Cases */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">Test Cases Suite</label>
                <button
                  type="button"
                  className="text-xs font-semibold text-[#3760F8] hover:underline flex items-center gap-1"
                  onClick={() =>
                    setEditCodingForm((f) => ({
                      ...f,
                      testCases: [...f.testCases, { input: '', output: '', isHidden: false }],
                    }))
                  }
                >
                  <Plus className="w-3.5 h-3.5" /> Add Test Case
                </button>
              </div>

              {editCodingForm.testCases.map((tc, ti) => (
                <div key={ti} className="border border-slate-200 rounded-2xl p-3.5 space-y-2.5 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 font-mono">Case #{ti + 1}</span>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          className="accent-[#3760F8] rounded"
                          checked={tc.isHidden}
                          onChange={(e) =>
                            setEditCodingForm((f) => ({
                              ...f,
                              testCases: f.testCases.map((t, i) => (i === ti ? { ...t, isHidden: e.target.checked } : t)),
                            }))
                          }
                        />
                        <span>Hidden Evaluation Test</span>
                      </label>
                      {editCodingForm.testCases.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setEditCodingForm((f) => ({
                              ...f,
                              testCases: f.testCases.filter((_, i) => i !== ti),
                            }))
                          }
                          className="text-slate-400 hover:text-rose-600"
                          title="Remove test case"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Standard Input (STDIN)</label>
                      <textarea
                        className="w-full border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono focus:ring-1 focus:ring-[#3760F8] focus:outline-none bg-white"
                        rows={2}
                        value={tc.input}
                        onChange={(e) =>
                          setEditCodingForm((f) => ({
                            ...f,
                            testCases: f.testCases.map((t, i) => (i === ti ? { ...t, input: e.target.value } : t)),
                          }))
                        }
                        placeholder="Input data"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Expected Output (STDOUT)</label>
                      <textarea
                        className="w-full border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono focus:ring-1 focus:ring-[#3760F8] focus:outline-none bg-white"
                        rows={2}
                        value={tc.output}
                        onChange={(e) =>
                          setEditCodingForm((f) => ({
                            ...f,
                            testCases: f.testCases.map((t, i) => (i === ti ? { ...t, output: e.target.value } : t)),
                          }))
                        }
                        placeholder="Expected output"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2.5 justify-end pt-3 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setEditQModal(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => updateQuestionMutation.mutate()}
                loading={updateQuestionMutation.isPending}
                disabled={!editCodingForm.title.trim()}
              >
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Contest Settings Modal */}
      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Contest Settings" size="lg">
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {errorMsg && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <Input
            label="Contest Title *"
            placeholder="e.g. National Coding Olympiad 2026 - Round 1"
            value={editForm.title}
            onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
            required
          />

          <div>
            <Input
              label="Batch Code *"
              placeholder="e.g. BATCH2026 or AIML-A"
              value={editForm.batchCode}
              onChange={(e) => setEditForm((f) => ({ ...f, batchCode: e.target.value.toUpperCase() }))}
            />
            <p className="mt-1 text-[11px] text-slate-500 font-medium">
              Students will enter this batch code along with their email to attend this test.
            </p>
          </div>

          {/* Activation Mode Selector */}
          <div className="space-y-2 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Activation Mode *
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setEditForm((f) => ({ ...f, activationMode: 'scheduled' }))}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  (editForm.activationMode || 'scheduled') === 'scheduled'
                    ? 'border-[#3760F8] bg-blue-50/60 text-[#3760F8] ring-2 ring-[#3760F8]/20 font-bold'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#3760F8]" />
                  <span className="text-xs font-bold">Scheduled Timer</span>
                </div>
                <p className="text-[10px] text-slate-500 font-normal mt-1 leading-relaxed">
                  Auto-opens at start time and closes at end time.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setEditForm((f) => ({ ...f, activationMode: 'manual' }))}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  editForm.activationMode === 'manual'
                    ? 'border-emerald-600 bg-emerald-50/60 text-emerald-800 ring-2 ring-emerald-600/20 font-bold'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Power className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold">Manual Control</span>
                </div>
                <p className="text-[10px] text-slate-500 font-normal mt-1 leading-relaxed">
                  You turn the assessment ON/OFF live using the switch.
                </p>
              </button>
            </div>
          </div>

          {editForm.activationMode === 'manual' ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <Power className="w-3.5 h-3.5 text-emerald-600" />
                Manual Control Active
              </p>
              <p className="text-[11px] text-emerald-700 leading-relaxed">
                Scheduled timer is disabled. Students will take the test for the set duration whenever you turn the assessment ON.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Start Window *"
                type="datetime-local"
                value={editForm.startTime}
                onChange={(e) => setEditForm((f) => ({ ...f, startTime: e.target.value }))}
              />
              <Input
                label="End Window *"
                type="datetime-local"
                value={editForm.endTime}
                onChange={(e) => setEditForm((f) => ({ ...f, endTime: e.target.value }))}
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Duration (Minutes) *"
              type="number"
              min="5"
              value={String(editForm.durationMinutes)}
              onChange={(e) => setEditForm((f) => ({ ...f, durationMinutes: Number(e.target.value) }))}
            />
            <Select
              label="Evaluation Rubric"
              value={editForm.rubricId}
              onChange={(e) => setEditForm((f) => ({ ...f, rubricId: e.target.value }))}
            >
              <option value="">Default Standard Evaluation</option>
              {rubrics.map((r: any) => (
                <option key={r._id} value={r._id}>
                  {r.name}
                </option>
              ))}
            </Select>
          </div>

          <Input
            label="Description (Optional)"
            placeholder="Brief overview or eligibility criteria"
            value={editForm.description}
            onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
          />

          <Input
            label="Instructions for Candidates (Optional)"
            placeholder="e.g. All questions are mandatory. Ensure fullscreen mode."
            value={editForm.instructions}
            onChange={(e) => setEditForm((f) => ({ ...f, instructions: e.target.value }))}
          />

          {/* Security Proctoring Section */}
          <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="editClusterProctorEnabled"
                className="w-4 h-4 text-[#3760F8] accent-[#3760F8] rounded cursor-pointer"
                checked={editForm.proctorEnabled}
                onChange={(e) => setEditForm((f) => ({ ...f, proctorEnabled: e.target.checked }))}
              />
              <label htmlFor="editClusterProctorEnabled" className="text-xs font-bold text-slate-800 cursor-pointer">
                Enable Assessment Proctoring
              </label>
            </div>

            {editForm.proctorEnabled && (
              <div className="ml-6 space-y-2.5 text-xs text-slate-700 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="accent-[#3760F8]"
                      checked={editForm.detectTabSwitch}
                      onChange={(e) => setEditForm((f) => ({ ...f, detectTabSwitch: e.target.checked }))}
                    />
                    <span>Detect Tab Switches</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="accent-[#3760F8]"
                      checked={editForm.blockCopyPaste}
                      onChange={(e) => setEditForm((f) => ({ ...f, blockCopyPaste: e.target.checked }))}
                    />
                    <span>Block Copy &amp; Paste</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="accent-[#3760F8]"
                      checked={editForm.enforceFullscreen}
                      onChange={(e) => setEditForm((f) => ({ ...f, enforceFullscreen: e.target.checked }))}
                    />
                    <span>Enforce Fullscreen Mode</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="accent-[#3760F8]"
                      checked={editForm.blockRightClick}
                      onChange={(e) => setEditForm((f) => ({ ...f, blockRightClick: e.target.checked }))}
                    />
                    <span>Block Right Click &amp; Inspect</span>
                  </label>
                </div>

                <div className="pt-2 max-w-xs">
                  <Input
                    label="Max Violation Limit Before Flag"
                    type="number"
                    min="1"
                    max="50"
                    value={String(editForm.maxViolations)}
                    onChange={(e) => setEditForm((f) => ({ ...f, maxViolations: Number(e.target.value) }))}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Leaderboard Settings */}
          <div className="border border-slate-200 rounded-2xl p-4 space-y-2.5 bg-slate-50/50">
            <p className="text-xs font-bold text-slate-800">Leaderboard Configuration</p>
            <div className="flex flex-wrap gap-4 text-xs text-slate-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="accent-[#3760F8]"
                  checked={editForm.leaderboardEnabled}
                  onChange={(e) => setEditForm((f) => ({ ...f, leaderboardEnabled: e.target.checked }))}
                />
                <span>Visible to Candidates</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="accent-[#3760F8]"
                  checked={editForm.leaderboardAnonymous}
                  onChange={(e) => setEditForm((f) => ({ ...f, leaderboardAnonymous: e.target.checked }))}
                />
                <span>Anonymize Candidate Names</span>
              </label>
            </div>
          </div>

          {/* Score & Results Configuration */}
          <div className="border border-slate-200 rounded-2xl p-4 space-y-2.5 bg-slate-50/50">
            <p className="text-xs font-bold text-slate-800">Score &amp; Results Configuration</p>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
              <input
                type="checkbox"
                className="w-4 h-4 text-[#3760F8] accent-[#3760F8] rounded cursor-pointer"
                checked={editForm.showTotalPointsEarned}
                onChange={(e) => setEditForm((f) => ({ ...f, showTotalPointsEarned: e.target.checked }))}
              />
              <span className="font-semibold text-slate-800">Show Total Points Earned to candidate after test submission</span>
            </label>
            <p className="text-[11px] text-slate-500 ml-6">
              When unchecked, candidate results page will confirm submission but conceal points and score details.
            </p>
          </div>

          {/* Coding Submission Limits & Execution Quotas */}
          <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-slate-50/50">
            <div>
              <p className="text-xs font-bold text-slate-800">Coding Submission Limits &amp; Execution Quotas</p>
              <p className="text-[11px] text-slate-500">Configure compiler run rate limits and submission quotas for algorithmic challenges.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="edit-codeRunCooldown" className="text-[11px] font-bold text-slate-700 block mb-1">
                  Code Run Cooling Time (seconds)
                </label>
                <Input
                  id="edit-codeRunCooldown"
                  type="number"
                  min="0"
                  max="300"
                  value={String(editForm.codeRunCooldownSeconds ?? 30)}
                  onChange={(e) => setEditForm((f) => ({ ...f, codeRunCooldownSeconds: Math.max(0, Number(e.target.value)) }))}
                  placeholder="30"
                />
                <p className="text-[10px] text-slate-500 mt-1">Enforces cooldown between &quot;Run Code&quot; attempts (prevents API spamming).</p>
              </div>
              <div>
                <label htmlFor="edit-maxCodeSubmissions" className="text-[11px] font-bold text-slate-700 block mb-1">
                  Max Code Submissions per Question
                </label>
                <Input
                  id="edit-maxCodeSubmissions"
                  type="number"
                  min="1"
                  max="50"
                  value={String(editForm.maxCodeSubmissions ?? 3)}
                  onChange={(e) => setEditForm((f) => ({ ...f, maxCodeSubmissions: Math.max(1, Number(e.target.value)) }))}
                  placeholder="3"
                />
                <p className="text-[10px] text-slate-500 mt-1">Maximum number of times a candidate can submit code per challenge.</p>
              </div>
            </div>
          </div>

          {/* Dynamic Question Randomization */}
          <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="editRandomizeQuestions"
                className="w-4 h-4 text-[#3760F8] accent-[#3760F8] rounded cursor-pointer"
                checked={editForm.randomizeQuestions}
                onChange={(e) => setEditForm((f) => ({ ...f, randomizeQuestions: e.target.checked }))}
              />
              <label htmlFor="editRandomizeQuestions" className="text-xs font-bold text-slate-800 cursor-pointer">
                Enable Dynamic Question Randomization
              </label>
            </div>
            <p className="text-[11px] text-slate-500 ml-6">
              When enabled, each candidate receives a randomly selected subset of questions from the question bank. Their assigned questions remain persistent throughout the assessment session.
            </p>

            {editForm.randomizeQuestions && (
              <div className="ml-6 pt-1">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Questions to Assign per Participant *
                </label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={String(editForm.questionsPerParticipant || 2)}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, questionsPerParticipant: Math.max(1, Number(e.target.value)) }))
                  }
                  placeholder="2"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Example: If the contest bank has 40 questions and this is set to 2, each participant will receive 2 randomly assigned challenges.
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2.5 justify-end pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => updateContestMutation.mutate()}
              loading={updateContestMutation.isPending}
              disabled={!editForm.title.trim()}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        open={!!deleteQ}
        onClose={() => setDeleteQ(null)}
        onConfirm={() => deleteQ && deleteQuestion.mutate(deleteQ)}
        loading={deleteQuestion.isPending}
        title="Delete Question"
        message="Are you sure you want to delete this question? Any submitted attempts for this question will be impacted."
        danger
        confirmLabel="Delete"
      />
      <ConfirmDialog
        open={!!deleteSec}
        onClose={() => setDeleteSec(null)}
        onConfirm={() => deleteSec && deleteSection.mutate(deleteSec)}
        loading={deleteSection.isPending}
        title="Delete Section"
        message="Are you sure you want to delete this whole section and its questions?"
        danger
        confirmLabel="Delete Section"
      />
    </div>
  );
}
