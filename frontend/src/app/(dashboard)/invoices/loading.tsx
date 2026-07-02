import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <div className="space-y-5">
      <div className="flex justify-between"><Skeleton className="h-8 w-40" /><Skeleton className="h-9 w-32" /></div>
      <div className="flex gap-2 border-b border-border pb-2">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8 w-20" />)}
      </div>
      <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
    </div>
  );
}
