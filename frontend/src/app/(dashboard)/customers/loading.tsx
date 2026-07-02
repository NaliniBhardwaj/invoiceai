import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <div className="space-y-5">
      <div className="flex justify-between"><Skeleton className="h-8 w-40" /><Skeleton className="h-9 w-32" /></div>
      <Skeleton className="h-9 w-72" />
      <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
    </div>
  );
}
