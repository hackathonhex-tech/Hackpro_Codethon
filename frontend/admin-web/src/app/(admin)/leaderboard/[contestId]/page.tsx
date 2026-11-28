'use client';
import { useState, useMemo, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { leaderboardApi, contestsApi } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import Link from 'next/link';
import { ArrowLeft, Trophy, Lock, Clock, Award, ArrowUpDown, ChevronDown, Check } from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'score_desc_time_asc', label: 'Highest Score • Shortest Time (Official)', desc: 'Official evaluation standard' },
  { value: 'score_desc_time_desc', label: 'Highest Score • Longest Time', desc: 'Highest total score with maximum duration' },
  { value: 'time_asc_score_desc', label: 'Shortest Time • Highest Score', desc: 'Fastest submissions first' },
  { value: 'score_asc_time_asc', label: 'Lowest Score • Shortest Time', desc: 'Lowest marks with fastest submissions' },
  { value: 'time_desc_score_asc', label: 'Longest Time • Lowest Score', desc: 'Longest duration with lowest marks' },
];

interface LeaderboardEntry {
  rank: number;
  displayRank?: number;
  participantId: string;
  displayName: string;
  rollNumber?: string;
  totalScore: number;
  mcqScore?: number;
  codingScore?: number;
  timeTakenMinutes?: number;
  completionTimeSeconds?: number;
  formattedTimeTaken?: string;
}

