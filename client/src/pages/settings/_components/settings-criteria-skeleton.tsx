import { Skeleton } from "@/components/ui/skeleton"

type SettingsCriteriaSkeletonProps = {
  rows?: number
}

export function SettingsCriteriaSkeleton({ rows = 4 }: SettingsCriteriaSkeletonProps) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={`setting-skeleton-${index}`} className="space-y-2 rounded-md border p-3">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-8 w-28" />
        </div>
      ))}
    </div>
  )
}
