import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-8 w-32" />
      <div className="grid gap-5 lg:grid-cols-3">
        <Skeleton className="h-64 lg:col-span-1" />
        <div className="lg:col-span-2 space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      </div>
    </div>
  );
}
