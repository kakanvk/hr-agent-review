import { Skeleton } from "@/components/ui/skeleton"

type EmailListSkeletonProps = {
  rows: number
}

export function EmailListSkeleton({ rows }: EmailListSkeletonProps) {
  return (
    <ul className="space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
        <li
          key={`skeleton-${index}`}
          className="space-y-2 rounded-xl border bg-background px-4 py-3"
        >
            <div className="flex items-start justify-between gap-3">
              <Skeleton className="h-5 w-3/5" />
              <Skeleton className="h-5 w-14" />
            </div>
            <Skeleton className="h-3 w-2/5" />
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-4 w-4/5" />
        </li>
        ))}
    </ul>
  )
}
