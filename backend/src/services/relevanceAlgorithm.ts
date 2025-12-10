// Search Result Relevance Algorithm
// Implements configurable relevance scoring based on PRD requirements

import { supabase } from '../config/supabase.js';

export interface RelevanceWeights {
  keywordMatch: number;    // Weight for keyword match in title/description
  viewCount: number;        // Weight for view count
  likeRatio: number;        // Weight for like ratio (likes/views)
  recency: number;         // Weight for recency (newer = better)
  engagement: number;      // Weight for engagement (likes + comments + shares)
}

export interface VideoWithRelevance {
  id: string;
  youtube_video_id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  created_at: string;
  view_count: number;
  relevanceScore: number;
  keywordMatchScore: number;
  viewCountScore: number;
  likeRatioScore: number;
  recencyScore: number;
  engagementScore: number;
  user: any;
  likes_count: number;
  comments_count: number;
  engagement: number;
  is_available: boolean;
}

// Default weights (can be configured via admin interface)
const DEFAULT_WEIGHTS: RelevanceWeights = {
  keywordMatch: 0.4,  // 40% - Most important for search relevance
  viewCount: 0.15,    // 15% - Popularity indicator
  likeRatio: 0.15,   // 15% - Quality indicator
  recency: 0.15,      // 15% - Freshness
  engagement: 0.15,   // 15% - User interaction
};

/**
 * Calculate relevance score for a video based on search query and weights
 */
export async function calculateRelevanceScore(
  video: any,
  searchQuery: string,
  weights: RelevanceWeights = DEFAULT_WEIGHTS
): Promise<VideoWithRelevance> {
  const queryLower = searchQuery.toLowerCase();
  const titleLower = (video.title || '').toLowerCase();
  const descLower = (video.description || '').toLowerCase();

  // 1. Keyword Match Score (0-1)
  let keywordMatchScore = 0;
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0);
  
  if (queryWords.length > 0) {
    let titleMatches = 0;
    let descMatches = 0;
    
    queryWords.forEach(word => {
      if (titleLower.includes(word)) titleMatches++;
      if (descLower.includes(word)) descMatches++;
    });
    
    // Title matches are worth more than description matches
    const titleScore = (titleMatches / queryWords.length) * 0.7;
    const descScore = (descMatches / queryWords.length) * 0.3;
    keywordMatchScore = Math.min(1, titleScore + descScore);
    
    // Bonus for exact phrase match
    if (titleLower.includes(queryLower)) {
      keywordMatchScore = Math.min(1, keywordMatchScore + 0.2);
    }
  } else {
    // No query - all videos get same keyword score
    keywordMatchScore = 0.5;
  }

  // 2. View Count Score (0-1) - Normalized using log scale
  const viewCount = video.view_count || 0;
  const viewCountScore = viewCount > 0 
    ? Math.min(1, Math.log10(viewCount + 1) / 6) // Log scale: 1M views = ~1.0
    : 0;

  // 3. Like Ratio Score (0-1) - Likes per view
  const likesCount = video.likes_count || 0;
  const likeRatio = viewCount > 0 ? likesCount / viewCount : 0;
  const likeRatioScore = Math.min(1, likeRatio * 100); // 1% like ratio = 1.0 score

  // 4. Recency Score (0-1) - Newer videos score higher
  const videoAge = Date.now() - new Date(video.created_at).getTime();
  const daysOld = videoAge / (1000 * 60 * 60 * 24);
  // Videos less than 7 days old get full score, then decay
  const recencyScore = daysOld < 7 
    ? 1 
    : Math.max(0, 1 - (daysOld - 7) / 30); // Decay over 30 days

  // 5. Engagement Score (0-1) - Normalized engagement
  const engagement = video.engagement || 0;
  // Normalize: 100 engagement = 1.0 score (using log scale)
  const engagementScore = engagement > 0
    ? Math.min(1, Math.log10(engagement + 1) / 3)
    : 0;

  // Calculate weighted relevance score
  const relevanceScore = 
    (keywordMatchScore * weights.keywordMatch) +
    (viewCountScore * weights.viewCount) +
    (likeRatioScore * weights.likeRatio) +
    (recencyScore * weights.recency) +
    (engagementScore * weights.engagement);

  return {
    ...video,
    relevanceScore,
    keywordMatchScore,
    viewCountScore,
    likeRatioScore,
    recencyScore,
    engagementScore,
  };
}

/**
 * Get relevance weights from database (or use defaults)
 */
export async function getRelevanceWeights(): Promise<RelevanceWeights> {
  try {
    const { data, error } = await supabase
      .from('relevance_weights')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return DEFAULT_WEIGHTS;
    }

    return {
      keywordMatch: data.keyword_match || DEFAULT_WEIGHTS.keywordMatch,
      viewCount: data.view_count || DEFAULT_WEIGHTS.viewCount,
      likeRatio: data.like_ratio || DEFAULT_WEIGHTS.likeRatio,
      recency: data.recency || DEFAULT_WEIGHTS.recency,
      engagement: data.engagement || DEFAULT_WEIGHTS.engagement,
    };
  } catch (error) {
    console.error('Failed to fetch relevance weights:', error);
    return DEFAULT_WEIGHTS;
  }
}

/**
 * Update relevance weights (admin only)
 */
export async function updateRelevanceWeights(
  weights: RelevanceWeights
): Promise<void> {
  try {
    // Ensure weights sum to 1.0
    const total = Object.values(weights).reduce((sum, w) => sum + (w || 0), 0);
    if (Math.abs(total - 1.0) > 0.01) {
      throw new Error('Weights must sum to 1.0');
    }

    const { error } = await supabase
      .from('relevance_weights')
      .insert({
        keyword_match: weights.keywordMatch,
        view_count: weights.viewCount,
        like_ratio: weights.likeRatio,
        recency: weights.recency,
        engagement: weights.engagement,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Failed to update relevance weights:', error);
    throw error;
  }
}

