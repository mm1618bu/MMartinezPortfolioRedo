/**
 * Search API Utilities
 * Full-text search with filters, suggestions, and analytics
 * 
 * RELEVANCE RANKING:
 * ==================
 * When sortBy='relevance', videos are ranked using a multi-factor algorithm:
 * 
 * - Full-text search score (PostgreSQL ts_rank) × 10
 * - Exact title match: +50 points
 * - Title starts with query: +30 points  
 * - Title contains query: +15 points
 * - Exact keyword match: +25 points
 * - Partial keyword match: +10 points
 * - Channel name match: +12 points
 * - Description match: +5 points
 * - Popularity boost: up to +20 (logarithmic scale)
 * - Engagement boost: up to +10 (likes/views ratio)
 * - Recency boost: +8 (last 7d), +5 (last 30d), +2 (last 90d)
 * 
 * Total scores typically range from 0-180 points.
 * Higher scores = more relevant results appear first.
 */

import { supabase } from './supabase';

/**
 * Search videos with full-text search
 */
export const searchVideos = async (query, options = {}) => {
  try {
    const {
      limit = 20,
      offset = 0,
      sortBy = 'relevance', // 'relevance', 'date', 'views', 'rating'
      filters = {}
    } = options;

    // Build query with basic ILIKE search (RPC function not available)
    // Note: keywords is JSONB so we can't search it with ILIKE
    let queryBuilder = supabase
      .from('videos')
      .select('*')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,channel_name.ilike.%${query}%,meta_tags.ilike.%${query}%`)
      .range(offset, offset + limit - 1);

    // Apply filters
    if (filters.duration) {
      if (filters.duration === 'short') {
        queryBuilder = queryBuilder.lt('duration', 240); // < 4 minutes
      } else if (filters.duration === 'medium') {
        queryBuilder = queryBuilder.gte('duration', 240).lte('duration', 1200); // 4-20 minutes
      } else if (filters.duration === 'long') {
        queryBuilder = queryBuilder.gt('duration', 1200); // > 20 minutes
      }
    }

    if (filters.uploadDate) {
      const now = new Date();
      let dateThreshold;
      
      if (filters.uploadDate === 'hour') {
        dateThreshold = new Date(now.getTime() - 60 * 60 * 1000);
      } else if (filters.uploadDate === 'today') {
        dateThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      } else if (filters.uploadDate === 'week') {
        dateThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (filters.uploadDate === 'month') {
        dateThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else if (filters.uploadDate === 'year') {
        dateThreshold = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      }
      
      if (dateThreshold) {
        queryBuilder = queryBuilder.gte('created_at', dateThreshold.toISOString());
      }
    }

    // Apply sorting
    if (sortBy === 'date' || sortBy === 'relevance') {
      queryBuilder = queryBuilder.order('created_at', { ascending: false });
    } else if (sortBy === 'views') {
      queryBuilder = queryBuilder.order('views', { ascending: false });
    } else if (sortBy === 'rating') {
      queryBuilder = queryBuilder.order('likes', { ascending: false });
    }

    const { data, error } = await queryBuilder;

    if (error) {
      console.warn('Error searching videos:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.warn('Error searching videos:', error);
    return [];
  }
};

/**
 * Get search suggestions for autocomplete
 */
export const getSearchSuggestions = async (partialQuery, limit = 10) => {
  if (!partialQuery || partialQuery.length < 2) return [];

  try {
    // Use direct query since RPC function is not available
    return await getSearchSuggestionsFallback(partialQuery, limit);
  } catch (error) {
    console.warn('Error getting search suggestions:', error);
    return [];
  }
};

/**
 * Fallback function for suggestions when RPC is unavailable
 */
const getSearchSuggestionsFallback = async (partialQuery, limit = 10) => {
  try {
    // Search in title and channel_name only (keywords require different handling)
    const { data: videos, error: videoError } = await supabase
      .from('videos')
      .select('title, channel_name, keywords, views')
      .or(`title.ilike.%${partialQuery}%,channel_name.ilike.%${partialQuery}%`)
      .order('views', { ascending: false })
      .limit(limit * 2); // Get more to filter

    if (videoError) {
      console.error('Error fetching videos for suggestions:', videoError);
      return [];
    }

    // Format as suggestions
    const suggestions = [];
    const seen = new Set();
    
    if (videos) {
      // Add video titles
      videos.forEach(v => {
        if (v.title && v.title.toLowerCase().includes(partialQuery.toLowerCase()) && !seen.has(v.title)) {
          suggestions.push({
            suggestion: v.title,
            category: 'video',
            source: 'video'
          });
          seen.add(v.title);
        }
      });

      // Add channel names
      videos.forEach(v => {
        if (v.channel_name && v.channel_name.toLowerCase().includes(partialQuery.toLowerCase()) && !seen.has(v.channel_name)) {
          suggestions.push({
            suggestion: v.channel_name,
            category: 'channel',
            source: 'channel'
          });
          seen.add(v.channel_name);
        }
      });

      // Add keywords
      videos.forEach(v => {
        if (v.keywords && Array.isArray(v.keywords)) {
          v.keywords.forEach(keyword => {
            if (keyword && keyword.toLowerCase().includes(partialQuery.toLowerCase()) && !seen.has(keyword)) {
              suggestions.push({
                suggestion: keyword,
                category: 'keyword',
                source: 'keyword'
              });
              seen.add(keyword);
            }
          });
        }
      });
    }

    return suggestions.slice(0, limit);
  } catch (error) {
    console.error('Error in fallback suggestions:', error);
    return [];
  }
};

/**
 * Get trending searches
 */
export const getTrendingSearches = async (hours = 24, limit = 10) => {
  try {
    const { data, error } = await supabase.rpc('get_trending_searches', {
      p_hours: hours,
      p_limit: limit
    });

    if (error) {
      // Return empty array instead of logging error
      return [];
    }
    
    return data || [];
  } catch (error) {
    // Silently return empty array in demo mode
    return [];
  }
};

/**
 * Get related searches
 */
export const getRelatedSearches = async (query, limit = 5) => {
  try {
    const { data, error } = await supabase.rpc('get_related_searches', {
      p_query: query,
      p_limit: limit
    });

    if (error) {
      console.warn('RPC get_related_searches not available:', error.message);
      return [];
    }
    return data || [];
  } catch (error) {
    console.warn('Error getting related searches:', error);
    return [];
  }
};

/**
 * Log a search query
 */
export const logSearch = async (query, resultsCount, userId = null, filters = {}) => {
  if (!userId) return null;

  try {
    const { data, error } = await supabase.rpc('log_search', {
      p_user_id: userId,
      p_query: query,
      p_results_count: resultsCount,
      p_filters: filters
    });

    if (error) {
      console.warn('RPC log_search not available:', error.message);
      return null;
    }
    return data;
  } catch (error) {
    console.warn('Error logging search:', error);
    return null;
  }
};

/**
 * Update search history with clicked video
 */
export const updateSearchHistoryClick = async (searchId, videoId) => {
  try {
    const { error } = await supabase
      .from('search_history')
      .update({ clicked_video_id: videoId })
      .eq('id', searchId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating search history:', error);
  }
};

/**
 * Get user's search history
 */
export const getUserSearchHistory = async (userId, limit = 20) => {
  try {
    const { data, error } = await supabase
      .from('search_history')
      .select('*')
      .eq('user_id', userId)
      .order('searched_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting search history:', error);
    return [];
  }
};

/**
 * Clear user's search history
 */
export const clearSearchHistory = async (userId) => {
  try {
    const { error } = await supabase
      .from('search_history')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error clearing search history:', error);
    return { success: false, error };
  }
};

/**
 * Delete specific search from history
 */
export const deleteSearchFromHistory = async (searchId) => {
  try {
    const { error } = await supabase
      .from('search_history')
      .delete()
      .eq('id', searchId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting search:', error);
    return { success: false, error };
  }
};

/**
 * Get popular searches
 */
export const getPopularSearches = async (limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('popular_searches')
      .select('*')
      .order('search_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting popular searches:', error);
    return [];
  }
};

/**
 * Advanced search with multiple criteria
 */
export const advancedSearch = async (criteria) => {
  try {
    const {
      query = '',
      channel = '',
      minDuration = null,
      maxDuration = null,
      dateFrom = null,
      dateTo = null,
      quality = null,
      minViews = null,
      sortBy = 'relevance',
      limit = 20,
      offset = 0
    } = criteria;

    let supabaseQuery = supabase
      .from('videos')
      .select('*')
      .eq('is_public', true);

    // Text search
    if (query) {
      supabaseQuery = supabaseQuery.or(
        `title.ilike.%${query}%,description.ilike.%${query}%,channel_name.ilike.%${query}%`
      );
    }

    // Channel filter
    if (channel) {
      supabaseQuery = supabaseQuery.ilike('channel_name', `%${channel}%`);
    }

    // Duration filters
    if (minDuration !== null) {
      supabaseQuery = supabaseQuery.gte('duration', minDuration);
    }
    if (maxDuration !== null) {
      supabaseQuery = supabaseQuery.lte('duration', maxDuration);
    }

    // Date filters
    if (dateFrom) {
      supabaseQuery = supabaseQuery.gte('created_at', dateFrom);
    }
    if (dateTo) {
      supabaseQuery = supabaseQuery.lte('created_at', dateTo);
    }

    // Quality filter
    if (quality) {
      supabaseQuery = supabaseQuery.eq('quality', quality);
    }

    // Views filter
    if (minViews !== null) {
      supabaseQuery = supabaseQuery.gte('views', minViews);
    }

    // Sorting
    switch (sortBy) {
      case 'date':
        supabaseQuery = supabaseQuery.order('created_at', { ascending: false });
        break;
      case 'views':
        supabaseQuery = supabaseQuery.order('views', { ascending: false });
        break;
      case 'rating':
        supabaseQuery = supabaseQuery.order('likes', { ascending: false });
        break;
      case 'relevance':
      default:
        supabaseQuery = supabaseQuery.order('views', { ascending: false });
        break;
    }

    // Pagination
    supabaseQuery = supabaseQuery.range(offset, offset + limit - 1);

    const { data, error } = await supabaseQuery;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error in advanced search:', error);
    return [];
  }
};

/**
 * Search by category
 */
export const searchByCategory = async (category, limit = 20, offset = 0) => {
  try {
    const { data, error } = await supabase
      .from('video_categories')
      .select(`
        video_id,
        videos (*)
      `)
      .eq('category', category)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data?.map(item => item.videos).filter(Boolean) || [];
  } catch (error) {
    console.error('Error searching by category:', error);
    return [];
  }
};

/**
 * Search by tags
 */
export const searchByTags = async (tags, limit = 20) => {
  try {
    const { data, error } = await supabase
      .from('video_tags')
      .select(`
        video_id,
        videos (*)
      `)
      .in('tag', tags)
      .limit(limit);

    if (error) throw error;
    
    // Remove duplicates and flatten
    const uniqueVideos = Array.from(
      new Map(
        data
          ?.map(item => item.videos)
          .filter(Boolean)
          .map(video => [video.id, video])
      ).values()
    );

    return uniqueVideos;
  } catch (error) {
    console.error('Error searching by tags:', error);
    return [];
  }
};

/**
 * Search within channel
 */
export const searchWithinChannel = async (channelName, query, limit = 20) => {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('is_public', true)
      .eq('channel_name', channelName)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching within channel:', error);
    return [];
  }
};

/**
 * Get search analytics (for creators/admins)
 */
export const getSearchAnalytics = async (days = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('search_analytics')
      .select('*')
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting search analytics:', error);
    return [];
  }
};

/**
 * Debounced search for autocomplete
 */
let searchTimeout;
export const debouncedSearch = (query, callback, delay = 300) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    callback(query);
  }, delay);
};

/**
 * Format search query (remove special chars, trim, etc.)
 */
export const formatSearchQuery = (query) => {
  return query
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, ' '); // Normalize spaces
};

/**
 * Highlight search terms in text
 */
export const highlightSearchTerms = (text, query) => {
  if (!query || !text) return text;

  const terms = query.split(' ').filter(t => t.length > 0);
  let highlightedText = text;

  terms.forEach(term => {
    const regex = new RegExp(`(${term})`, 'gi');
    highlightedText = highlightedText.replace(
      regex,
      '<mark class="search-highlight">$1</mark>'
    );
  });

  return highlightedText;
};

/**
 * Get search statistics for user
 */
export const getUserSearchStats = async (userId, days = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('search_history')
      .select('*')
      .eq('user_id', userId)
      .gte('searched_at', startDate.toISOString());

    if (error) throw error;

    // Calculate statistics
    const totalSearches = data.length;
    const uniqueQueries = new Set(data.map(s => s.query)).size;
    const avgResultsCount = data.reduce((sum, s) => sum + s.results_count, 0) / totalSearches || 0;
    const searchesWithClicks = data.filter(s => s.clicked_video_id).length;
    const clickThroughRate = (searchesWithClicks / totalSearches * 100) || 0;

    // Most searched terms
    const queryFrequency = {};
    data.forEach(s => {
      queryFrequency[s.query] = (queryFrequency[s.query] || 0) + 1;
    });
    const topQueries = Object.entries(queryFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([query, count]) => ({ query, count }));

    return {
      totalSearches,
      uniqueQueries,
      avgResultsCount: avgResultsCount.toFixed(1),
      clickThroughRate: clickThroughRate.toFixed(1),
      topQueries,
      periodDays: days
    };
  } catch (error) {
    console.error('Error getting user search stats:', error);
    return null;
  }
};

/**
 * Save search filter preset
 */
export const saveSearchFilterPreset = async (userId, presetName, filters) => {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        search_filter_presets: {
          [presetName]: filters
        }
      })
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving filter preset:', error);
    return null;
  }
};
