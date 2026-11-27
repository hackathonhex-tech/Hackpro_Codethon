'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contestApi, proctorApi, authApi } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { isClientRunnable, runCodeInBrowser } from '@/lib/clientRunner';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Spinner } from '@/components/ui/Spinner';
import { CodeEditor } from '@/components/ui/CodeEditor';
import { AttemptSkeleton } from '@/components/ui/Skeleton';
import {
  Clock,
  AlertTriangle,
  Play,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  SendHorizontal,
  Code2,
  Terminal,
  RotateCcw,
  Bookmark,
  HelpCircle,
  FileText,
  ShieldCheck,
  Maximize2,
  Minimize2,
  CheckSquare,
  Sparkles,
  Info,
  CheckCircle2,
  X,
  Menu,
  Smartphone,
  WrapText,
} from 'lucide-react';

interface McqOption {
  id?: string;
  text: string;
}

interface TestCase {
  id?: string;
  input: string;
  expectedOutput?: string;
  output?: string;
  explanation?: string;
}

interface Question {
  _id?: string;
  id?: string;
  sectionId?: string;
  type: 'mcq' | 'coding';
  title: string;
  statement: string;
  marks: number;
  negativeMarks?: number;
  order?: number;
  isMultiSelect?: boolean;
  mcqOptions?: McqOption[];
  codingConfig?: {
    inputFormat?: string;
    outputFormat?: string;
    constraints?: string;
    examples?: string;
    timeLimitMs?: number;
    memoryLimitMb?: number;
    allowedLanguages?: string[];
    starterCode?: Record<string, string>;
    sampleTestCases?: TestCase[];
    hiddenTestCasesCount?: number;
  };
}

interface Section {
  _id?: string;
  id?: string;
  title: string;
  order?: number;
  questions: Question[];
}

interface ProctorConfig {
  enabled?: boolean;
  blockTabSwitch?: boolean;
  blockCopyPaste?: boolean;
  enforceFullscreen?: boolean;
  blockRightClick?: boolean;
  maxViolations?: number;
}

interface AttemptState {
  _id?: string;
  id?: string;
  status: string;
  remainingSeconds: number;
  sections?: Section[];
  questions?: Question[];
  savedAnswers?: any[];
  codeRunCooldownSeconds?: number;
  maxCodeSubmissions?: number;
  submissionCounts?: Record<string, number>;
  lastRunTimestamps?: Record<string, number>;
  contest?: {
    id?: string;
    title?: string;
    description?: string;
    instructions?: string;
    proctorConfig?: ProctorConfig;
    codeRunCooldownSeconds?: number;
    maxCodeSubmissions?: number;
    isTurnedOff?: boolean;
    activationMode?: string;
  };
  startedAt?: string;
  submittedAt?: string;
}

interface AnswerState {
  selectedOptions?: string[];
  code?: string;
  language?: string;
  codesByLanguage?: Record<string, string>;
}

interface RunCaseResult {
  caseNumber: number;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  stderr?: string;
  verdict: string;
  timeMs?: number;
  passed: boolean;
}

interface RunResult {
  isCustomInput?: boolean;
  overallVerdict?: string;
  verdict?: string;
  error?: string;
  input?: string;
  stdout?: string;
  stderr?: string;
  passed?: boolean;
  cases?: RunCaseResult[];
  totalCases?: number;
  passedCases?: number;
  timeMs?: number;
}

interface SubmitCaseResult {
  caseNumber: number;
  isSample?: boolean;
  isHidden?: boolean;
  verdict: string;
  passed: boolean;
  timeMs?: number;
  input?: string;
  expectedOutput?: string;
  actualOutput?: string;
  stderr?: string;
}

interface CodeResult {
  submissionId?: string;
  verdict: string;
  passedCases?: number;
  totalCases?: number;
  earnedScore?: number;
  maxScore?: number;
  score?: number;
  cases?: SubmitCaseResult[];
}

const SUPPORTED_LANGUAGES = [
  { id: 71, name: 'Python 3 (v3.12)', key: 'python' },
  { id: 62, name: 'Java (JDK 21 LTS)', key: 'java' },
  { id: 51, name: 'C# (.NET / Roslyn)', key: 'csharp' },
  { id: 63, name: 'JavaScript (Node.js)', key: 'javascript' },
];

const DEFAULT_STARTER_CODE: Record<string, string> = {
  python: `# Write your Python solution here\nimport sys\n\ndef main():\n    # Read all input from standard input (handles multi-line and single-line tokens)\n    # tokens = sys.stdin.read().split()\n    # Or line by line: input_line = input()\n    pass\n\nif __name__ == '__main__':\n    main()\n`,
  java: `import java.util.*;\nimport java.io.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Write your Java solution here\n    }\n}\n`,
  csharp: `using System;\n\nclass Program {\n    static void Main(string[] args) {\n        // Write your C# solution here\n        // string line = Console.ReadLine();\n    }\n}\n`,
  javascript: `const fs = require('fs');\n\nfunction solve() {\n    const input = fs.readFileSync(0, 'utf-8').trim();\n    // Write your solution here\n}\n\nsolve();\n`,
};

