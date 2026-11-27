'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contestApi } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { Spinner } from '@/components/ui/Spinner';
import { ContestEntrySkeleton } from '@/components/ui/Skeleton';
import { useNavigation } from '@/components/ui/NavigationLoader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowLeft,
  Clock,
  Calendar,
  Award,
  ShieldAlert,
  Info,
  CheckCircle,
  Play,
} from 'lucide-react';

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatCountdown(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export default function ContestEntryPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { startNavigation } = useNavigation();

  const [currentNow, setCurrentNow] = useState<number>(Date.now());

  // 1-second live ticker for dynamic wall-clock updates
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: contestData, isLoading } = useQuery({
    queryKey: ['contest', id],
    queryFn: () => contestApi.getContest(id).catch(() => null),
    retry: false,
  });

  // Real-time WebSocket listener for immediate instant status changes
  useEffect(() => {
    if (!id) return;
    const socket = getSocket();
    socket.emit('join:contest', { contestId: id });
    const handleStatusChange = (data: any) => {
      if (!data || !data.contestId || data.contestId === id) {
        queryClient.invalidateQueries({ queryKey: ['contest', id] });
        queryClient.invalidateQueries({ queryKey: ['attempt-check', id] });
      }
    };
    socket.on('contest:status-changed', handleStatusChange);
    return () => {
      socket.off('contest:status-changed', handleStatusChange);
    };
  }, [id, queryClient]);

  const { data: attemptData } = useQuery({
    queryKey: ['attempt-check', id],
    queryFn: () => contestApi.getAttemptState(id).catch(() => null),
    retry: false,
  });

  useEffect(() => {
    const raw = (contestData as any)?.attempt || attemptData;
    const isOff = Boolean((contestData as any)?.isTurnedOff);
    const computedSt = (contestData as any)?.computedStatus || (contestData as any)?.status;
    const isLive = !isOff && computedSt === 'live';

    if (raw) {
      const a = (raw as any)?.attempt || raw;
      if (a?.status === 'submitted' || a?.status === 'graded') {
        startNavigation('Opening results...');
        router.replace(`/contest/${id}/results`);
      } else if (a?.status === 'in_progress' && isLive) {
        startNavigation('Resuming active assessment...');
        router.replace(`/contest/${id}/attempt`);
      }
    }
  }, [contestData, attemptData, id, router, startNavigation]);

  const startMutation = useMutation({
    mutationFn: () => {
      startNavigation('Initializing assessment environment...');
      return contestApi.startAttempt(id);
    },
    onSuccess: () => {
      startNavigation('Launching test interface...');
      router.push(`/contest/${id}/attempt`);
    },
  });

  if (isLoading || !contestData) {
    return <ContestEntrySkeleton />;
  }

  const contest = contestData as {
    title?: string;
    startTime?: string;
    endTime?: string;
    durationMinutes?: number;
    totalMarks?: number;
    description?: string;
    activationMode?: 'scheduled' | 'manual';
    isTurnedOff?: boolean;
    computedStatus?: string;
    status?: string;
    proctorConfig?: {
      enabled?: boolean;
      blockTabSwitch?: boolean;
      blockCopyPaste?: boolean;
      enforceFullscreen?: boolean;
      blockRightClick?: boolean;
      maxViolations?: number;
    };
  };

  const isManual = contest.activationMode === 'manual';
  const isTurnedOff = Boolean(contest.isTurnedOff);
  const rawStatus = (contest.computedStatus || contest.status || 'draft').toLowerCase();

  const startMs = contest.startTime ? new Date(contest.startTime).getTime() : 0;
  const endMs = contest.endTime ? new Date(contest.endTime).getTime() : 0;
  const start = startMs ? new Date(startMs) : null;
  const end = endMs ? new Date(endMs) : null;

  let isLive = false;
  let isUpcoming = false;
  let isOver = false;

  if (isTurnedOff) {
    // Explicitly turned off by administrator in either mode
    isOver = true;
  } else if (isManual) {
    // In MANUAL mode: ONLY LIVE when admin turned it ON (status === 'live' or computedStatus === 'live')
    if (rawStatus === 'live') {
      isLive = true;
    } else if (rawStatus === 'ended' || rawStatus === 'archived') {
      isOver = true;
    } else {
      // 'draft', 'scheduled', or not yet activated by admin
      isUpcoming = true;
    }
  } else {
    // In SCHEDULED mode:
    if (rawStatus === 'draft') {
      isUpcoming = true;
    } else if (rawStatus === 'archived' || rawStatus === 'ended') {
      isOver = true;
    } else if (startMs && currentNow < startMs) {
      // Scheduled start time is in the future
      isUpcoming = true;
    } else if (endMs && currentNow > endMs) {
      // Scheduled end time has passed
      isOver = true;
    } else if (startMs && endMs && currentNow >= startMs && currentNow <= endMs) {
      // Current time is strictly inside the live window
      isLive = true;
    } else {
      // Missing or invalid timeline dates
      isUpcoming = true;
    }
  }

  const secondsUntilStart = startMs && currentNow < startMs ? Math.max(0, Math.floor((startMs - currentNow) / 1000)) : 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-2xs">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#3760F8] hover:text-[#254EDB] px-3 py-1.5 rounded-lg bg-[#EEF2FF] hover:bg-[#E0E7FF] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
          <h1 className="text-base font-bold text-slate-900 tracking-tight">{contest?.title || 'Contest Overview'}</h1>
        </div>
        <div className="flex items-center gap-2">
          {isLive && <Badge color="green" dot>Live Session</Badge>}
          {isUpcoming && <Badge color="yellow" dot>Starts Soon</Badge>}
          {isOver && <Badge color="gray">Ended</Badge>}
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 sm:py-10 space-y-6">
        {/* Contest Details Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-[#3760F8] uppercase tracking-wider">Assessment Specifications</span>
              <h2 className="text-xl font-bold text-slate-900 mt-1 tracking-tight">{contest?.title || 'Contest'}</h2>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Duration</span>
              </div>
              <div className="text-base font-bold text-slate-900">
                {contest?.durationMinutes ? formatDuration(contest.durationMinutes) : '—'}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Award className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Total Marks</span>
              </div>
              <div className="text-base font-bold text-[#3760F8]">
                {contest?.totalMarks ?? '—'} pts
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Calendar className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Starts</span>
              </div>
              <div className="text-xs font-semibold text-slate-800">
                {start ? start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
              </div>
              <div className="text-[10px] text-slate-600">
                {start ? start.toLocaleDateString() : ''}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Calendar className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Ends</span>
              </div>
              <div className="text-xs font-semibold text-slate-800">
                {end ? end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
              </div>
              <div className="text-[10px] text-slate-600">
                {end ? end.toLocaleDateString() : ''}
              </div>
            </div>
          </div>

          {contest?.description && (
            <p className="text-slate-600 text-xs sm:text-sm border-t border-slate-100 pt-4 leading-relaxed">
              {contest.description}
            </p>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900">
            <Info className="w-5 h-5 text-[#3760F8]" />
            <h3 className="text-base font-bold tracking-tight">Instructions &amp; Code of Conduct</h3>
          </div>
          <ul className="grid gap-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <li className="flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>Read all questions carefully. You may navigate freely across all sections and problems.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>Your timer starts immediately once you click <strong>Start Test</strong>. Timer is synchronized server-side.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>All MCQ answers and coding drafts are automatically saved every 30 seconds.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>The test will automatically lock and submit when the timer expires.</span>
            </li>
          </ul>
        </div>

        {/* Proctoring Rules */}
        {contest?.proctorConfig?.enabled && (
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-amber-900">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              <h3 className="text-base font-bold tracking-tight">Automated Proctoring Rules Active</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-2 text-xs text-amber-950 font-medium pt-1">
              {contest.proctorConfig.blockTabSwitch && (
                <div className="bg-white/80 border border-amber-200/60 rounded-xl px-3 py-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Tab switching is tracked and logged.</span>
                </div>
              )}
              {contest.proctorConfig.blockCopyPaste && (
                <div className="bg-white/80 border border-amber-200/60 rounded-xl px-3 py-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Clipboard copy and paste is prohibited.</span>
                </div>
              )}
              {contest.proctorConfig.enforceFullscreen && (
                <div className="bg-white/80 border border-amber-200/60 rounded-xl px-3 py-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Full-screen mode is required throughout.</span>
                </div>
              )}
              {contest.proctorConfig.blockRightClick && (
                <div className="bg-white/80 border border-amber-200/60 rounded-xl px-3 py-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Context menu (right-click) is disabled.</span>
                </div>
              )}
            </div>
            {contest.proctorConfig.maxViolations && (
              <p className="text-[11px] text-amber-800 pt-1">
                Note: Exceeding <strong>{contest.proctorConfig.maxViolations} violations</strong> will automatically submit and terminate your test.
              </p>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="flex flex-col items-center justify-center pt-2">
          {isLive ? (
            <Button
              size="lg"
              onClick={() => startMutation.mutate()}
              loading={startMutation.isPending}
              className="px-10 py-3.5 text-sm font-semibold rounded-2xl shadow-md hover:shadow-xl hover:shadow-[#3760F8]/25"
              leftIcon={<Play className="w-4 h-4 fill-white" />}
            >
              Start Assessment Now
            </Button>
          ) : isUpcoming ? (
            <div className="text-center bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs max-w-md w-full space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  {isManual ? 'Assessment is Currently Turned OFF' : 'Assessment Opens Soon'}
                </h4>
                {isManual ? (
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    This contest is set to Manual Activation mode. Waiting for the administrator to turn the assessment LIVE. This page will update automatically as soon as it is turned on.
                  </p>
                ) : secondsUntilStart > 0 ? (
                  <div className="mt-2.5">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Live Countdown</span>
                    <span className="text-3xl font-mono font-black text-[#3760F8] tracking-tight">
                      {formatCountdown(secondsUntilStart)}
                    </span>
                    <p className="text-xs text-slate-500 mt-1">
                      Unlocks at {start ? start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'start time'}. Your test will unlock automatically without refreshing.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 mt-1">
                    {rawStatus === 'draft'
                      ? 'This assessment is currently in draft mode.'
                      : 'Preparing test session. Unlocking in real-time...'}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-sm">
              <p className="text-sm font-semibold text-slate-800">Contest Closed</p>
              <p className="text-xs text-slate-500 mt-1">
                {isTurnedOff
                  ? 'This assessment has been turned off by the administrator.'
                  : 'This test has officially concluded.'}
              </p>
            </div>
          )}

          {startMutation.isError && (
            <div className="flex items-center gap-2 mt-3 px-4 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
              <span>
                {(startMutation.error as any)?.response?.data?.error?.message ||
                  (startMutation.error as any)?.response?.data?.message ||
                  (startMutation.error as any)?.message ||
                  'Failed to start. Please try again.'}
              </span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
