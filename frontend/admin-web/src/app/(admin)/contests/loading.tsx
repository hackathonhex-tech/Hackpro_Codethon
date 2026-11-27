import { ContestCardsSkeleton } from '@/components/ui/Skeleton';

export default function ContestsLoading() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="h-7 w-40 bg-slate-200/80 rounded-lg animate-pulse" />
          <div className="h-4 w-60 bg-slate-200/60 rounded-md animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-slate-200/80 rounded-xl animate-pulse" />
      </div>
      <ContestCardsSkeleton count={4} />
    </div>
  );
}
