export const VideoCardSkeleton = () => (
  <div className="bg-petflix-dark-gray rounded-lg overflow-hidden animate-pulse">
    {/* Thumbnail skeleton */}
    <div className="w-full aspect-video bg-petflix-gray"></div>
    
    {/* Content skeleton */}
    <div className="p-4 space-y-3">
      {/* Title skeleton */}
      <div className="h-5 bg-petflix-gray rounded w-3/4"></div>
      
      {/* User info skeleton */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-petflix-gray rounded-full"></div>
        <div className="h-4 bg-petflix-gray rounded w-24"></div>
      </div>
      
      {/* Description skeleton */}
      <div className="space-y-2">
        <div className="h-3 bg-petflix-gray rounded w-full"></div>
        <div className="h-3 bg-petflix-gray rounded w-2/3"></div>
      </div>
    </div>
  </div>
);

export const CommentSkeleton = () => (
  <div className="animate-pulse flex gap-3">
    {/* Avatar skeleton */}
    <div className="w-10 h-10 bg-petflix-gray rounded-full flex-shrink-0"></div>
    
    {/* Content skeleton */}
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-petflix-gray rounded w-24"></div>
      <div className="h-3 bg-petflix-gray rounded w-full"></div>
      <div className="h-3 bg-petflix-gray rounded w-3/4"></div>
    </div>
  </div>
);

export const PlaylistCardSkeleton = () => (
  <div className="bg-petflix-dark-gray rounded-lg p-6 animate-pulse">
    {/* Title skeleton */}
    <div className="h-6 bg-petflix-gray rounded w-2/3 mb-3"></div>
    
    {/* Description skeleton */}
    <div className="space-y-2 mb-4">
      <div className="h-3 bg-petflix-gray rounded w-full"></div>
      <div className="h-3 bg-petflix-gray rounded w-1/2"></div>
    </div>
    
    {/* Meta info skeleton */}
    <div className="flex gap-4">
      <div className="h-3 bg-petflix-gray rounded w-20"></div>
      <div className="h-3 bg-petflix-gray rounded w-16"></div>
    </div>
  </div>
);

export const ProfileHeaderSkeleton = () => (
  <div className="bg-petflix-dark-gray rounded-lg p-8 animate-pulse">
    <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
      {/* Avatar skeleton */}
      <div className="w-32 h-32 bg-petflix-gray rounded-full flex-shrink-0"></div>
      
      {/* Info skeleton */}
      <div className="flex-1 space-y-4 w-full">
        <div className="h-8 bg-petflix-gray rounded w-48"></div>
        <div className="h-4 bg-petflix-gray rounded w-32"></div>
        
        {/* Stats skeleton */}
        <div className="flex gap-6">
          <div className="h-5 bg-petflix-gray rounded w-24"></div>
          <div className="h-5 bg-petflix-gray rounded w-24"></div>
        </div>
        
        {/* Bio skeleton */}
        <div className="space-y-2">
          <div className="h-3 bg-petflix-gray rounded w-full"></div>
          <div className="h-3 bg-petflix-gray rounded w-3/4"></div>
        </div>
      </div>
    </div>
  </div>
);



