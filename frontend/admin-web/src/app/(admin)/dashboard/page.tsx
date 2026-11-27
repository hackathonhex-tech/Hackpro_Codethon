'use client';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi, contestsApi } from '@/lib/api';
import { Spinner } from '@/components/ui/Spinner';
import { MetricCardsSkeleton, TableSkeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import {
  Users,
  Play,
  UserCheck,
  CheckCircle2,
  Award,
  Trophy,
  Download,
  BarChart3,
  ShieldAlert,
  Code2,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

interface Contest {
  _id: string;
  title: string;
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent = 'blue',
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent?: 'blue' | 'lime' | 'emerald' | 'amber';
}) {
  const accentStyles = {
    blue: 'border-slate-200/80 hover:border-[#3760F8]/40 bg-white text-[#3760F8]',
    lime: 'border-slate-200/80 hover:border-[#D3FE4F] bg-white text-slate-900',
    emerald: 'border-slate-200/80 hover:border-emerald-400 bg-white text-emerald-600',
    amber: 'border-slate-200/80 hover:border-amber-400 bg-white text-amber-600',
  };

  return (
    <div className={`rounded-2xl border p-5 bg-white shadow-xs transition-all hover:shadow-card ${accentStyles[accent]}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600">
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{value}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [selectedContest, setSelectedContest] = useState('');

  const { data: contestsData } = useQuery({
    queryKey: ['contests-list'],
    queryFn: () => contestsApi.list({ limit: 50 }),
    retry: 1,
  });
  const contests: Contest[] = (contestsData as { data?: Contest[] })?.data || [];

  // Automatically default to the active/live contest so metrics match the active contest
  useEffect(() => {
    if (!selectedContest && contests.length > 0) {
      const active = (contests as any[]).find((c) => c.status === 'live') || contests[0];
      if (active?._id) {
        setSelectedContest(active._id);
      }
    }
  }, [contests, selectedContest]);

  const {
    data: statsData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['analytics-dashboard', selectedContest],
    queryFn: () => analyticsApi.getDashboard(selectedContest || undefined),
    retry: 1,
  });

  const handleExport = async () => {
    try {
      const blob = await analyticsApi.exportCsv(selectedContest || undefined);
      const url = URL.createObjectURL(blob as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'analytics.csv';
      a.click();
    } catch {}
  };

  // Normalize backend analytics data structure
  const raw: any = statsData || {};
  const metrics = raw.stats || raw || {};
  const registered = metrics.totalRegistered ?? metrics.registered ?? 0;
  const started = metrics.started ?? 0;
  const attending = metrics.currentlyAttempting ?? metrics.attending ?? 0;
  const submitted = metrics.submitted ?? 0;
  const avgScore = metrics.averageScore ?? metrics.avgScore ?? null;
  const highestScore = metrics.highestScore ?? null;

  // Normalize score distribution
  const scoreDistArray: { range: string; count: number }[] = raw.scoreDistribution
    ? Array.isArray(raw.scoreDistribution)
      ? raw.scoreDistribution
      : Object.entries(raw.scoreDistribution).map(([range, count]) => ({ range, count: Number(count) }))
    : [
        { range: '0-20', count: 0 },
        { range: '21-40', count: 0 },
        { range: '41-60', count: 0 },
        { range: '61-80', count: 0 },
        { range: '81-100', count: 0 },
      ];

  // Normalize language distribution
  const languageArray: { language: string; count: number }[] = raw.languageUsage
    ? Array.isArray(raw.languageUsage)
      ? raw.languageUsage
    : Object.entries(raw.languageUsage).map(([language, count]) => ({ language, count: Number(count) }))
    : [];

  // Normalize proctoring violations
  const violationArray: { type: string; count: number }[] = raw.violationSummary?.byType
    ? Object.entries(raw.violationSummary.byType).map(([type, count]) => ({ type, count: Number(count) }))
    : Array.isArray(raw.violationSummary)
    ? raw.violationSummary
    : [];

  const topPerformers: { name: string; score: number; rank: number }[] = raw.topPerformers || [];

  return (
    <div className="p-6 sm:p-8 space-y-7 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Telemetry</h1>
          <p className="text-xs text-slate-500 mt-1">Live analytics, cohort metrics, and proctoring telemetry</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-64">
            <Select
              aria-label="Filter analytics by contest"
              selectSize="sm"
              value={selectedContest}
              onChange={(e) => setSelectedContest(e.target.value)}
            >
              <option value="">All Active Contests</option>
              {contests.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title}
                </option>
              ))}
            </Select>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            leftIcon={<Download className="w-3.5 h-3.5 text-slate-500" />}
          >
            Export Telemetry
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <MetricCardsSkeleton count={4} />
          <TableSkeleton rows={5} cols={4} />
        </div>
      ) : isError ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-10 text-center space-y-3">
          <p className="text-sm font-semibold text-slate-700">Unable to load telemetry right now</p>
          <p className="text-xs text-slate-400">Please make sure the backend server is active and try again.</p>
          <Button size="sm" variant="outline" onClick={() => refetch()} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
            Retry
          </Button>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard label="Registered" value={registered} icon={Users} accent="blue" />
            <StatCard label="Started" value={started} icon={Play} accent="amber" />
            <StatCard label="Active Roster" value={attending} icon={UserCheck} accent="lime" />
            <StatCard label="Submitted" value={submitted} icon={CheckCircle2} accent="emerald" />
            <StatCard
              label="Avg Score"
              value={avgScore != null ? Number(avgScore).toFixed(1) : '—'}
              icon={Award}
              accent="blue"
            />
            <StatCard label="Top Score" value={highestScore ?? '—'} icon={Trophy} accent="lime" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Score Distribution */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-[#3760F8]" />
                <h2 className="font-bold text-slate-900 text-sm tracking-tight">Score Distribution Cohort</h2>
              </div>
              <div className="space-y-3">
                {scoreDistArray.map((d, i) => {
                  const max = Math.max(...scoreDistArray.map((x) => x.count), 1);
                  const pct = Math.round((d.count / max) * 100);
                  return (
                    <div key={i} className="flex items-center gap-3 text-xs">
                      <span className="w-16 font-mono text-slate-500 text-[11px] font-medium">{d.range}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                        <div
                          className="bg-[#3760F8] h-4 rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-8 font-mono font-bold text-slate-700 text-right">{d.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Performers */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-[#3760F8]" />
                  <h2 className="font-bold text-slate-900 text-sm tracking-tight">Top Performers</h2>
                </div>
                <span className="text-[11px] font-semibold text-[#3760F8] bg-[#EEF2FF] px-2.5 py-0.5 rounded-full">
                  Rankings
                </span>
              </div>
              {topPerformers.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No submissions evaluated yet. Rankings will appear here once candidates complete tests.
                </div>
              ) : (
                <div className="space-y-2">
                  {topPerformers.slice(0, 7).map((p, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                          i === 0
                            ? 'bg-[#D3FE4F] text-[#0B0F19]'
                            : i < 3
                            ? 'bg-[#3760F8] text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {p.rank}
                      </span>
                      <span className="flex-1 text-xs font-semibold text-slate-800 tracking-tight">{p.name}</span>
                      <span className="font-mono font-extrabold text-[#3760F8] text-xs">{p.score} pts</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Language Usage Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <Code2 className="w-4 h-4 text-[#3760F8]" />
                <h2 className="font-bold text-slate-900 text-sm tracking-tight">Language Distribution</h2>
              </div>
              {languageArray.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No programming language executions recorded yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {languageArray.map((l, i) => {
                    const total = languageArray.reduce((s, x) => s + x.count, 0) || 1;
                    const pct = Math.round((l.count / total) * 100);
                    return (
                      <div key={i} className="flex items-center gap-3 text-xs">
                        <span className="w-24 text-slate-700 font-semibold truncate">{l.language}</span>
                        <div className="flex-1 bg-slate-100 rounded-full h-3.5 overflow-hidden">
                          <div className="bg-[#D3FE4F] h-3.5 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-slate-500 font-mono text-[11px] w-12 text-right">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Proctoring Violations Summary */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                <h2 className="font-bold text-slate-900 text-sm tracking-tight">Proctoring Violations Logged</h2>
              </div>
              {violationArray.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No security incidents or anti-cheat violations detected.
                </div>
              ) : (
                <div className="space-y-2">
                  {violationArray.map((v, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <span className="text-xs font-medium text-slate-700 capitalize">{v.type.replace(/_/g, ' ')}</span>
                      <Badge color="red">{v.count}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
