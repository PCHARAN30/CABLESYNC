function SkeletonElement({ className }) {
  return <div className={`animate-pulse rounded-md bg-hairline ${className}`} />;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header Skeleton */}
      <header className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <SkeletonElement className="h-11 w-full flex-1" />
        <SkeletonElement className="h-11 w-full sm:w-36" />
      </header>

      {/* Stat Cards Skeleton */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:gap-6">
        <SkeletonElement className="h-32 md:h-36" />
        <SkeletonElement className="h-32 md:h-36" />
        <SkeletonElement className="h-32 md:h-36" />
        <SkeletonElement className="h-32 md:h-36" />
      </div>

      {/* Main Content Grid Skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="lg:col-span-2">
          <div className="space-y-4 rounded-xl bg-card p-4 shadow-ledger sm:p-6">
            <SkeletonElement className="h-8 w-48" />
            <SkeletonElement className="h-16 w-full" />
            <SkeletonElement className="h-16 w-full" />
            <SkeletonElement className="h-16 w-full" />
            <SkeletonElement className="h-16 w-full" />
          </div>
        </div>

        <div className="space-y-6 lg:space-y-8">
          <SkeletonElement className="h-24 w-full" />
          <div className="space-y-4 rounded-xl bg-card p-4 shadow-ledger sm:p-6">
            <SkeletonElement className="h-8 w-40" />
            <SkeletonElement className="h-12 w-full" />
            <SkeletonElement className="h-12 w-full" />
            <SkeletonElement className="h-12 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardSkeleton;