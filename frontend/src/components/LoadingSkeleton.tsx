// Simple skeleton component with shimmer effect
const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 ${className}`} />
);

export const VideoCardSkeleton = () => (
  <div className="bg-white dark:bg-petflix-dark rounded-lg overflow-hidden border border-gray-200/50 dark:border-gray-800/30">
    {/* Thumbnail skeleton */}
    <Skeleton className="w-full aspect-video" />
    
    {/* Content skeleton - hidden by default, only shown on hover */}
    <div className="p-3 space-y-2 opacity-0">
      {/* Title skeleton */}
      <Skeleton className="h-4 rounded w-3/4" />
      
      {/* User info skeleton */}
      <Skeleton className="h-3 rounded w-1/2" />
    </div>
  </div>
);

export const CommentSkeleton = () => (
  <div className="flex gap-3">
    {/* Avatar skeleton */}
    <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
    
    {/* Content skeleton */}
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 rounded w-24" />
      <Skeleton className="h-3 rounded w-full" />
      <Skeleton className="h-3 rounded w-3/4" />
    </div>
  </div>
);

export const PlaylistCardSkeleton = () => (
  <div className="bg-white dark:bg-petflix-dark rounded-lg p-6 border border-gray-200 dark:border-transparent">
    {/* Title skeleton */}
    <Skeleton className="h-6 rounded w-2/3 mb-3" />
    
    {/* Description skeleton */}
    <div className="space-y-2 mb-4">
      <Skeleton className="h-3 rounded w-full" />
      <Skeleton className="h-3 rounded w-1/2" />
    </div>
    
    {/* Meta info skeleton */}
    <div className="flex gap-4">
      <Skeleton className="h-3 rounded w-20" />
      <Skeleton className="h-3 rounded w-16" />
    </div>
  </div>
);

export const ProfileHeaderSkeleton = () => (
  <div className="bg-white dark:bg-petflix-dark rounded-lg p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 border border-gray-200 dark:border-transparent">
    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
      {/* Avatar skeleton */}
      <Skeleton className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full flex-shrink-0" />
      
      {/* Info skeleton */}
      <div className="flex-1 w-full sm:w-auto space-y-3">
        {/* Username */}
        <Skeleton className="h-8 rounded w-48 mx-auto sm:mx-0" />
        
        {/* Email */}
        <Skeleton className="h-4 rounded w-64 mx-auto sm:mx-0" />
        
        {/* Bio */}
        <Skeleton className="h-4 rounded w-full max-w-md" />
        
        {/* Stats */}
        <div className="flex justify-center sm:justify-start gap-4 sm:gap-6">
          <div className="space-y-1">
            <Skeleton className="h-6 rounded w-12" />
            <Skeleton className="h-3 rounded w-16" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-6 rounded w-12" />
            <Skeleton className="h-3 rounded w-16" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-6 rounded w-12" />
            <Skeleton className="h-3 rounded w-16" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Video Grid Skeleton (used across Search, Feed, Profile, etc.)
export const VideoGridSkeleton = ({ count = 12 }: { count?: number }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3">
    {Array.from({ length: count }).map((_, i) => (
      <VideoCardSkeleton key={i} />
    ))}
  </div>
);

// Settings Card Skeleton
export const SettingsCardSkeleton = () => (
  <div className="bg-white dark:bg-petflix-dark rounded-lg p-6 mb-6 border border-gray-200 dark:border-transparent">
    <Skeleton className="h-6 rounded w-48 mb-4" />
    <div className="space-y-4">
      <div>
        <Skeleton className="h-4 rounded w-24 mb-2" />
        <Skeleton className="h-10 rounded w-full" />
      </div>
      <div>
        <Skeleton className="h-4 rounded w-32 mb-2" />
        <Skeleton className="h-10 rounded w-full" />
      </div>
      <Skeleton className="h-10 rounded w-32" />
    </div>
  </div>
);
