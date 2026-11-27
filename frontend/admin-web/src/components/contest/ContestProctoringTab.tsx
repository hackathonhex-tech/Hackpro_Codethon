'use client';
import { useQuery } from '@tanstack/react-query';
import { proctoringApi } from '@/lib/api';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { ShieldAlert, AlertTriangle, Eye, RefreshCw, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ProctorEvent {
  id?: string;
  _id?: string;
  attemptId: string;
  userId: string;
  userName?: string;
  userRoll?: string;
  type: string;
  timestamp?: string;
  createdAt?: string;
  details?: Record<string, any>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  resolved?: boolean;
}

export function ContestProctoringTab({ contestId }: { contestId: string }) {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['proctor-feed', contestId],
    queryFn: () => proctoringApi.getFeed(contestId),
    refetchInterval: 5000,
  });

  const rawEvents: any = (data as any)?.events || (Array.isArray(data) ? data : []);
  const events: ProctorEvent[] = rawEvents;

  const formatViolationType = (t: string) => {
    switch (t) {
      case 'tab_switch':
        return 'Tab Switch Detected';
      case 'window_blur':
      case 'screen_blur':
        return 'Window / Application Lost Focus';
      case 'fullscreen_exit':
        return 'Exited Fullscreen Examination';
      case 'copy':
      case 'copy_action':
        return 'Clipboard Copy Prohibited';
      case 'paste':
      case 'paste_action':
        return 'Clipboard Paste Prohibited';
      case 'context_menu':
        return 'Right-Click Context Menu';
      case 'devtools_open':
        return 'Developer Tools Detected';
      default:
        return t.replace(/_/g, ' ').toUpperCase();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Eye className="w-5 h-5 text-[#3760F8]" />
            <span>Real-Time Assessment Security Feed</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitors fullscreen compliance, tab switching, and window blur events in real-time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Sync Active
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isFetching ? 'animate-spin' : ''}`} />}
          >
            Refresh Feed
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
          <ShieldAlert className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">Clean Proctoring Record</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            No integrity flags or fullscreen exits reported for this assessment session.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <table className="min-w-full divide-y divide-slate-200/80">
            <thead className="bg-slate-50/80">
              <tr>
                {['Timestamp', 'Candidate', 'Employee ID', 'Violation Type', 'Severity', 'Security Log / Reason'].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {events.map((evt, idx) => {
                const dateStr = evt.createdAt || evt.timestamp;
                const timeFormatted = dateStr ? new Date(dateStr).toLocaleTimeString() : '—';
                const reasonText = evt.details?.reason || (typeof evt.details === 'string' ? evt.details : null);

                return (
                  <tr key={evt.id || evt._id || idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 text-xs text-slate-500 font-mono whitespace-nowrap">
                      {timeFormatted}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-slate-900">
                      {evt.userName || evt.userId}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-mono text-slate-600">
                      {evt.userRoll || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-bold text-slate-900">
                      {formatViolationType(evt.type)}
                    </td>
                    <td className="px-5 py-3.5 text-xs">
                      <Badge
                        color={
                          evt.type === 'tab_switch' || evt.type === 'fullscreen_exit'
                            ? 'red'
                            : 'yellow'
                        }
                        dot
                      >
                        {evt.severity || (evt.type === 'tab_switch' || evt.type === 'fullscreen_exit' ? 'high' : 'warning')}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600 max-w-xs truncate">
                      {reasonText || (evt.details && Object.keys(evt.details).length > 0 ? JSON.stringify(evt.details) : 'Integrity check violation recorded')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
