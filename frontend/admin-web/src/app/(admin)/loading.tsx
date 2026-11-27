import { MetricCardsSkeleton, TableSkeleton } from '@/components/ui/Skeleton';

export default function AdminLoading() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <MetricCardsSkeleton count={4} />
      <TableSkeleton rows={7} cols={5} />
    </div>
  );
}
