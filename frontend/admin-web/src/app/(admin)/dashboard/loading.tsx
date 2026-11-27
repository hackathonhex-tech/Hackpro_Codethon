import { MetricCardsSkeleton, TableSkeleton } from '@/components/ui/Skeleton';

export default function DashboardLoading() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="space-y-1">
        <div className="h-7 w-48 bg-slate-200/80 rounded-lg animate-pulse" />
        <div className="h-4 w-72 bg-slate-200/60 rounded-md animate-pulse" />
      </div>
      <MetricCardsSkeleton count={4} />
      <TableSkeleton rows={6} cols={4} />
    </div>
  );
}
