"use client";

import { FC } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const subtleSkeletonStyle = cn(
  "bg-gray-200",
  "dark:bg-gray-700"
);

const ProfileFormSkeleton: FC = () => {
  return (
    <div className="space-y-8">
      <Skeleton className={`w-12 h-12 rounded-full ${subtleSkeletonStyle}`} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className={`h-8 w-full ${subtleSkeletonStyle}`} />
        <Skeleton className={`h-8 w-full ${subtleSkeletonStyle}`} />
      </div>
      <Skeleton className={`h-8 w-full ${subtleSkeletonStyle}`} />
      <Skeleton className={`h-8 w-full ${subtleSkeletonStyle}`} />
      <Skeleton className={`h-8 w-full ${subtleSkeletonStyle}`} />
      <Skeleton className={`h-8 w-full ${subtleSkeletonStyle}`} />
      <Skeleton className={`h-8 w-full ${subtleSkeletonStyle}`} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className={`h-8 w-full ${subtleSkeletonStyle}`} />
        <Skeleton className={`h-8 w-full ${subtleSkeletonStyle}`} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className={`h-8 w-full ${subtleSkeletonStyle}`} />
        <Skeleton className={`h-8 w-full ${subtleSkeletonStyle}`} />
        <Skeleton className={`h-8 w-full ${subtleSkeletonStyle}`} />
      </div>
    </div>
  );
};

export default ProfileFormSkeleton;
