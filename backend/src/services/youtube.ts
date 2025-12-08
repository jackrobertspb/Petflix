import fetch from 'node-fetch';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: string;
  viewCount?: string;
  likeCount?: string;
  commentCount?: string;
}

export interface YouTubeSearchResult {
  videos: YouTubeVideo[];
  nextPageToken?: string;
  totalResults: number;
}

/**
 * Validate if a string is a valid YouTube URL or video ID
 */
export function validateYouTubeUrl(url: string): { valid: boolean; videoId?: string } {
  // YouTube URL patterns
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^[a-zA-Z0-9_-]{11}$/ // Just the video ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      const videoId = match[1] || match[0];
      return { valid: true, videoId };
    }
  }

  return { valid: false };
}

/**
 * Extract video ID from YouTube URL
 */
export function extractVideoId(url: string): string | null {
  const result = validateYouTubeUrl(url);
  return result.valid ? result.videoId! : null;
}

/**
 * Fetch video metadata from YouTube API
 */
export async function getVideoMetadata(videoId: string): Promise<YouTubeVideo | null> {
  if (!YOUTUBE_API_KEY) {
    throw new Error('YouTube API key not configured');
  }

  try {
    const url = `${YOUTUBE_API_BASE}/videos?part=snippet,statistics&id=${videoId}&key=${YOUTUBE_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json() as any;

    if (!data.items || data.items.length === 0) {
      return null;
    }

    const video = data.items[0];
    return {
      id: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      thumbnailUrl: video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.default?.url,
      channelTitle: video.snippet.channelTitle,
      publishedAt: video.snippet.publishedAt,
      viewCount: video.statistics?.viewCount,
      likeCount: video.statistics?.likeCount,
      commentCount: video.statistics?.commentCount
    };
  } catch (error) {
    console.error('Error fetching video metadata:', error);
    throw new Error('Failed to fetch video metadata from YouTube');
  }
}

/**
 * Check if a YouTube video is still available
 * Returns true if available, false if not found/unavailable
 */
export async function checkVideoAvailability(videoId: string): Promise<boolean> {
  if (!YOUTUBE_API_KEY) {
    console.warn('YouTube API key not configured - assuming video is available');
    return true;
  }

  try {
    const url = `${YOUTUBE_API_BASE}/videos?part=status&id=${videoId}&key=${YOUTUBE_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json() as any;

    // Video not found or no items returned
    if (!data.items || data.items.length === 0) {
      return false;
    }

    const video = data.items[0];
    
    // Check if video is embeddable and public
    const status = video.status;
    const isAvailable = 
      status.uploadStatus === 'processed' && 
      (status.privacyStatus === 'public' || status.privacyStatus === 'unlisted');

    return isAvailable;
  } catch (error) {
    console.error(`Error checking availability for video ${videoId}:`, error);
    // On error, assume available to avoid false positives
    return true;
  }
}

/**
 * Search YouTube videos
 * Automatically adds pet-related context to searches
 */
export async function searchYouTubeVideos(
  query: string,
  maxResults: number = 10,
  pageToken?: string
): Promise<YouTubeSearchResult> {
  if (!YOUTUBE_API_KEY) {
    throw new Error('YouTube API key not configured');
  }

  try {
    // Add pet/animal context to the search query
    const petQuery = `${query} pet OR animal OR dog OR cat`;
    let url = `${YOUTUBE_API_BASE}/search?part=snippet&type=video&q=${encodeURIComponent(petQuery)}&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`;
    
    if (pageToken) {
      url += `&pageToken=${pageToken}`;
    }

    const response = await fetch(url);
    const data = await response.json() as any;

    if (!data.items) {
      return { videos: [], totalResults: 0 };
    }

    const videos: YouTubeVideo[] = data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt
    }));

    return {
      videos,
      nextPageToken: data.nextPageToken,
      totalResults: data.pageInfo.totalResults
    };
  } catch (error) {
    console.error('Error searching YouTube:', error);
    throw new Error('Failed to search YouTube videos');
  }
}

/**
 * Validate that a YouTube video exists and is accessible
 */
export async function validateVideoExists(videoId: string): Promise<boolean> {
  try {
    const metadata = await getVideoMetadata(videoId);
    return metadata !== null;
  } catch (error) {
    return false;
  }
}

