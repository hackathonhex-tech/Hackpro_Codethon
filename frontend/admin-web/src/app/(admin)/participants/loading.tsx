import { TableSkeleton } from '@/components/ui/Skeleton';

export default function ParticipantsLoading() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="h-7 w-44 bg-slate-200/80 rounded-lg animate-pulse" />
          <div className="h-4 w-64 bg-slate-200/60 rounded-md animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-28 bg-slate-200/80 rounded-xl animate-pulse" />
          <div className="h-10 w-28 bg-slate-200/80 rounded-xl animate-pulse" />
        </div>
      </div>
      <TableSkeleton rows={8} cols={5} />
    </div>
  );
}
