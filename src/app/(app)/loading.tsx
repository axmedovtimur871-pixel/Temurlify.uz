import { Skeleton } from "@/components/ui/misc";

export default function Loading() {
  return (
    <div className="space-y-8" aria-busy aria-label="Yuklanmoqda">
      <div className="space-y-3"><Skeleton className="h-4 w-32" /><Skeleton className="h-11 w-2/3 max-w-md" /></div>
      <Skeleton className="h-44 w-full rounded-[14px]" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-[14px]" />)}</div>
      <div className="grid gap-6 lg:grid-cols-2"><Skeleton className="h-64 rounded-[14px]" /><Skeleton className="h-64 rounded-[14px]" /></div>
    </div>
  );
}
