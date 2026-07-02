import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <div className="space-y-5">
      <div className="flex justify-between"><Skeleton className="h-8 w-44" /><Skeleton className="h-9 w-24" /></div>
      <div className="flex gap-3"><Skeleton className="h-9 w-64" /><div className="flex gap-1">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-7 w-16" />)}</div></div>
      <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
    </div>
  );
}