export default function AttemptPage() {
  const { id: contestId } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data: meUser } = useQuery({
    queryKey: ['me-attempt'],
    queryFn: authApi.me,
    staleTime: 60_000,
  });
  const currentUser = meUser || user;

  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);

  // Mobile Tab Toggle: 'question' or 'answer'
  const [mobileTab, setMobileTab] = useState<'question' | 'answer'>('question');

  // Answers & Reviews
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [visitedQuestions, setVisitedQuestions] = useState<Set<string>>(new Set());
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());

  // Coding Runner
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [submitCodeResult, setSubmitCodeResult] = useState<CodeResult | null>(null);
  const [runningCode, setRunningCode] = useState(false);
  const [submittingCode, setSubmittingCode] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [activeConsoleTab, setActiveConsoleTab] = useState<'testcases' | 'result'>('testcases');
  const [selectedCaseIdx, setSelectedCaseIdx] = useState<number>(0);

  // Fullscreen & Proctoring State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [needsFullscreenGate, setNeedsFullscreenGate] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [violationModal, setViolationModal] = useState(false);
  const [lastViolationReason, setLastViolationReason] = useState('');
  const [disqualified, setDisqualified] = useState(false);

  // Drawer / Modals
  const [showQuestionDrawer, setShowQuestionDrawer] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [showQuestionPaperModal, setShowQuestionPaperModal] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [editorFontSize, setEditorFontSize] = useState<'sm' | 'base' | 'lg'>('sm');
  const [isConsoleCollapsed, setIsConsoleCollapsed] = useState(false);
  const [isConsoleExpanded, setIsConsoleExpanded] = useState(false);
  const [isWordWrap, setIsWordWrap] = useState(true);
  const drawerTouchStartY = useRef<number | null>(null);

  // Auto-collapse console drawer on mobile devices so editor has maximum vertical space to scroll
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsConsoleCollapsed(true);
    }
  }, []);
  const [isEditorMaximized, setIsEditorMaximized] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [submissionCounts, setSubmissionCounts] = useState<Record<string, number>>({});

  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch Attempt State
  const { data: stateData, isLoading } = useQuery({
    queryKey: ['attempt-state', contestId],
    queryFn: () => contestApi.getAttemptState(contestId),
    refetchInterval: 60000,
    retry: 2,
  });

  const attempt = stateData as AttemptState | null;

  // Format sections and questions safely
  const sections: Section[] = useMemo(() => {
    if (!attempt) return [];
    if (attempt.sections && attempt.sections.length > 0) {
      return attempt.sections;
    }
    if (attempt.questions && attempt.questions.length > 0) {
      const grouped: Record<string, Question[]> = {};
      attempt.questions.forEach((q) => {
        const secId = q.sectionId || 'default';
        if (!grouped[secId]) grouped[secId] = [];
        grouped[secId].push(q);
      });
      return Object.entries(grouped).map(([secId, qList], idx) => ({
        id: secId,
        _id: secId,
        title: `Section ${idx + 1}`,
        questions: qList,
      }));
    }
    return [];
  }, [attempt]);

  // Timer Setup
  const [remaining, setRemaining] = useState<number>(0);
  const expiredRef = useRef(false);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    if (attempt?.remainingSeconds && attempt.remainingSeconds > 0) {
      setRemaining(attempt.remainingSeconds);
    }
  }, [attempt?.remainingSeconds]);

  // Finish Attempt Mutation
  const finishMutation = useMutation({
    mutationFn: () => {
      isSubmittingRef.current = true;
      return contestApi.finishAttempt(contestId);
    },
    onSuccess: () => {
      if (typeof document !== 'undefined' && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      router.push(`/contest/${contestId}/results`);
    },
    onError: () => {
      if (typeof document !== 'undefined' && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      router.push(`/contest/${contestId}/results`);
    },
  });

  const handleExpire = useCallback(() => {
    if (!expiredRef.current) {
      expiredRef.current = true;
      finishMutation.mutate();
    }
  }, [finishMutation]);

  // Real-time listener: if admin turns OFF contest, auto-submit and lock immediately
  useEffect(() => {
    if (!contestId) return;
    const socket = getSocket();
    const handleStatusChange = (data: any) => {
      if (data?.contestId === contestId && data?.isTurnedOff) {
        handleExpire();
      }
    };
    socket.on('contest:status-changed', handleStatusChange);
    return () => {
      socket.off('contest:status-changed', handleStatusChange);
    };
  }, [contestId, handleExpire]);

  // Check on mount if contest was turned off by admin
  useEffect(() => {
    if (attempt) {
      const isOff = Boolean((attempt as any)?.isTurnedOff || attempt?.contest?.isTurnedOff);
      if (isOff && attempt.status === 'in_progress') {
        handleExpire();
      }
    }
  }, [attempt, handleExpire]);

  // If attempt was already submitted, redirect candidate immediately to results
  useEffect(() => {
    if (attempt?.status === 'submitted' || attempt?.status === 'graded') {
      router.replace(`/contest/${contestId}/results`);
    }
  }, [attempt?.status, contestId, router]);

  useEffect(() => {
    if (remaining <= 0) return;
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [remaining, handleExpire]);

  const formatTimer = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return {
      hours: String(h).padStart(2, '0'),
      minutes: String(m).padStart(2, '0'),
      seconds: String(s).padStart(2, '0'),
    };
  };

  const timerObj = formatTimer(remaining);

  // Active Section & Question Pointers
  const activeSection = sections[activeSectionIdx] || sections[0];
  const currentQuestions = activeSection?.questions || [];
  const activeQuestion: Question | undefined = currentQuestions[activeQuestionIdx];
  const qId = activeQuestion?._id || activeQuestion?.id || '';

  // Mark current question as visited
  useEffect(() => {
    if (qId) {
      setVisitedQuestions((prev) => {
        if (!prev.has(qId)) {
          const next = new Set(prev);
          next.add(qId);
          return next;
        }
        return prev;
      });
    }
  }, [qId]);

  // Live Cooldown Timer for Code Run
  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const timer = setInterval(() => {
      setCooldownRemaining((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  // Sync submission counts & cooling state from attempt
  useEffect(() => {
    setSubmissionCounts(attempt?.submissionCounts || {});
    if (qId && attempt?.lastRunTimestamps?.[qId]) {
      const cooldownSec = attempt?.codeRunCooldownSeconds ?? attempt?.contest?.codeRunCooldownSeconds ?? 30;
      const elapsed = Math.floor((Date.now() - attempt.lastRunTimestamps[qId]) / 1000);
      if (elapsed < cooldownSec) {
        setCooldownRemaining(cooldownSec - elapsed);
      } else {
        setCooldownRemaining(0);
      }
    } else {
      setCooldownRemaining(0);
    }
  }, [attempt, qId]);

  // Real-time listener: if admin revokes/unlocks the attempt, refresh state cleanly
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !contestId) return;

    const onAttemptRevoked = (data: any) => {
      const currentAttId = attempt?.id || (attempt as any)?._id;
      if (!data?.attemptId || !currentAttId || data.attemptId === currentAttId) {
        queryClient.invalidateQueries({ queryKey: ['attempt-state', contestId] });
        hasInitializedAnswersRef.current = false;
        setAnswers({});
        setSubmissionCounts({});
        setRunResult(null);
        setSubmitCodeResult(null);
        setMarkedForReview(new Set());
        setVisitedQuestions(new Set());
        setCooldownRemaining(0);
      }
    };

    socket.on('attempt:revoked', onAttemptRevoked);
    return () => {
      socket.off('attempt:revoked', onAttemptRevoked);
    };
  }, [contestId, attempt?.id, queryClient]);

  const hasInitializedAnswersRef = useRef(false);

  // Initialize saved answers from backend (once when attempt data loads)
  useEffect(() => {
    if (hasInitializedAnswersRef.current) return;
    if (attempt?.savedAnswers && Array.isArray(attempt.savedAnswers)) {
      hasInitializedAnswersRef.current = true;
      if (attempt.savedAnswers.length > 0) {
        const initialAnswers: Record<string, AnswerState> = {};
        const initialReviews = new Set<string>();

        attempt.savedAnswers.forEach((sa) => {
          const id = sa.questionId || sa.question?._id || sa.question?.id;
          if (id) {
            initialAnswers[id] = {
              selectedOptions: sa.selectedOptions || [],
              code: sa.draftCode || sa.code || '',
              language: sa.language || 'python',
            };
            if (sa.isMarkedForReview) {
              initialReviews.add(id);
            }
          }
        });

        setAnswers(initialAnswers);
        setMarkedForReview(initialReviews);
      }
    }
  }, [attempt?.savedAnswers]);

  // Autosave answers every 25 seconds
  useEffect(() => {
    autoSaveRef.current = setInterval(() => {
      Object.entries(answers).forEach(([questionId, ans]) => {
        if (ans.selectedOptions && ans.selectedOptions.length > 0) {
          contestApi
            .saveAnswer(contestId, {
              questionId,
              selectedOptions: ans.selectedOptions,
              isMarkedForReview: markedForReview.has(questionId),
            })
            .catch(() => {});
        }
        if (ans.code) {
          contestApi
            .saveAnswer(contestId, {
              questionId,
              draftCode: ans.code,
              language: ans.language || 'python',
              isMarkedForReview: markedForReview.has(questionId),
            })
            .catch(() => {});
        }
      });
    }, 25000);
    return () => {
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    };
  }, [answers, markedForReview, contestId]);

  // Strict Proctoring Violation Logger
  const logViolation = useCallback(
    async (type: string, reasonDescription: string) => {
      const realAttemptId =
        (attempt as any)?.attempt?.id ||
        (attempt as any)?.attempt?._id ||
        (attempt as any)?.attemptId ||
        attempt?._id ||
        attempt?.id ||
        '';

      try {
        await proctorApi.logEvent({
          contestId,
          attemptId: realAttemptId,
          type,
          details: { reason: reasonDescription },
        });
      } catch (err) {
        console.warn('Proctoring log error:', err);
      }

      const cfg = attempt?.contest?.proctorConfig;
      const maxLimit = cfg?.maxViolations || 5;

      setViolationCount((prev) => {
        const next = prev + 1;
        setLastViolationReason(reasonDescription);

        if (next >= maxLimit) {
          setDisqualified(true);
          finishMutation.mutate();
        } else {
          setViolationModal(true);
        }
        return next;
      });
    },
    [contestId, attempt, finishMutation]
  );

  // Fullscreen Request Handler
  const requestStrictFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      setIsFullscreen(true);
      setNeedsFullscreenGate(false);
    } catch (err) {
      // User refused or browser blocked fullscreen
      setNeedsFullscreenGate(true);
    }
  };

  // Fullscreen & Proctoring Listeners
  useEffect(() => {
    const cfg = attempt?.contest?.proctorConfig;
    if (!cfg?.enabled) return;

    // Check fullscreen on load if enforced
    if (cfg.enforceFullscreen) {
      if (!document.fullscreenElement) {
        setNeedsFullscreenGate(true);
      } else {
        setIsFullscreen(true);
      }
    }

    const onFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isNowFullscreen);

      if (isSubmittingRef.current || expiredRef.current) return;

      if (cfg.enforceFullscreen && !isNowFullscreen) {
        setNeedsFullscreenGate(true);
        logViolation('fullscreen_exit', 'Exited fullscreen examination mode.');
      }
    };

    const onVisibilityChange = () => {
      if (isSubmittingRef.current || expiredRef.current) return;
      if (document.hidden && cfg.blockTabSwitch) {
        logViolation('tab_switch', 'Switched away to another browser tab.');
      }
    };

    const onWindowBlur = () => {
      if (isSubmittingRef.current || expiredRef.current) return;
      if (cfg.blockTabSwitch) {
        logViolation('window_blur', 'Window lost focus or application switch detected.');
      }
    };

    const onCopy = (e: ClipboardEvent) => {
      if (cfg.blockCopyPaste) {
        e.preventDefault();
        logViolation('copy', 'Attempted clipboard copy action.');
      }
    };

    const onPaste = (e: ClipboardEvent) => {
      if (cfg.blockCopyPaste) {
        e.preventDefault();
        logViolation('paste', 'Attempted clipboard paste action.');
      }
    };

    const onContextMenu = (e: MouseEvent) => {
      if (cfg.blockRightClick) {
        e.preventDefault();
        logViolation('context_menu', 'Right-click context menu prohibited.');
      }
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onWindowBlur);
    document.addEventListener('copy', onCopy as EventListener);
    document.addEventListener('paste', onPaste as EventListener);
    document.addEventListener('contextmenu', onContextMenu as EventListener);

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onWindowBlur);
      document.removeEventListener('copy', onCopy as EventListener);
      document.removeEventListener('paste', onPaste as EventListener);
      document.removeEventListener('contextmenu', onContextMenu as EventListener);
    };
  }, [attempt, logViolation]);

  // JEE Status Helper
  const getQuestionJeeStatus = (targetQId: string) => {
    const ans = answers[targetQId];
    const isAnswered =
      (ans?.selectedOptions && ans.selectedOptions.length > 0) ||
      (ans?.code && ans.code.trim().length > 10);
    const isMarked = markedForReview.has(targetQId);

    if (isAnswered && isMarked) return 'answered_and_marked';
    if (isAnswered) return 'answered';
    if (isMarked) return 'marked_for_review';
    if (visitedQuestions.has(targetQId)) return 'not_answered';
    return 'not_visited';
  };

  const currentAnswer = answers[qId];

  // Option selection
  const handleSelectOption = (optId: string) => {
    if (!qId) return;
    if (attempt?.status === 'submitted' || attempt?.status === 'graded') {
      router.replace(`/contest/${contestId}/results`);
      return;
    }
    setAnswers((prev) => {
      const prevAns = prev[qId];
      const prevSelected = prevAns?.selectedOptions || [];
      let newSelected: string[];

      if (activeQuestion?.isMultiSelect) {
        newSelected = prevSelected.includes(optId)
          ? prevSelected.filter((id) => id !== optId)
          : [...prevSelected, optId];
      } else {
        newSelected = prevSelected.includes(optId) ? [] : [optId];
      }

      const next = {
        ...prev,
        [qId]: {
          ...prevAns,
          selectedOptions: newSelected,
        },
      };
      contestApi
        .saveAnswer(contestId, {
          questionId: qId,
          selectedOptions: newSelected,
          isMarkedForReview: markedForReview.has(qId),
        })
        .catch(() => {});
      return next;
    });
  };

  // Clear Response
  const handleClearResponse = () => {
    if (!qId) return;
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[qId];
      return next;
    });
    setMarkedForReview((prev) => {
      const next = new Set(prev);
      next.delete(qId);
      return next;
    });
    contestApi
      .saveAnswer(contestId, {
        questionId: qId,
        selectedOptions: [],
        draftCode: '',
        isMarkedForReview: false,
      })
      .catch(() => {});
  };

  // Reset Starter Code
  const handleResetCode = () => {
    setShowResetConfirm(false);
    if (!qId) return;
    const lang = currentAnswer?.language || 'python';
    const starter = activeQuestion?.codingConfig?.starterCode?.[lang] || DEFAULT_STARTER_CODE[lang] || '';
    setAnswers((prev) => {
      const existing = prev[qId];
      return {
        ...prev,
        [qId]: {
          ...existing,
          code: starter,
          codesByLanguage: {
            ...(existing?.codesByLanguage || {}),
            [lang]: starter,
          },
        },
      };
    });
  };

  // Navigation & Save Helpers
  const handleSaveAndNext = () => {
    if (qId && currentAnswer) {
      contestApi
        .saveAnswer(contestId, {
          questionId: qId,
          selectedOptions: currentAnswer.selectedOptions || [],
          draftCode: currentAnswer.code || '',
          language: currentAnswer.language || 'python',
          isMarkedForReview: markedForReview.has(qId),
        })
        .catch(() => {});
    }
    navigateToNextQuestion();
  };

  const handleToggleReview = () => {
    if (!qId) return;
    setMarkedForReview((prev) => {
      const next = new Set(prev);
      const isCurrentlyMarked = next.has(qId);
      if (isCurrentlyMarked) {
        next.delete(qId);
      } else {
        next.add(qId);
      }
      contestApi
        .saveAnswer(contestId, {
          questionId: qId,
          selectedOptions: currentAnswer?.selectedOptions || [],
          draftCode: currentAnswer?.code || '',
          language: currentAnswer?.language || 'python',
          isMarkedForReview: !isCurrentlyMarked,
        })
        .catch(() => {});
      return next;
    });
  };

  const navigateToNextQuestion = () => {
    setRunResult(null);
    setSubmitCodeResult(null);
    setActiveConsoleTab('testcases');
    setSelectedCaseIdx(0);
    if (activeQuestionIdx < currentQuestions.length - 1) {
      setActiveQuestionIdx((prev) => prev + 1);
    } else if (activeSectionIdx < sections.length - 1) {
      setActiveSectionIdx((prevSec) => prevSec + 1);
      setActiveQuestionIdx(0);
    } else {
      setShowSubmitConfirm(true);
    }
  };

  const navigateToPrevQuestion = () => {
    setRunResult(null);
    setSubmitCodeResult(null);
    setActiveConsoleTab('testcases');
    setSelectedCaseIdx(0);
    if (activeQuestionIdx > 0) {
      setActiveQuestionIdx((i) => i - 1);
    } else if (activeSectionIdx > 0) {
      const prevSecIdx = activeSectionIdx - 1;
      setActiveSectionIdx(prevSecIdx);
      const prevSec = sections[prevSecIdx];
      setActiveQuestionIdx((prevSec?.questions?.length || 1) - 1);
    }
  };

  const maxSubmissions = attempt?.maxCodeSubmissions ?? attempt?.contest?.maxCodeSubmissions ?? 5;
  const currentSubmissionsUsed = submissionCounts[qId] || 0;
  const submissionsRemaining = Math.max(0, maxSubmissions - currentSubmissionsUsed);
  const isSubmissionLimitReached = currentSubmissionsUsed >= maxSubmissions;

  // Code Runner: Executes natively on Railway Backend container in ~150ms with resilient browser fallback
  const handleRunCode = async () => {
    if (!qId || !currentAnswer?.code) return;
    if (cooldownRemaining > 0) return;
    setRunningCode(true);
    setRunResult(null);
    setSubmitCodeResult(null);
    setIsConsoleCollapsed(false);
    setActiveConsoleTab('result');
    setSelectedCaseIdx(0);

    const lang = (currentAnswer.language || 'python').toLowerCase();

    // 1. Primary: Server-side execution (Native Docker container on Railway, fast and works on all mobile devices)
    try {
      const res = await contestApi.runCode(contestId, {
        questionId: qId,
        code: currentAnswer.code,
        language: lang,
        customInput: showCustomInput ? customInput : undefined,
      });
      setRunResult(res as RunResult);
      setActiveConsoleTab('result');
      const cooldownSec = (res as any)?.cooldownSeconds ?? attempt?.codeRunCooldownSeconds ?? attempt?.contest?.codeRunCooldownSeconds ?? 5;
      setCooldownRemaining(cooldownSec);
      return;
    } catch (serverErr: any) {
      // If server returned a specific business error like cooling time active, show it directly without running fallback
      const serverErrMsg = serverErr.response?.data?.error?.message || serverErr.response?.data?.message || '';
      if (serverErrMsg.toLowerCase().includes('cooling time') || serverErrMsg.toLowerCase().includes('turned off')) {
        setRunResult({
          error: serverErrMsg,
          overallVerdict: 'COMPILE_ERROR',
        });
        setActiveConsoleTab('result');
        return;
      }

      // 2. Fallback: In-browser execution if client runner is supported
      if (isClientRunnable(lang)) {
        try {
          if (showCustomInput) {
            const clientRes = await runCodeInBrowser({
              code: currentAnswer.code,
              language: lang,
              input: customInput,
            });

            setRunResult({
              isCustomInput: true,
              input: customInput,
              stdout: clientRes.stdout,
              stderr: clientRes.stderr,
              passed: clientRes.verdict === 'PASSED',
              verdict: clientRes.verdict,
              timeMs: clientRes.timeMs,
            });
          } else {
            const sampleCases = activeQuestion?.codingConfig?.sampleTestCases || [];
            if (sampleCases.length === 0) {
              const clientRes = await runCodeInBrowser({
                code: currentAnswer.code,
                language: lang,
                input: '',
              });
              setRunResult({
                isCustomInput: true,
                input: '',
                stdout: clientRes.stdout,
                stderr: clientRes.stderr,
                passed: clientRes.verdict === 'PASSED',
                verdict: clientRes.verdict,
                timeMs: clientRes.timeMs,
              });
            } else {
              const evaluatedCases: RunCaseResult[] = [];
              let passedCount = 0;
              let firstErrorVerdict: string | null = null;

              for (let i = 0; i < sampleCases.length; i++) {
                const tc = sampleCases[i];
                const clientRes = await runCodeInBrowser({
                  code: currentAnswer.code,
                  language: lang,
                  input: tc.input || '',
                });

                const isMatch = (clientRes.stdout || '').trim() === (tc.expectedOutput || '').trim();
                const casePassed = clientRes.verdict === 'PASSED' && isMatch;
                if (casePassed) passedCount++;
                if (clientRes.verdict !== 'PASSED' && !firstErrorVerdict) {
                  firstErrorVerdict = clientRes.verdict;
                }

                evaluatedCases.push({
                  caseNumber: i,
                  input: tc.input || '',
                  expectedOutput: tc.expectedOutput || '',
                  actualOutput: clientRes.stdout,
                  stderr: clientRes.stderr,
                  verdict: clientRes.verdict !== 'PASSED' ? clientRes.verdict : isMatch ? 'PASSED' : 'FAILED',
                  passed: casePassed,
                  timeMs: clientRes.timeMs,
                });
              }

              setRunResult({
                overallVerdict: firstErrorVerdict || (passedCount === sampleCases.length ? 'PASSED' : 'FAILED'),
                passedCases: passedCount,
                totalCases: sampleCases.length,
                cases: evaluatedCases,
              });
            }
          }
          setActiveConsoleTab('result');
          setCooldownRemaining(5);
          return;
        } catch (_clientErr) {
          // If client fallback also failed, fall through to display the server error
        }
      }

      setRunResult({
        error: serverErrMsg || serverErr.message || 'Execution error',
        overallVerdict: 'COMPILE_ERROR',
      });
      setActiveConsoleTab('result');
    } finally {
      setRunningCode(false);
    }
  };

  // Code Submitter
  const handleSubmitCode = async () => {
    if (!qId || !currentAnswer?.code) return;
    if (isSubmissionLimitReached) return;
    setSubmittingCode(true);
    setSubmitCodeResult(null);
    setRunResult(null);
    setIsConsoleCollapsed(false);
    setActiveConsoleTab('result');
    setSelectedCaseIdx(0);
    try {
      const res = await contestApi.submitCode(contestId, {
        questionId: qId,
        code: currentAnswer.code,
        language: currentAnswer.language || 'python',
      });
      setSubmitCodeResult(res as CodeResult);
      setSubmissionCounts((prev) => ({
        ...prev,
        [qId]: (prev[qId] || 0) + 1,
      }));
      setActiveConsoleTab('result');
    } catch (err: any) {
      setSubmitCodeResult({
        verdict: err.response?.data?.error?.message || err.message || 'Submission Error',
        passedCases: 0,
        totalCases: 0,
        score: 0,
      });
      setActiveConsoleTab('result');
    } finally {
      setSubmittingCode(false);
    }
  };

  // Summary stats
  const totalAnswered = useMemo(() => {
    let count = 0;
    sections.forEach((s) => {
      s.questions.forEach((q) => {
        const id = q._id || q.id || '';
        const st = getQuestionJeeStatus(id);
        if (st === 'answered' || st === 'answered_and_marked') count++;
      });
    });
    return count;
  }, [sections, answers, markedForReview]);

  const totalQuestions = useMemo(() => {
    return sections.reduce((acc, s) => acc + (s.questions?.length || 0), 0);
  }, [sections]);

  if (isLoading || !stateData) {
    return <AttemptSkeleton />;
  }

  return (
    <div className="h-screen h-[100dvh] max-h-[100dvh] min-h-[100dvh] flex flex-col bg-slate-100 font-sans select-none overflow-hidden text-slate-900">
      {/* ===================== STRICT FULLSCREEN GATE OVERLAY ===================== */}
      {needsFullscreenGate && (
        <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl space-y-4 border border-slate-200">
            <div className="w-16 h-16 bg-[#EEF2FF] text-[#3760F8] rounded-3xl flex items-center justify-center mx-auto shadow-sm">
              <Maximize2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Fullscreen Security Required</h2>
              <p className="text-xs text-slate-600 leading-relaxed mt-2">
                This assessment enforces strict fullscreen proctoring. Exiting fullscreen mode, switching tabs, or minimizing the browser is recorded as a security violation.
              </p>
            </div>
            {violationCount > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-semibold">
                Violation flags logged: {violationCount} / {attempt?.contest?.proctorConfig?.maxViolations || 5}
              </div>
            )}
            <button
              onClick={requestStrictFullscreen}
              className="w-full py-3.5 bg-[#3760F8] hover:bg-[#254EDB] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all active:scale-95"
            >
              Enter Fullscreen &amp; Continue Test
            </button>
          </div>
        </div>
      )}

      {/* ===================== TOP COMMAND HEADER ===================== */}
      <header className="bg-white border-b border-slate-200 px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between shrink-0 z-30 shadow-xs gap-2">
        {/* Left: Brand & Contest Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <img src="/logo.png" alt="HACKPRO" className="h-7 sm:h-8 w-auto object-contain rounded shrink-0" />
          <div className="min-w-0">
            <h1 className="font-extrabold text-slate-900 text-xs sm:text-base tracking-tight truncate max-w-[110px] xs:max-w-[180px] sm:max-w-md">
              {attempt?.contest?.title || 'Assessment'}
            </h1>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono truncate hidden sm:block">
              {currentUser?.name} &bull; {currentUser?.rollNumber}
            </p>
          </div>
        </div>

        {/* Center: High-Contrast Countdown Timer */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-900 text-white px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-xl shadow-sm border border-slate-800 shrink-0">
          <Clock className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${remaining < 300 ? 'text-rose-500 animate-pulse' : 'text-[#D3FE4F]'}`} />
          <div className="flex items-center font-mono font-bold text-xs sm:text-sm text-[#D3FE4F] tracking-wider">
            <span>{timerObj.hours}</span>:<span>{timerObj.minutes}</span>:
            <span className={remaining < 300 ? 'text-rose-400 font-black' : ''}>{timerObj.seconds}</span>
          </div>
        </div>

        {/* Right: Quick Utilities & Submit */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {attempt?.contest?.proctorConfig?.enabled && (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Proctoring Active</span>
            </div>
          )}

          {/* Question Palette Drawer Trigger */}
          <button
            onClick={() => setShowQuestionDrawer(true)}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs cursor-pointer"
            title="Open question palette"
          >
            <Menu className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden md:inline">Palette</span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md font-mono font-bold">
              {totalAnswered}/{totalQuestions}
            </span>
          </button>

          <button
            onClick={() => setShowSubmitConfirm(true)}
            className="px-3 sm:px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            Submit
          </button>
        </div>
      </header>

      {/* ===================== SECTION TABS & MOBILE VIEW TOGGLE ===================== */}
      <div className="bg-white border-b border-slate-200 px-3 sm:px-6 py-1.5 sm:py-2 flex items-center justify-between gap-2 sm:gap-3 shrink-0 z-20 overflow-x-auto">
        <div className="flex items-center gap-2 overflow-x-auto py-0.5">
          {sections.map((sec, sIdx) => {
            const isActive = sIdx === activeSectionIdx;
            const isCoding = sec.questions.some((q) => q.type === 'coding');
            return (
              <button
                key={sec._id || sec.id || sIdx}
                onClick={() => {
                  setActiveSectionIdx(sIdx);
                  setActiveQuestionIdx(0);
                  setRunResult(null);
                  setSubmitCodeResult(null);
                }}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-xl transition-all border whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#3760F8] text-white border-[#3760F8] shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {isCoding ? <Code2 className="w-3.5 h-3.5" /> : <CheckSquare className="w-3.5 h-3.5" />}
                <span className="max-w-[130px] sm:max-w-none truncate">{sec.title}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20' : 'bg-slate-200'}`}>
                  {sec.questions?.length || 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* Mobile View Toggle (Only shown for Coding Problems on Mobile) */}
        {activeQuestion?.type === 'coding' && (
          <div className="flex md:hidden items-center bg-slate-100 p-0.5 sm:p-1 rounded-xl border border-slate-200 shrink-0">
            <button
              onClick={() => setMobileTab('question')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mobileTab === 'question' ? 'bg-white text-[#3760F8] shadow-2xs' : 'text-slate-600'
              }`}
            >
              Problem
            </button>
            <button
              onClick={() => setMobileTab('answer')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mobileTab === 'answer' ? 'bg-white text-[#3760F8] shadow-2xs' : 'text-slate-600'
              }`}
            >
              Editor
            </button>
          </div>
        )}
      </div>

      {/* ===================== STRUCTURED SPLIT WORKSPACE ===================== */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
        {/* LEFT PANEL: Question Statement & Specifications */}
        <div
          className={`flex-col bg-white border-r border-slate-200 min-h-0 overflow-hidden ${
            activeQuestion?.type === 'coding'
              ? isEditorMaximized
                ? 'hidden'
                : 'w-full md:w-[38%] lg:w-[34%] xl:w-[32%] flex-1 md:flex-initial'
              : 'flex-1 md:w-1/2'
          } ${mobileTab === 'question' ? 'flex' : 'hidden md:flex'}`}
        >
          {/* Question Sub-Header */}
          <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-900 shadow-2xs">
                Question {activeQuestionIdx + 1} of {currentQuestions.length}
              </span>
              <span className="text-xs font-semibold text-[#3760F8] bg-[#EEF2FF] border border-[#C7D2FE] px-2 py-0.5 rounded-lg">
                {activeQuestion?.type === 'coding' ? 'Coding Problem' : 'MCQ'}
              </span>
            </div>

            {/* Marks breakdown */}
            <div className="flex items-center gap-2 text-xs font-bold font-mono">
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                +{activeQuestion?.marks || 1}
              </span>
              {activeQuestion?.negativeMarks ? (
                <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                  -{activeQuestion.negativeMarks}
                </span>
              ) : null}
            </div>
          </div>

          {/* Question Details Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 pb-16 sm:pb-6">
            {!activeQuestion ? (
              <div className="py-20 text-center text-xs text-slate-400">No question selected.</div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  {activeQuestion.title}
                </h3>

                <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {activeQuestion.statement}
                </div>

                {/* Mobile-Friendly MCQ Options: Rendered directly on phones so candidates never need to switch tabs to answer */}
                {activeQuestion.type === 'mcq' && (
                  <div className="md:hidden pt-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Select Answer:
                      </span>
                      {currentAnswer?.selectedOptions && currentAnswer.selectedOptions.length > 0 && (
                        <button
                          onClick={handleClearResponse}
                          className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
                        >
                          Clear Choice
                        </button>
                      )}
                    </div>

                    <div className="space-y-2.5">
                      {((activeQuestion.mcqOptions && activeQuestion.mcqOptions.length > 0)
                        ? activeQuestion.mcqOptions
                        : ((activeQuestion as any).options || [])
                      ).map((opt: any, oIdx: number) => {
                        const optKey = String(opt.id || opt._id || oIdx);
                        const isSelected = (currentAnswer?.selectedOptions || []).some(
                          (so: any) =>
                            String(so) === optKey ||
                            (opt.id && String(so) === String(opt.id)) ||
                            (opt._id && String(so) === String(opt._id)) ||
                            String(so) === String(oIdx)
                        );
                        const letter = String.fromCharCode(65 + oIdx);

                        return (
                          <div
                            key={optKey}
                            onClick={() => handleSelectOption(optKey)}
                            className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all active:scale-[0.99] ${
                              isSelected
                                ? 'border-[#3760F8] bg-[#EEF2FF] shadow-xs'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div
                              className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center shrink-0 font-bold text-xs ${
                                isSelected
                                  ? 'border-[#3760F8] bg-[#3760F8] text-white'
                                  : 'border-slate-300 bg-slate-50 text-slate-700'
                              }`}
                            >
                              {letter}
                            </div>
                            <span
                              className={`text-xs sm:text-sm flex-1 ${
                                isSelected ? 'font-bold text-slate-900' : 'font-medium text-slate-700'
                              }`}
                            >
                              {opt.text}
                            </span>
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-[#3760F8] text-white flex items-center justify-center shrink-0">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeQuestion.type === 'coding' && (
                  <div className="space-y-4 pt-2 text-xs">
                    {activeQuestion.codingConfig?.inputFormat && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <span className="font-bold text-slate-700 uppercase text-[10px] tracking-wider block">Input Format</span>
                        <p className="text-slate-600 font-mono text-[11px] whitespace-pre-wrap">{activeQuestion.codingConfig.inputFormat}</p>
                      </div>
                    )}

                    {activeQuestion.codingConfig?.outputFormat && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <span className="font-bold text-slate-700 uppercase text-[10px] tracking-wider block">Output Format</span>
                        <p className="text-slate-600 font-mono text-[11px] whitespace-pre-wrap">{activeQuestion.codingConfig.outputFormat}</p>
                      </div>
                    )}

                    {activeQuestion.codingConfig?.constraints && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <span className="font-bold text-slate-700 uppercase text-[10px] tracking-wider block">Constraints</span>
                        <p className="text-slate-600 font-mono text-[11px] whitespace-pre-wrap">{activeQuestion.codingConfig.constraints}</p>
                      </div>
                    )}

                    {/* HackerRank-style Public / Sample Test Cases */}
                    {activeQuestion.codingConfig?.sampleTestCases && activeQuestion.codingConfig.sampleTestCases.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center gap-2">
                          <Terminal className="w-4 h-4 text-[#3760F8]" />
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            Sample Test Cases (Public)
                          </h4>
                        </div>

                        {activeQuestion.codingConfig.sampleTestCases.map((tc, idx) => (
                          <div key={tc.id || idx} className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50/70 shadow-2xs">
                            <div className="bg-slate-100/90 px-3.5 py-1.5 border-b border-slate-200 flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-800">Sample Case {idx}</span>
                              <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Public Testcase</span>
                            </div>

                            <div className="p-3.5 space-y-2.5 font-mono">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div>
                                  <span className="font-sans font-bold text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                                    Sample Input {idx}
                                  </span>
                                  <pre className="p-2.5 bg-slate-900 text-slate-100 rounded-lg overflow-x-auto whitespace-pre-wrap text-[11px] leading-relaxed">
                                    {tc.input}
                                  </pre>
                                </div>

                                <div>
                                  <span className="font-sans font-bold text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                                    Sample Output {idx}
                                  </span>
                                  <pre className="p-2.5 bg-slate-900 text-emerald-400 rounded-lg overflow-x-auto whitespace-pre-wrap text-[11px] leading-relaxed font-semibold">
                                    {tc.expectedOutput || (tc as any).output}
                                  </pre>
                                </div>
                              </div>

                              {tc.explanation && (
                                <div className="font-sans text-[11px] text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                                  <span className="font-bold text-slate-900">Explanation: </span>
                                  {tc.explanation}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Fallback Examples block if no sampleTestCases */}
                    {(!activeQuestion.codingConfig?.sampleTestCases || activeQuestion.codingConfig.sampleTestCases.length === 0) && activeQuestion.codingConfig?.examples && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <span className="font-bold text-slate-700 uppercase text-[10px] tracking-wider block">Sample Examples</span>
                        <pre className="text-slate-800 font-mono text-[11px] whitespace-pre-wrap bg-white p-2.5 rounded-lg border border-slate-200">
                          {activeQuestion.codingConfig.examples}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Answer Area (MCQ Radios or Coding IDE) */}
        <div
          className={`flex-col min-h-0 overflow-hidden ${
            activeQuestion?.type === 'coding'
              ? isEditorMaximized
                ? 'w-full flex-1 bg-[#0D1117]'
                : 'w-full md:w-[62%] lg:w-[66%] xl:w-[68%] flex-1 bg-[#0D1117]'
              : 'flex-1 md:w-1/2 bg-white'
          } ${mobileTab === 'answer' ? 'flex' : 'hidden md:flex'}`}
        >
          {activeQuestion?.type === 'mcq' ? (
            /* ================== MCQ OPTION SELECTOR ================== */
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between shrink-0">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Select Answer:
                </span>
                {currentAnswer?.selectedOptions && currentAnswer.selectedOptions.length > 0 && (
                  <button
                    onClick={handleClearResponse}
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
                  >
                    Clear Choice
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3">
                {((activeQuestion.mcqOptions && activeQuestion.mcqOptions.length > 0)
                  ? activeQuestion.mcqOptions
                  : ((activeQuestion as any).options || [])
                ).map((opt: any, oIdx: number) => {
                  const optKey = String(opt.id || opt._id || oIdx);
                  const isSelected = (currentAnswer?.selectedOptions || []).some(
                    (so: any) =>
                      String(so) === optKey ||
                      (opt.id && String(so) === String(opt.id)) ||
                      (opt._id && String(so) === String(opt._id)) ||
                      String(so) === String(oIdx)
                  );
                  const letter = String.fromCharCode(65 + oIdx);

                  return (
                    <div
                      key={optKey}
                      onClick={() => handleSelectOption(optKey)}
                      className={`flex items-center gap-3.5 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#3760F8] bg-[#EEF2FF] shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80 shadow-2xs'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center shrink-0 font-bold text-xs ${
                          isSelected
                            ? 'border-[#3760F8] bg-[#3760F8] text-white'
                            : 'border-slate-300 bg-slate-50 text-slate-700'
                        }`}
                      >
                        {letter}
                      </div>
                      <span
                        className={`text-xs sm:text-sm flex-1 ${
                          isSelected ? 'font-bold text-slate-900' : 'font-medium text-slate-700'
                        }`}
                      >
                        {opt.text}
                      </span>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-[#3760F8] text-white flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ================== CODING IDE & TEST RUNNER ================== */
            <div className="w-full h-full flex-1 flex flex-col min-h-0 overflow-hidden bg-[#0D1117]">
              {/* Language Toolbar & Workspace Controls */}
              <div className="bg-[#161B22] px-4 py-2 border-b border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-[#3760F8]" />
                    <span className="text-xs font-bold text-slate-200">Interactive Editor</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono hidden sm:inline-block border-l border-slate-700/80 pl-2.5">
                    {((currentAnswer?.code !== undefined
                      ? currentAnswer.code
                      : activeQuestion?.codingConfig?.starterCode?.[currentAnswer?.language || 'python'] ||
                        DEFAULT_STARTER_CODE[currentAnswer?.language || 'python'] ||
                        '').split('\n')).length} lines
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  {/* Maximize / Split View Toggle */}
                  <button
                    type="button"
                    onClick={() => setIsEditorMaximized((prev) => !prev)}
                    title={isEditorMaximized ? 'Split view (Show problem description)' : 'Maximize editor (Full screen coding)'}
                    className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-slate-300 hover:text-white text-xs rounded-lg hover:bg-slate-800 border border-slate-700/80 transition-colors cursor-pointer"
                  >
                    {isEditorMaximized ? (
                      <>
                        <Minimize2 className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-[11px] font-medium">Split View</span>
                      </>
                    ) : (
                      <>
                        <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[11px] font-medium">Maximize</span>
                      </>
                    )}
                  </button>
                  {/* Font Size Adjuster */}
                  <div className="hidden sm:flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/80 text-[11px] font-mono text-slate-400">
                    <button
                      type="button"
                      onClick={() => setEditorFontSize('sm')}
                      title="Font Size: Small (12px)"
                      className={`px-2 py-0.5 rounded cursor-pointer ${editorFontSize === 'sm' ? 'bg-[#3760F8] text-white font-bold' : 'hover:text-white'}`}
                    >
                      A-
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorFontSize('base')}
                      title="Font Size: Normal (14px)"
                      className={`px-2 py-0.5 rounded cursor-pointer ${editorFontSize === 'base' ? 'bg-[#3760F8] text-white font-bold' : 'hover:text-white'}`}
                    >
                      A
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorFontSize('lg')}
                      title="Font Size: Large (16px)"
                      className={`px-2 py-0.5 rounded cursor-pointer ${editorFontSize === 'lg' ? 'bg-[#3760F8] text-white font-bold' : 'hover:text-white'}`}
                    >
                      A+
                    </button>
                  </div>

                  {/* Word Wrap Toggle */}
                  <button
                    type="button"
                    onClick={() => setIsWordWrap((prev) => !prev)}
                    title={isWordWrap ? 'Word Wrap is ON (Code fits inside screen)' : 'Word Wrap is OFF (Horizontal scroll)'}
                    className={`flex items-center gap-1 px-2 py-1 text-xs rounded-lg border transition-colors cursor-pointer ${
                      isWordWrap
                        ? 'bg-[#3760F8]/20 text-blue-300 border-blue-500/40 font-semibold'
                        : 'text-slate-400 hover:text-white border-transparent hover:border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <WrapText className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{isWordWrap ? 'Wrap On' : 'Wrap Off'}</span>
                  </button>

                  {/* Reset Starter Code */}
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(true)}
                    title="Reset to starter template"
                    className="flex items-center gap-1 px-2 py-1 text-slate-400 hover:text-white text-xs rounded-lg hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Reset</span>
                  </button>

                  {/* Language Selector */}
                  <div className="relative inline-flex items-center">
                    <button
                      type="button"
                      onClick={() => setIsLangOpen((prev) => !prev)}
                      className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-white text-xs font-semibold rounded-lg pl-3 pr-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#3760F8]/40 shadow-xs transition-colors cursor-pointer"
                    >
                      <span>
                        {SUPPORTED_LANGUAGES.find((l) => l.key === (currentAnswer?.language || 'python'))?.name || 'Python'}
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isLangOpen ? 'rotate-180 text-[#3760F8]' : ''}`} />
                    </button>

                    {isLangOpen && (
                      <div className="absolute right-0 top-full mt-1.5 w-40 bg-slate-800 rounded-xl border border-slate-700 shadow-xl overflow-hidden py-1 z-50">
                        {SUPPORTED_LANGUAGES.map((l) => {
                          const isSel = (currentAnswer?.language || 'python') === l.key;
                          return (
                            <button
                              key={l.key}
                              type="button"
                              onClick={() => {
                                const currentLang = currentAnswer?.language || 'python';
                                const newLang = l.key;
                                if (currentLang === newLang) {
                                  setIsLangOpen(false);
                                  return;
                                }

                                const currentCode = currentAnswer?.code;
                                const existingCodes: Record<string, string> = {
                                  ...(currentAnswer?.codesByLanguage || {}),
                                  ...(currentCode ? { [currentLang]: currentCode } : {}),
                                };

                                // Load cached code for newLang or load clean starter code for newLang
                                const codeForNewLang =
                                  existingCodes[newLang] !== undefined
                                    ? existingCodes[newLang]
                                    : activeQuestion?.codingConfig?.starterCode?.[newLang] ||
                                      DEFAULT_STARTER_CODE[newLang] ||
                                      '';

                                setAnswers((prev) => {
                                  const existing = prev[qId];
                                  return {
                                    ...prev,
                                    [qId]: {
                                      ...existing,
                                      language: newLang,
                                      code: codeForNewLang,
                                      codesByLanguage: {
                                        ...existingCodes,
                                        [newLang]: codeForNewLang,
                                      },
                                    },
                                  };
                                });
                                setIsLangOpen(false);
                              }}
                              className={`w-full text-left px-3 py-1.5 text-xs font-semibold flex items-center justify-between cursor-pointer ${
                                isSel ? 'bg-[#3760F8] text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                              }`}
                            >
                              <span>{l.name}</span>
                              {isSel && <Check className="w-3.5 h-3.5" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Code Editor with Syntax Highlighting, Intelligent Indentation, and Line Numbers */}
              <CodeEditor
                key={`${qId}-${currentAnswer?.language || 'python'}`}
                value={
                  currentAnswer?.code !== undefined
                    ? currentAnswer.code
                    : activeQuestion?.codingConfig?.starterCode?.[currentAnswer?.language || 'python'] ||
                      DEFAULT_STARTER_CODE[currentAnswer?.language || 'python'] ||
                      '// Write your solution here\n'
                }
                onChange={(code) => {
                  setAnswers((prev) => {
                    const existing = prev[qId];
                    const currentLang = existing?.language || currentAnswer?.language || 'python';
                    return {
                      ...prev,
                      [qId]: {
                        ...existing,
                        language: currentLang,
                        code,
                        codesByLanguage: {
                          ...(existing?.codesByLanguage || {}),
                          [currentLang]: code,
                        },
                      },
                    };
                  });
                }}
                language={currentAnswer?.language || 'python'}
                fontSize={editorFontSize}
                isWordWrap={isWordWrap}
                placeholder="# Write your program code here..."
              />

              {/* Action Controls Bar */}
              <div className="px-3 sm:px-4 py-2 bg-[#131922] border-t border-slate-800 flex items-center justify-between gap-2 shrink-0">
                {/* Left: Slide Down / Slide Up Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsConsoleCollapsed((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-xs active:scale-95 ${
                    isConsoleCollapsed
                      ? 'bg-blue-950/70 hover:bg-blue-900 text-blue-300 hover:text-white border-blue-500/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                  }`}
                  title={isConsoleCollapsed ? 'Slide up test cases and console' : 'Slide down test cases and console'}
                >
                  {isConsoleCollapsed ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5 text-blue-400 stroke-[2.5]" />
                      <span>Slide Up</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 stroke-[2.5]" />
                      <span>Slide Down</span>
                    </>
                  )}
                </button>

                {/* Right: Run Code & Submit Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setIsConsoleCollapsed(false);
                      handleRunCode();
                    }}
                    disabled={runningCode || submittingCode || cooldownRemaining > 0}
                    className={`inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 font-bold text-xs rounded-xl border transition-all cursor-pointer ${
                      cooldownRemaining > 0
                        ? 'bg-slate-800/60 text-slate-400 border-slate-700/60 cursor-not-allowed'
                        : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700 shadow-xs active:scale-95 disabled:opacity-50'
                    }`}
                    title={cooldownRemaining > 0 ? `Code run cooling active. Please wait ${cooldownRemaining}s` : 'Compile and run against sample test cases'}
                  >
                    {runningCode ? (
                      <Spinner size="sm" />
                    ) : (
                      <Play className={`w-3.5 h-3.5 ${cooldownRemaining > 0 ? 'text-slate-500' : 'text-emerald-400 fill-emerald-400'}`} />
                    )}
                    <span>
                      {runningCode
                        ? 'Running...'
                        : cooldownRemaining > 0
                        ? `Run (${cooldownRemaining}s)`
                        : 'Run Code'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsConsoleCollapsed(false);
                      handleSubmitCode();
                    }}
                    disabled={runningCode || submittingCode || isSubmissionLimitReached}
                    className={`inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-5 py-1.5 sm:py-2 font-bold text-xs rounded-xl shadow-xs transition-all ${
                      isSubmissionLimitReached
                        ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-75'
                        : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white active:scale-95 disabled:opacity-50 cursor-pointer'
                    }`}
                    title={isSubmissionLimitReached ? `Maximum submission quota reached (${maxSubmissions}/${maxSubmissions})` : `Submit code for evaluation (${submissionsRemaining} submission(s) remaining)`}
                  >
                    {submittingCode ? (
                      <Spinner size="sm" />
                    ) : (
                      <SendHorizontal className={`w-3.5 h-3.5 ${isSubmissionLimitReached ? 'text-slate-500' : 'text-white'}`} />
                    )}
                    <span>
                      {submittingCode ? (
                        'Submitting...'
                      ) : isSubmissionLimitReached ? (
                        `Submitted (${maxSubmissions}/${maxSubmissions})`
                      ) : (
                        <>
                          <span className="inline sm:hidden">Submit ({submissionsRemaining})</span>
                          <span className="hidden sm:inline">Submit Code ({submissionsRemaining}/{maxSubmissions} left)</span>
                        </>
                      )}
                    </span>
                  </button>
                </div>
              </div>

              {/* ===================== HACKERRANK CONSOLE DRAWER ===================== */}
              <div className={`flex flex-col bg-[#090D16] border-t border-slate-800 text-xs transition-all duration-300 ease-in-out overflow-hidden ${
                isConsoleCollapsed
                  ? 'h-11 cursor-pointer'
                  : isConsoleExpanded
                  ? 'h-[440px] sm:h-[480px]'
                  : 'h-64 sm:h-72'
              }`}>
                {/* Drag Handle & Console Navigation Header Bar */}
                <div
                  onClick={() => {
                    if (isConsoleCollapsed) {
                      setIsConsoleCollapsed(false);
                    }
                  }}
                  onTouchStart={(e) => {
                    drawerTouchStartY.current = e.touches[0].clientY;
                  }}
                  onTouchMove={(e) => {
                    if (drawerTouchStartY.current === null) return;
                    const deltaY = e.touches[0].clientY - drawerTouchStartY.current;
                    // If user drags/swipes down by > 35px while drawer is open, push it down
                    if (deltaY > 35 && !isConsoleCollapsed) {
                      setIsConsoleCollapsed(true);
                      drawerTouchStartY.current = null;
                    }
                  }}
                  onTouchEnd={() => {
                    drawerTouchStartY.current = null;
                  }}
                  className={`bg-[#121721] px-3 sm:px-4 h-11 border-b border-slate-800 flex items-center justify-between shrink-0 select-none relative ${
                    isConsoleCollapsed ? 'cursor-pointer hover:bg-[#181f2c]' : ''
                  }`}
                  title={isConsoleCollapsed ? 'Tap to slide up test cases' : 'Swipe down to slide down test cases'}
                >
                  {/* Subtle Top Center Drag Handle Pill */}
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-9 h-1 bg-slate-600/60 rounded-full pointer-events-none" />

                  {/* Left: Console Tabs */}
                  <div className="flex items-center gap-1.5 sm:gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveConsoleTab('testcases');
                        setIsConsoleCollapsed(false);
                      }}
                      className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                        activeConsoleTab === 'testcases' && !isConsoleCollapsed
                          ? 'bg-slate-800 text-white shadow-2xs'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Terminal className="w-3.5 h-3.5 text-[#3760F8]" />
                      <span>Test Cases</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveConsoleTab('result');
                        setIsConsoleCollapsed(false);
                      }}
                      className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                        activeConsoleTab === 'result' && !isConsoleCollapsed
                          ? 'bg-slate-800 text-white shadow-2xs'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Code2 className="w-3.5 h-3.5 text-blue-400" />
                      <span>Code Result</span>
                      {(runResult || submitCodeResult) && (
                        <span className={`w-2 h-2 rounded-full ${
                          (runResult?.overallVerdict === 'PASSED' || submitCodeResult?.verdict === 'PASSED')
                            ? 'bg-emerald-400'
                            : 'bg-rose-400'
                        }`} />
                      )}
                    </button>
                  </div>

                  {/* Right: Drawer Size & Slide Down / Up Controls */}
                  <div className="flex items-center gap-1.5 sm:gap-2 pt-0.5">
                    {!isConsoleCollapsed && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsConsoleExpanded((prev) => !prev);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                        title={isConsoleExpanded ? 'Switch to compact console height' : 'Expand console height'}
                      >
                        {isConsoleExpanded ? (
                          <Minimize2 className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </button>
                    )}

                    {/* Dedicated Slide Down / Slide Up Toggle */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsConsoleCollapsed((prev) => !prev);
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95 ${
                        isConsoleCollapsed
                          ? 'bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 hover:text-white border border-blue-500/40'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80'
                      }`}
                      title={isConsoleCollapsed ? 'Slide up test cases' : 'Slide down test cases'}
                    >
                      <span>{isConsoleCollapsed ? 'Slide Up' : 'Slide Down'}</span>
                      {isConsoleCollapsed ? (
                        <ChevronUp className="w-3.5 h-3.5 text-blue-400" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Console Tab Content Body */}
                <div className="flex-1 overflow-y-auto dark-scrollbar">
                  {/* TAB 1: TEST CASES & CUSTOM INPUT */}
                  {activeConsoleTab === 'testcases' && (
                    <div className="p-3.5 space-y-3 font-mono">
                      {/* Case Selection & Custom Input Switcher Bar */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                        {((activeQuestion?.codingConfig?.sampleTestCases && activeQuestion.codingConfig.sampleTestCases.length > 0)
                          ? activeQuestion.codingConfig.sampleTestCases
                          : [{ input: '', expectedOutput: '' }]
                        ).map((tc, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setShowCustomInput(false);
                              setSelectedCaseIdx(idx);
                            }}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              !showCustomInput && selectedCaseIdx === idx
                                ? 'bg-[#3760F8] text-white shadow-xs'
                                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            Case {idx}
                          </button>
                        ))}

                        <button
                          type="button"
                          onClick={() => setShowCustomInput(true)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                            showCustomInput
                              ? 'bg-[#3760F8] text-white shadow-xs'
                              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          <span>Custom Input</span>
                        </button>
                      </div>

                      {showCustomInput ? (
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-sans font-bold text-slate-400 uppercase tracking-wider block">
                            Custom Stdin:
                          </label>
                          <textarea
                            rows={5}
                            value={customInput}
                            onChange={(e) => setCustomInput(e.target.value)}
                            className="w-full font-mono text-xs p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-[#3760F8] resize-none"
                            placeholder="Type custom standard input to test with..."
                          />
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* Selected Case Preview */}
                          {activeQuestion?.codingConfig?.sampleTestCases && activeQuestion.codingConfig.sampleTestCases[selectedCaseIdx] && (
                            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <span className="font-sans font-bold text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                                    Input:
                                  </span>
                                  <pre className="p-2.5 bg-black/70 text-slate-200 rounded-lg text-xs whitespace-pre-wrap border border-slate-800/80 font-mono h-24 overflow-y-auto">
                                    {activeQuestion.codingConfig.sampleTestCases[selectedCaseIdx].input}
                                  </pre>
                                </div>
                                <div>
                                  <span className="font-sans font-bold text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                                    Expected Output:
                                  </span>
                                  <pre className="p-2.5 bg-black/70 text-emerald-400 rounded-lg text-xs whitespace-pre-wrap border border-slate-800/80 font-mono font-bold h-24 overflow-y-auto">
                                    {activeQuestion.codingConfig.sampleTestCases[selectedCaseIdx].expectedOutput}
                                  </pre>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: CODE EXECUTION RESULTS & COMPILER MESSAGES */}
                  {activeConsoleTab === 'result' && (
                    <div>
                      {/* Loading State */}
                      {(runningCode || submittingCode) && (
                        <div className="py-14 flex flex-col items-center justify-center gap-3 text-slate-400">
                          <Spinner size="md" />
                          <span className="text-xs font-semibold font-sans tracking-wide">
                            {runningCode ? 'Compiling and executing code with HACKPRO Compiler Engine...' : 'Grading all test cases against test harness...'}
                          </span>
                        </div>
                      )}

                      {/* Not Running and Has Results */}
                      {!runningCode && !submittingCode && (
                        <div>
                          {/* Case A: Compilation or General Error */}
                          {runResult?.error && (
                            <div className="p-4 space-y-3 font-mono">
                              <div className="flex items-center gap-2 text-rose-400 bg-rose-950/60 border border-rose-800/80 px-3.5 py-2 rounded-xl font-bold text-xs font-sans">
                                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                                <span>
                                  {runResult.overallVerdict === 'RUNTIME_ERROR' ? 'Runtime Error (NZEC)' : 'Compilation / Syntax Error'}
                                </span>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider block">
                                  Compiler Output &amp; Traceback:
                                </span>
                                <pre className="p-3 bg-black/90 text-rose-300 rounded-xl border border-rose-900/40 text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                                  {runResult.error}
                                </pre>
                              </div>
                            </div>
                          )}

                          {/* Case B: Custom Input Run */}
                          {!runResult?.error && runResult?.isCustomInput && (
                            <div className="p-4 space-y-3 font-mono text-xs">
                              <div className="flex items-center justify-between bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-700 font-sans">
                                <span className={`font-bold ${runResult.passed ? 'text-emerald-400' : 'text-amber-400'}`}>
                                  Verdict: {runResult.verdict || 'COMPLETED'}
                                </span>
                                {runResult.timeMs !== undefined && (
                                  <span className="text-slate-400 font-mono text-[11px]">{runResult.timeMs} ms</span>
                                )}
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <span className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider block mb-1">Your Input:</span>
                                  <pre className="p-2.5 bg-black/80 text-slate-200 rounded-lg text-[11px] whitespace-pre-wrap border border-slate-800 font-mono h-20 overflow-y-auto">{runResult.input}</pre>
                                </div>
                                <div>
                                  <span className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider block mb-1">Your Output:</span>
                                  <pre className="p-2.5 bg-black/80 text-emerald-400 rounded-lg text-[11px] whitespace-pre-wrap border border-slate-800 font-mono h-20 overflow-y-auto">{runResult.stdout || '(No output produced)'}</pre>
                                </div>
                              </div>
                              {runResult.stderr && (
                                <div>
                                  <span className="text-[10px] font-sans font-bold text-rose-400 uppercase tracking-wider block mb-1">Standard Error:</span>
                                  <pre className="p-2.5 bg-rose-950/40 text-rose-300 rounded-lg text-[11px] whitespace-pre-wrap border border-rose-900/60">{runResult.stderr}</pre>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Case C: Sample Cases Run Result */}
                          {!runResult?.error && runResult?.cases && (
                            <div className="flex flex-col">
                              {/* Overall Status Bar */}
                              <div className="p-3 bg-slate-800/70 border-b border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-2 font-sans">
                                  {runResult.overallVerdict === 'PASSED' ? (
                                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800">
                                      <CheckCircle2 className="w-3.5 h-3.5" /> Congratulations!
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1.5 text-xs font-bold text-rose-400 bg-rose-950/60 px-2.5 py-1 rounded-lg border border-rose-800">
                                      <AlertTriangle className="w-3.5 h-3.5" /> Wrong Answer
                                    </span>
                                  )}
                                  <span className="text-xs text-slate-300 font-medium">
                                    Passed {runResult.passedCases || 0} / {runResult.totalCases || 0} sample test cases
                                  </span>
                                </div>
                              </div>

                              {/* Case Tabs */}
                              <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-900/70 border-b border-slate-800 overflow-x-auto">
                                {runResult.cases.map((c, cIdx) => (
                                  <button
                                    key={cIdx}
                                    type="button"
                                    onClick={() => setSelectedCaseIdx(cIdx)}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                      selectedCaseIdx === cIdx
                                        ? 'bg-[#3760F8] text-white shadow-xs'
                                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                    }`}
                                  >
                                    <span>Case {cIdx}</span>
                                    {c.passed ? (
                                      <Check className="w-3 h-3 text-emerald-300 stroke-[3]" />
                                    ) : (
                                      <X className="w-3 h-3 text-rose-300 stroke-[3]" />
                                    )}
                                  </button>
                                ))}
                              </div>

                              {/* Selected Case Breakdown - 3 Column Grid */}
                              {runResult.cases[selectedCaseIdx] && (
                                <div className="p-3.5 space-y-2.5 text-xs font-mono">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                                    <div>
                                      <span className="font-sans font-bold text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Compiler Input:</span>
                                      <pre className="p-2.5 bg-black/80 text-slate-200 rounded-lg text-[11px] whitespace-pre-wrap border border-slate-800 font-mono h-24 overflow-y-auto">{runResult.cases[selectedCaseIdx].input}</pre>
                                    </div>
                                    <div>
                                      <span className="font-sans font-bold text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Your Output:</span>
                                      <pre className={`p-2.5 bg-black/80 rounded-lg text-[11px] whitespace-pre-wrap border font-mono h-24 overflow-y-auto ${runResult.cases[selectedCaseIdx].passed ? 'text-emerald-400 border-emerald-900/40' : 'text-rose-400 border-rose-900/40'}`}>
                                        {runResult.cases[selectedCaseIdx].actualOutput || '(No output produced)'}
                                      </pre>
                                    </div>
                                    <div>
                                      <span className="font-sans font-bold text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Expected Output:</span>
                                      <pre className="p-2.5 bg-black/80 text-emerald-400 rounded-lg text-[11px] whitespace-pre-wrap border border-slate-800 font-bold font-mono h-24 overflow-y-auto">{runResult.cases[selectedCaseIdx].expectedOutput}</pre>
                                    </div>
                                  </div>
                                  {runResult.cases[selectedCaseIdx].stderr && (
                                    <div>
                                      <span className="font-sans font-bold text-[10px] text-rose-400 uppercase tracking-wider block mb-1">Standard Error:</span>
                                      <pre className="p-2.5 bg-rose-950/40 text-rose-300 rounded-lg text-[11px] whitespace-pre-wrap border border-rose-900/60 font-mono max-h-24 overflow-y-auto">{runResult.cases[selectedCaseIdx].stderr}</pre>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Case D: Submit Code Evaluation Result */}
                          {submitCodeResult && (
                            <div className="p-3.5 space-y-3">
                              {/* Compact Status Banner */}
                              <div className={`px-3 py-2 rounded-xl border flex items-center justify-between text-xs font-sans ${
                                submitCodeResult.verdict === 'PASSED'
                                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-200'
                                  : 'bg-rose-950/60 border-rose-800 text-rose-200'
                              }`}>
                                <div className="flex items-center gap-2">
                                  {submitCodeResult.verdict === 'PASSED' ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                  ) : (
                                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                                  )}
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-xs uppercase tracking-wider">
                                      {submitCodeResult.verdict === 'PASSED'
                                        ? 'Accepted (Full Score)'
                                        : submitCodeResult.verdict === 'RUNTIME_ERROR'
                                        ? 'Runtime Error (NZEC)'
                                        : submitCodeResult.verdict === 'COMPILE_ERROR'
                                        ? 'Compilation Error'
                                        : 'Wrong Answer / Failed'}
                                    </span>
                                    <span className="text-[11px] text-slate-300">
                                      • {submitCodeResult.passedCases ?? 0} of {submitCodeResult.totalCases ?? 0} test cases passed
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="font-mono font-bold text-xs bg-black/50 px-2.5 py-1 rounded-lg text-[#D3FE4F] border border-slate-700">
                                    Score: {submitCodeResult.score ?? submitCodeResult.earnedScore ?? 0} / {submitCodeResult.maxScore ?? activeQuestion?.marks ?? 20} pts
                                  </span>
                                </div>
                              </div>

                              {/* Test Cases Sub-tabs for submission */}
                              {submitCodeResult.cases && submitCodeResult.cases.length > 0 && (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                                    {submitCodeResult.cases.map((c, cIdx) => (
                                      <button
                                        key={cIdx}
                                        type="button"
                                        onClick={() => setSelectedCaseIdx(cIdx)}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                          selectedCaseIdx === cIdx
                                            ? 'bg-[#3760F8] text-white shadow-xs'
                                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                        }`}
                                      >
                                        <span>Case {cIdx}</span>
                                        {c.passed ? (
                                          <Check className="w-3 h-3 text-emerald-300 stroke-[3]" />
                                        ) : (
                                          <X className="w-3 h-3 text-rose-300 stroke-[3]" />
                                        )}
                                      </button>
                                    ))}
                                  </div>

                                  {submitCodeResult.cases[selectedCaseIdx] && (
                                    <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
                                      <div className="flex items-center justify-between text-[11px] font-sans">
                                        <span className="font-bold text-slate-300">
                                          {submitCodeResult.cases[selectedCaseIdx].isHidden ? 'Hidden Test Case' : 'Sample Test Case'}
                                        </span>
                                        <span className={`font-bold ${submitCodeResult.cases[selectedCaseIdx].passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                                          {submitCodeResult.cases[selectedCaseIdx].passed ? 'Passed ✓' : submitCodeResult.cases[selectedCaseIdx].verdict === 'RUNTIME_ERROR' ? 'Runtime Error ✗' : 'Failed ✗'}
                                        </span>
                                      </div>

                                      {!submitCodeResult.cases[selectedCaseIdx].isHidden ? (
                                        <div className="space-y-2 pt-1">
                                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                                            <div>
                                              <span className="font-sans font-bold text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Compiler Input:</span>
                                              <pre className="p-2 bg-black/80 text-slate-200 rounded-lg text-[11px] whitespace-pre-wrap font-mono h-24 overflow-y-auto border border-slate-800/80">{submitCodeResult.cases[selectedCaseIdx].input || '(Empty)'}</pre>
                                            </div>
                                            <div>
                                              <span className="font-sans font-bold text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Your Output:</span>
                                              <pre className={`p-2 bg-black/80 rounded-lg text-[11px] whitespace-pre-wrap font-mono h-24 overflow-y-auto border border-slate-800/80 ${submitCodeResult.cases[selectedCaseIdx].passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {submitCodeResult.cases[selectedCaseIdx].actualOutput || '(No output produced)'}
                                              </pre>
                                            </div>
                                            <div>
                                              <span className="font-sans font-bold text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Expected Output:</span>
                                              <pre className="p-2 bg-black/80 text-emerald-400 rounded-lg text-[11px] whitespace-pre-wrap font-bold font-mono h-24 overflow-y-auto border border-slate-800/80">{submitCodeResult.cases[selectedCaseIdx].expectedOutput || '(Empty)'}</pre>
                                            </div>
                                          </div>
                                          {submitCodeResult.cases[selectedCaseIdx].stderr && (
                                            <div>
                                              <span className="font-sans font-bold text-[10px] text-rose-400 uppercase tracking-wider block mb-1">Standard Error (Runtime Exception Traceback):</span>
                                              <pre className="p-2.5 bg-rose-950/40 text-rose-300 rounded-lg text-[11px] whitespace-pre-wrap border border-rose-900/60 font-mono max-h-32 overflow-y-auto">{submitCodeResult.cases[selectedCaseIdx].stderr}</pre>
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="p-3 bg-slate-900/80 rounded-lg text-slate-400 font-sans text-xs">
                                          Hidden test cases are evaluated securely on the server to prevent test case tampering.
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Case E: No results yet */}
                          {!runResult && !submitCodeResult && (
                            <div className="py-12 text-center text-slate-400 text-xs font-sans">
                              <Terminal className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                              <p className="font-bold text-slate-300">No execution results yet.</p>
                              <p className="text-[11px] text-slate-500 mt-1">
                                Click &quot;Run Code&quot; to test against sample test cases, or &quot;Submit Code&quot; for complete evaluation.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===================== BOTTOM NAVIGATION ACTION BAR ===================== */}
      <footer className="sticky bottom-0 z-30 bg-white border-t border-slate-200 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-3 shrink-0 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
        {/* Left: Review & Clear Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleReview}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer ${
              markedForReview.has(qId)
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 shrink-0" />
            <span>
              {markedForReview.has(qId) ? 'Marked' : 'Review'}
              <span className="hidden sm:inline">{markedForReview.has(qId) ? ' for Review' : ' Later'}</span>
            </span>
          </button>
        </div>

        {/* Right: Previous & Save/Next Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={navigateToPrevQuestion}
            disabled={activeSectionIdx === 0 && activeQuestionIdx === 0}
            className="px-3 sm:px-3.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none text-slate-700 transition-all flex items-center gap-1 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden xs:inline">Previous</span>
          </button>

          {activeQuestionIdx < currentQuestions.length - 1 ? (
            <button
              onClick={handleSaveAndNext}
              className="px-4 sm:px-5 py-1.5 bg-[#3760F8] hover:bg-[#254EDB] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer"
            >
              <span>Save &amp; Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : activeSectionIdx < sections.length - 1 ? (
            <button
              onClick={handleSaveAndNext}
              className="px-4 sm:px-5 py-1.5 bg-[#3760F8] hover:bg-[#254EDB] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer"
            >
              <span>Next Section</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSaveAndNext}
              className="px-4 sm:px-5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>Review &amp; Submit</span>
            </button>
          )}
        </div>
      </footer>

      {/* ===================== QUESTION PALETTE DRAWER ===================== */}
      {showQuestionDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
          <div className="w-full sm:w-96 max-w-full bg-white h-full shadow-2xl flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Questions Palette</h3>
                <p className="text-[11px] text-slate-400">Jump to any question in your assessment</p>
              </div>
              <button
                onClick={() => setShowQuestionDrawer(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {sections.map((sec, sIdx) => (
                <div key={sec._id || sec.id || sIdx} className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 block">{sec.title}</span>
                  <div className="grid grid-cols-5 gap-2">
                    {sec.questions.map((q, qIdx) => {
                      const id = q._id || q.id || '';
                      const st = getQuestionJeeStatus(id);
                      const isCurrent = sIdx === activeSectionIdx && qIdx === activeQuestionIdx;

                      let bg = 'bg-slate-100 text-slate-700 border-slate-200';
                      if (st === 'answered') bg = 'bg-emerald-600 text-white border-emerald-700';
                      else if (st === 'not_answered') bg = 'bg-rose-500 text-white border-rose-600';
                      else if (st === 'marked_for_review') bg = 'bg-purple-600 text-white border-purple-700';
                      else if (st === 'answered_and_marked') bg = 'bg-purple-600 text-white border-purple-700 ring-2 ring-emerald-400';

                      return (
                        <button
                          key={id || qIdx}
                          onClick={() => {
                            setActiveSectionIdx(sIdx);
                            setActiveQuestionIdx(qIdx);
                            setShowQuestionDrawer(false);
                            setRunResult(null);
                            setSubmitCodeResult(null);
                          }}
                          className={`h-9 rounded-xl font-bold text-xs flex items-center justify-center border transition-all ${bg} ${
                            isCurrent ? 'ring-2 ring-[#3760F8] scale-105' : ''
                          }`}
                        >
                          {qIdx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================== CONFIRM SUBMIT MODAL ===================== */}
      <Modal
        open={showSubmitConfirm}
        onClose={() => setShowSubmitConfirm(false)}
        title="Confirm Assessment Submission"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            You have answered <span className="font-bold text-[#3760F8]">{totalAnswered}</span> out of{' '}
            <span className="font-bold">{totalQuestions}</span> questions.
          </p>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
            Once submitted, your responses will be locked and sent for automatic grading. You cannot resume the exam.
          </div>

          <div className="flex gap-2.5 justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowSubmitConfirm(false)}>
              Keep Answering
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => {
                setShowSubmitConfirm(false);
                finishMutation.mutate();
              }}
              loading={finishMutation.isPending}
            >
              Confirm &amp; Submit Assessment
            </Button>
          </div>
        </div>
      </Modal>

      {/* ===================== RESET CODE CONFIRM MODAL ===================== */}
      <ConfirmDialog
        open={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleResetCode}
        title="Reset Code to Template"
        message="Reset code to initial problem template? Your unsaved edits will be replaced."
        confirmLabel="Reset Code"
        danger
      />

      {/* ===================== PROCTORING WARNING MODAL ===================== */}
      <Modal
        open={violationModal}
        onClose={() => setViolationModal(false)}
        title="Assessment Security Warning"
      >
        <div className="space-y-3.5">
          <div className="flex items-center gap-3 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-bold">Security Violation Logged</p>
              <p className="mt-0.5">{lastViolationReason}</p>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Total violations: <strong className="text-rose-600">{violationCount}</strong> /{' '}
            {attempt?.contest?.proctorConfig?.maxViolations || 5}. Reaching the limit will trigger automatic disqualification.
          </p>
          <div className="flex justify-end pt-2">
            <Button size="sm" onClick={() => setViolationModal(false)}>
              Acknowledge &amp; Return
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
