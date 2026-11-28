'use client';
import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { contestApi, leaderboardApi } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { Spinner } from '@/components/ui/Spinner';
import { ResultsSkeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Trophy, Clock, ArrowLeft, CheckCircle2, Award, Sparkles, Calendar, User } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  displayName: string;
  totalScore: number;
  formattedTimeTaken?: string;
  timeTakenMinutes?: number;
  completionTimeSeconds?: number;
  isCurrentUser?: boolean;
}

interface AttemptResult {
  status: string;
  totalScore?: number;
  mcqScore?: number;
  codingScore?: number;
  submittedAt?: string;
  startedAt?: string;
  completionTimeSeconds?: number;
  formattedTimeTaken?: string;
}

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof document !== 'undefined' && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  const { data: attemptData, isLoading, isError } = useQuery({
    queryKey: ['attempt-result', id],
    queryFn: () => contestApi.getAttemptState(id),
    retry: 1,
  });

  const { data: lbData } = useQuery({
    queryKey: ['leaderboard', id],
    queryFn: () => leaderboardApi.get(id).catch(() => null),
    retry: false,
  });

  const rawAttempt: any = (attemptData as any)?.attempt || attemptData;
  const contestInfo: any = (attemptData as any)?.contest || attemptData || {};

  // If attempt was revoked/unlocked, redirect student directly to attempt page
  useEffect(() => {
    if (rawAttempt?.status === 'in_progress') {
      router.replace(`/contest/${id}/attempt`);
    }
  }, [rawAttempt?.status, id, router]);

  // Real-time listener: if admin revokes/unlocks while student is viewing results, redirect to attempt page
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !id) return;
    const onRevoked = () => {
      router.replace(`/contest/${id}/attempt`);
    };
    socket.on('attempt:revoked', onRevoked);
    return () => {
      socket.off('attempt:revoked', onRevoked);
    };
  }, [id, router]);

  const rawEntries: any[] = Array.isArray((lbData as any)?.entries)
    ? (lbData as any).entries
    : Array.isArray(lbData)
    ? lbData
    : [];

  const leaderboard: (LeaderboardEntry & { displayRank?: number })[] = useMemo(() => {
    const list: (LeaderboardEntry & { displayRank?: number })[] = rawEntries.map((e: any, idx: number) => {
      const entrySecs = Number(e?.completionTimeSeconds) || 0;
      const fallbackFormatted = entrySecs > 0
        ? (entrySecs >= 3600
            ? `${Math.floor(entrySecs / 3600)}h ${Math.floor((entrySecs % 3600) / 60).toString().padStart(2, '0')}m ${(entrySecs % 60).toString().padStart(2, '0')}s`
            : entrySecs >= 60
            ? `${Math.floor(entrySecs / 60)}m ${(entrySecs % 60).toString().padStart(2, '0')}s`
            : `${entrySecs}s`)
        : (e?.timeTakenMinutes != null ? `${e.timeTakenMinutes}m` : '—');

      return {
        rank: e?.rank || idx + 1,
        displayName: e?.displayName || e?.name || 'Participant',
        totalScore: Number(e?.totalScore ?? e?.score ?? 0),
        formattedTimeTaken: e?.formattedTimeTaken || fallbackFormatted,
        completionTimeSeconds: entrySecs,
        isCurrentUser: Boolean(
          e?.isCurrentUser ||
          (rawAttempt?.userId && (e?.userId === rawAttempt.userId || e?.participantId === rawAttempt.userId))
        ),
      };
    });

    list.sort((a, b) => {
      const aScore = Number(a.totalScore) || 0;
      const bScore = Number(b.totalScore) || 0;
      const aTime = (a.completionTimeSeconds && a.completionTimeSeconds > 0) ? a.completionTimeSeconds : 999999999;
      const bTime = (b.completionTimeSeconds && b.completionTimeSeconds > 0) ? b.completionTimeSeconds : 999999999;

      if (bScore !== aScore) return bScore - aScore;
      return aTime - bTime;
    });

    return list.map((item, idx) => ({ ...item, displayRank: idx + 1 }));
  }, [rawEntries, rawAttempt?.userId]);

  if (isLoading) {
    return <ResultsSkeleton />;
  }

  if (rawAttempt?.status === 'in_progress') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-slate-600 font-medium">Test in progress. Redirecting to assessment room...</p>
      </div>
    );
  }

  if (isError || !rawAttempt || !attemptData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-center">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 max-w-md shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-[#3760F8] flex items-center justify-center mx-auto">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Assessment Results</h2>
            <p className="text-xs text-slate-500 mt-1">
              No completed submission was found for this assessment.
            </p>
          </div>
          <Button variant="primary" onClick={() => router.push('/dashboard')} className="w-full">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const totalScore = rawAttempt.finalScore ?? rawAttempt.totalScore ?? rawAttempt.score ?? 0;
  const mcqScore = rawAttempt.mcqScore ?? 0;
  const codingScore = rawAttempt.codingScore ?? 0;
  const submittedAt = rawAttempt.submittedAt || rawAttempt.updatedAt;
  const startedAt = rawAttempt.startedAt;
  const durationMins = Number(contestInfo?.durationMinutes) > 0 ? Number(contestInfo.durationMinutes) : 30;
  const maxDurationSecs = durationMins * 60;

  const rawSecs = Number(rawAttempt.completionTimeSeconds) > 0
    ? Number(rawAttempt.completionTimeSeconds)
    : (submittedAt && startedAt
        ? Math.max(1, Math.floor((new Date(submittedAt).getTime() - new Date(startedAt).getTime()) / 1000))
        : 0);

  // Clamp time taken so it never exceeds the contest's maximum duration (e.g. 30 mins)
  const secs = rawSecs > 0 ? Math.min(rawSecs, maxDurationSecs) : 0;

  const formattedAttemptTime = rawAttempt.formattedTimeTaken && rawAttempt.formattedTimeTaken !== '—' && rawSecs <= maxDurationSecs
    ? rawAttempt.formattedTimeTaken
    : (secs > 0
        ? (secs >= 3600
            ? `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60).toString().padStart(2, '0')}m ${(secs % 60).toString().padStart(2, '0')}s`
            : secs >= 60
            ? `${Math.floor(secs / 60)}m ${(secs % 60).toString().padStart(2, '0')}s`
            : `${secs}s`)
        : '—');

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return '—';
    if (!mounted) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const userLeaderboardEntry = leaderboard.find((e) => e.isCurrentUser);
  const isInTop10 = leaderboard.slice(0, 10).some((e) => e.isCurrentUser);

  const showTotalPointsEarned =
    (attemptData as any)?.showTotalPointsEarned !== false &&
    (attemptData as any)?.contest?.showTotalPointsEarned !== false &&
    (attemptData as any)?.contest?.resultVisibility !== 'hidden';

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-16">
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-2xs">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#3760F8] hover:text-[#254EDB] px-3 py-1.5 rounded-lg bg-[#EEF2FF] hover:bg-[#E0E7FF] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight">Assessment Evaluation</h1>
            {contestInfo?.title && (
              <p className="text-[11px] text-slate-400 font-medium truncate max-w-xs sm:max-w-md">
                {contestInfo.title}
              </p>
            )}
          </div>
        </div>
        <Badge color={rawAttempt.status === 'graded' || rawAttempt.status === 'submitted' ? 'green' : 'primary'} dot>
          {rawAttempt.status === 'graded' ? 'Graded & Verified' : 'Submitted'}
        </Badge>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 sm:py-10 space-y-6">
        {/* Score Hero Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 text-center shadow-xs relative overflow-hidden">
          <div className="inline-flex items-center gap-1.5 bg-[#EEF2FF] text-[#3760F8] px-3.5 py-1 rounded-full text-xs font-semibold mb-4">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Submission Recorded</span>
          </div>

          {showTotalPointsEarned ? (
            <>
              <div className="text-6xl sm:text-7xl font-extrabold text-[#3760F8] tracking-tight mb-1">
                {totalScore}
              </div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Total Marks Earned
              </p>

              <div className="inline-flex items-center gap-2 bg-[#EEF2FF] border border-[#C7D2FE] px-4 py-1.5 rounded-full text-xs font-semibold text-[#3760F8] mb-8 shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-[#3760F8]" />
                <span>Time Taken to Complete: <strong className="font-mono text-slate-900 ml-1">{formattedAttemptTime}</strong></span>
              </div>

              {/* Dynamic 2-card (Coding Only) or 3-card (MCQ + Coding) Breakdown */}
              {(() => {
                const hasMcq = Boolean(contestInfo?.enableMcq && (mcqScore > 0 || (contestInfo?.expectedMcqCount && contestInfo.expectedMcqCount > 0)));
                return (
                  <div className={`grid ${hasMcq ? 'grid-cols-3' : 'grid-cols-2'} gap-3 sm:gap-4 text-left`}>
                    {hasMcq && (
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">MCQ Marks</span>
                        <div className="text-xl font-bold text-slate-900 mt-1">{mcqScore}</div>
                      </div>
                    )}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Coding Marks</span>
                      <div className="text-xl font-bold text-slate-900 mt-1">{codingScore}</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#3760F8]" />
                        Time Taken
                      </span>
                      <div className="text-xl font-bold text-slate-900 mt-1 font-mono">{formattedAttemptTime}</div>
                    </div>
                  </div>
                );
              })()}
            </>
          ) : (
            <div className="py-6 space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Test Completed &amp; Submitted</h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                Your answers have been securely recorded. Total marks and evaluation scores are hidden by your administrator and will be released after cohort review.
              </p>
              <div className="inline-flex items-center gap-2 bg-[#EEF2FF] border border-[#C7D2FE] px-4 py-2 rounded-xl text-xs text-[#3760F8] font-semibold mt-3 shadow-2xs">
                <Clock className="w-4 h-4 text-[#3760F8]" />
                <span>Time Taken to Complete: <strong className="text-slate-900 font-mono text-sm ml-1">{formattedAttemptTime}</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* Candidate Attempt & Time Details Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Attempt &amp; Submission Summary</h2>
            </div>
            <span className="text-[11px] font-mono text-slate-400">ID: {String(rawAttempt.id || rawAttempt._id || id).slice(-8)}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100/90">
              <div className="w-10 h-10 rounded-xl bg-blue-100/80 text-[#3760F8] flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Time Taken to Complete</span>
                <p className="text-sm font-extrabold text-slate-900 font-mono mt-0.5">{formattedAttemptTime}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100/90">
              <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Evaluation Status</span>
                <p className="text-sm font-bold text-emerald-700 mt-0.5">
                  {rawAttempt.status === 'graded' ? 'Graded & Verified' : 'Submitted Successfully'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100/90">
              <div className="w-10 h-10 rounded-xl bg-indigo-100/80 text-indigo-600 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Submitted Timestamp</span>
                <p className="text-xs font-bold text-slate-800 font-mono mt-0.5">
                  {formatDateTime(submittedAt)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        {showTotalPointsEarned && leaderboard.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">Contest Leaderboard</h2>
                <p className="text-[11px] text-slate-400">
                  Ranked by highest score &bull; Tiebreaker: shortest completion time
                </p>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-slate-600 text-xs font-semibold">
                Official Standings
              </span>
            </div>

            <div className="space-y-2">
              {leaderboard.slice(0, 10).map((entry, i) => {
                const rankNum = entry.displayRank || entry.rank;
                return (
                  <div
                    key={i}
                    className={`flex items-center justify-between gap-2.5 sm:gap-4 px-3.5 py-3 rounded-2xl transition-colors ${
                      entry.isCurrentUser
                        ? 'bg-[#EEF2FF] border border-[#C7D2FE]'
                        : 'bg-slate-50 border border-slate-100 hover:bg-slate-100/60'
                    }`}
                  >
                    {/* Left: Rank & Name */}
                    <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                      <span
                        className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-xl text-xs font-bold shrink-0 ${
                          rankNum === 1
                            ? 'bg-[#D3FE4F] text-[#0B0F19] shadow-xs'
                            : rankNum <= 3
                            ? 'bg-[#3760F8] text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-700'
                        }`}
                      >
                        #{rankNum}
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs sm:text-sm font-semibold text-slate-900 tracking-tight block truncate">
                          {entry.displayName}
                          {entry.isCurrentUser && (
                            <span className="text-[11px] text-[#3760F8] font-bold ml-1.5">(You)</span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Right: Time & Score */}
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      <span
                        className="text-[11px] sm:text-xs font-mono text-slate-600 flex items-center gap-1 bg-white border border-slate-200 px-2 sm:px-2.5 py-1 rounded-lg shadow-2xs whitespace-nowrap"
                        title="Time taken to complete contest"
                      >
                        <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0" />
                        {entry.formattedTimeTaken || '—'}
                      </span>
                      <span className="text-xs sm:text-sm font-extrabold text-[#3760F8] font-mono whitespace-nowrap min-w-[65px] sm:min-w-[80px] text-right">
                        {entry.totalScore} Marks
                      </span>
                    </div>
                  </div>
                );
              })}

              {userLeaderboardEntry && !isInTop10 && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    Your Current Standings
                  </span>
                  <div className="flex items-center justify-between gap-2.5 sm:gap-4 px-3.5 py-3 rounded-2xl bg-[#EEF2FF] border border-[#C7D2FE]">
                    <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                      <span className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-xl text-xs font-bold bg-[#3760F8] text-white shadow-xs shrink-0">
                        #{userLeaderboardEntry.displayRank || userLeaderboardEntry.rank}
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs sm:text-sm font-semibold text-slate-900 tracking-tight block truncate">
                          {userLeaderboardEntry.displayName}{' '}
                          <span className="text-[11px] text-[#3760F8] font-bold ml-1.5">(You)</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      <span className="text-[11px] sm:text-xs font-mono text-slate-600 flex items-center gap-1 bg-white border border-slate-200 px-2 sm:px-2.5 py-1 rounded-lg shadow-2xs whitespace-nowrap">
                        <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0" />
                        {userLeaderboardEntry.formattedTimeTaken || '—'}
                      </span>
                      <span className="text-xs sm:text-sm font-extrabold text-[#3760F8] font-mono whitespace-nowrap min-w-[65px] sm:min-w-[80px] text-right">
                        {userLeaderboardEntry.totalScore} Marks
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-center pt-2">
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </main>
    </div>
  );
}
