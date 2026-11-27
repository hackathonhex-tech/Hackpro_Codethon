'use client';
import { useQuery } from '@tanstack/react-query';
import { contestsApi } from '@/lib/api';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { Trophy, ArrowRight, Calendar, Users, Clock } from 'lucide-react';

interface ContestItem {
  id?: string;
  _id?: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  durationMinutes?: number;
  status?: string;
}

export default function LeaderboardIndexPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['contests-leaderboard'],
    queryFn: () => contestsApi.list(),
  });

  const contests: ContestItem[] =
    (data as any)?.data ||
    (data as any)?.contests ||
    (Array.isArray(data) ? data : []);

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Trophy className="w-6 h-6 text-[#3760F8]" />
            <span>Contest Leaderboards</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Select an assessment contest to inspect live ranking standings and candidate score sheets.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : contests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
          <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No Assessment Contests Available</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Create an assessment contest first to begin tracking candidate leaderboards.
          </p>
          <div className="mt-5">
            <Link href="/contests">
              <Button size="sm">Go to Contests</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {contests.map((c) => {
            const cid = c.id || c._id;
            return (
              <div
                key={cid}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <Badge color="primary" dot>Live Leaderboard</Badge>
                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {c.durationMinutes || 60}m
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base group-hover:text-[#3760F8] transition-colors line-clamp-1">
                    {c.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {c.description || 'Assessment challenge evaluation and scoring rankings.'}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400">
                    {c.startTime ? new Date(c.startTime).toLocaleDateString() : 'Active'}
                  </div>
                  <Link href={`/contests/${cid}?tab=leaderboard`}>
                    <Button size="sm" variant="outline">
                      <span>View Leaderboard</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
