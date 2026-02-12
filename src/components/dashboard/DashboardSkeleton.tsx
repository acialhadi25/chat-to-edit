import { Skeleton } from "@/components/ui/skeleton";

const DashboardSkeleton = () => {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8 gap-6">
      <div className="w-full max-w-lg space-y-6">
        {/* Title skeleton */}
        <div className="text-center space-y-2">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>

        {/* Upload area skeleton */}
        <Skeleton className="h-48 w-full rounded-xl" />

        {/* Buttons skeleton */}
        <div className="flex gap-3 justify-center">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
