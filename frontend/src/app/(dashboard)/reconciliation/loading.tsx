import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-8 w-52" />
      <div className="grid gap-5 lg:grid-cols-5">
        <Skeleton className="h-80 lg:col-span-2" />
        <div className="lg:col-span-3 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      </div>
    </div>
  );
}