export default function LeaderboardPage() {
  const { contestId } = useParams<{ contestId: string }>();
  const [sortFilter, setSortFilter] = useState<'score_desc_time_asc' | 'score_desc_time_desc' | 'time_asc_score_desc' | 'score_asc_time_asc' | 'time_desc_score_asc'>('score_desc_time_asc');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: contestData } = useQuery({ queryKey: ['contest', contestId], queryFn: () => contestsApi.get(contestId) });
  const contest = contestData as { title?: string } | null;

  const { data: lbData, isLoading } = useQuery({
    queryKey: ['leaderboard-admin', contestId],
    queryFn: () => leaderboardApi.get(contestId),
    refetchInterval: 30000,
  });

  const rawData: any = (lbData as any)?.data || lbData;
  const rawEntries: any = rawData?.entries || (Array.isArray(rawData) ? rawData : []);
  const entries: LeaderboardEntry[] = useMemo(() => {
    const list: LeaderboardEntry[] = rawEntries.map((e: any, idx: number) => {
      const secs = e.completionTimeSeconds || 0;
      const fallbackFormatted = secs > 0
        ? (secs >= 3600
            ? `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m ${secs % 60}s`
            : `${Math.floor(secs / 60)}m ${secs % 60}s`)
        : (e.timeTakenMinutes != null ? `${e.timeTakenMinutes}m` : '—');

      return {
        rank: e.rank || idx + 1,
        participantId: e.participantId || e.userId || `user_${idx}`,
        displayName: e.displayName || e.name || 'Candidate',
        rollNumber: e.rollNumber || '—',
        totalScore: e.totalScore ?? e.score ?? 0,
        mcqScore: e.mcqScore ?? 0,
        codingScore: e.codingScore ?? 0,
        completionTimeSeconds: secs,
        formattedTimeTaken: e.formattedTimeTaken || fallbackFormatted,
        timeTakenMinutes: e.timeTakenMinutes ?? (secs ? Math.round(secs / 60) : 0),
      };
    });

    list.sort((a, b) => {
      const aScore = a.totalScore;
      const bScore = b.totalScore;
      const aTime = (a.completionTimeSeconds && a.completionTimeSeconds > 0) ? a.completionTimeSeconds : 999999999;
      const bTime = (b.completionTimeSeconds && b.completionTimeSeconds > 0) ? b.completionTimeSeconds : 999999999;

      if (sortFilter === 'score_desc_time_asc') {
        if (bScore !== aScore) return bScore - aScore;
        return aTime - bTime;
      }
      if (sortFilter === 'score_desc_time_desc') {
        if (bScore !== aScore) return bScore - aScore;
        return bTime - aTime;
      }
      if (sortFilter === 'time_asc_score_desc') {
        if (aTime !== bTime) return aTime - bTime;
        return bScore - aScore;
      }
      if (sortFilter === 'score_asc_time_asc') {
        if (aScore !== bScore) return aScore - bScore;
        return aTime - bTime;
      }
      if (sortFilter === 'time_desc_score_asc') {
        if (bTime !== aTime) return bTime - aTime;
        return aScore - bScore;
      }
      return 0;
    });

    return list.map((item, idx) => ({ ...item, displayRank: idx + 1 }));
  }, [rawEntries, sortFilter]);

  const isFrozen = rawData?.isFrozen || rawData?.frozen;

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/contests/${contestId}?tab=leaderboard`}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#3760F8] hover:text-[#254EDB] px-3 py-1.5 rounded-lg bg-[#EEF2FF] hover:bg-[#E0E7FF] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Contest Management</span>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Real-Time Leaderboard</h1>
              {isFrozen && (
                <Badge color="yellow" dot>
                  Score Freeze Active
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{contest?.title || 'Contest'} &bull; Synchronized ranking table</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Auto-refreshing 30s</span>
        </div>
      </div>

      {/* Ranking Criteria Callout & Dynamic Sort Filter */}
      <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-slate-600 shadow-2xs">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-[#3760F8] shrink-0" />
          <span>
            <strong className="text-slate-800">Standard Criteria:</strong> 1. <strong>Highest Score</strong> &bull; 2. <strong>Fastest Submission</strong>.
          </span>
        </div>

        {/* Modern Custom Floating Dropdown (No native OS select boxui) */}
        <div className="relative self-start md:self-auto" ref={sortDropdownRef}>
          <button
            type="button"
            onClick={() => setIsSortOpen((prev) => !prev)}
            className="flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-[#3760F8]/30 transition-all cursor-pointer min-w-[270px] max-w-[340px]"
          >
            <div className="flex items-center gap-2 truncate">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#3760F8] shrink-0" />
              <span className="truncate">{SORT_OPTIONS.find((o) => o.value === sortFilter)?.label}</span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${isSortOpen ? 'rotate-180 text-[#3760F8]' : ''}`} />
          </button>

          {isSortOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3.5 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Ranking &amp; Tie-Breaker Filter
              </div>
              <div className="py-1">
                {SORT_OPTIONS.map((opt) => {
                  const isSelected = sortFilter === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setSortFilter(opt.value as any);
                        setIsSortOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#EEF2FF] text-[#3760F8] font-bold'
                          : 'text-slate-700 font-medium hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span>{opt.label}</span>
                        <span className="text-[10px] text-slate-400 font-normal">{opt.desc}</span>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-[#3760F8] text-white flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <div className="overflow-x-auto">
            {(() => {
              const hasMcq = Boolean((contest as any)?.enableMcq && (entries.some((e) => (e.mcqScore ?? 0) > 0) || (contest as any)?.expectedMcqCount > 0));
              const headers = hasMcq
                ? ['Rank', 'Participant', 'Roll No.', 'MCQ Marks', 'Coding Marks', 'Total Score', 'Time Taken']
                : ['Rank', 'Participant', 'Roll No.', 'Coding Marks', 'Total Score', 'Time Taken'];
              const colSpan = headers.length;

              return (
                <table className="min-w-full divide-y divide-slate-200/80">
                  <thead className="bg-slate-50/80">
                    <tr>
                      {headers.map((h) => (
                        <th key={h} className="px-5 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {entries.length === 0 ? (
                      <tr>
                        <td colSpan={colSpan} className="text-center py-16 text-xs text-slate-400">
                          No candidate submissions recorded on the leaderboard yet.
                        </td>
                      </tr>
                    ) : (
                      entries.map((entry) => (
                        <tr key={entry.participantId} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-5 py-3.5">
                            <span className={`w-7 h-7 inline-flex items-center justify-center rounded-xl text-xs font-bold ${
                              (entry.displayRank || entry.rank) === 1
                                ? 'bg-[#D3FE4F] text-[#0B0F19] shadow-xs'
                                : (entry.displayRank || entry.rank) <= 3
                                ? 'bg-[#3760F8] text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              #{entry.displayRank || entry.rank}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-xs font-semibold text-slate-900 tracking-tight">
                            {entry.displayName}
                          </td>
                          <td className="px-5 py-3.5 text-xs font-mono text-slate-500">{entry.rollNumber || '—'}</td>
                          {hasMcq && (
                            <td className="px-5 py-3.5 text-xs font-mono text-slate-700">{entry.mcqScore ?? 0} Marks</td>
                          )}
                          <td className="px-5 py-3.5 text-xs font-mono text-slate-700">{entry.codingScore ?? 0} Marks</td>
                          <td className="px-5 py-3.5 text-xs font-mono font-extrabold text-[#3760F8]">
                            {entry.totalScore} Marks
                          </td>
                          <td className="px-5 py-3.5 text-xs">
                            <span className="inline-flex items-center gap-1.5 font-mono text-slate-700 font-semibold bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {entry.formattedTimeTaken || '—'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
