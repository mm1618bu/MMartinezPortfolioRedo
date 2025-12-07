// src/front-end/components/RecomendationBar.jsx
import { useQuery } from '@tanstack/react-query';
import { getAllVideosFromSupabase, getVideoFromSupabase } from "../utils/supabase";
import "../../styles/main.css";

/**
 * Props:
 *  - videoId (string, required): the currently watched video's ID
 *  - limit? (number, optional): how many recommendations to fetch (default 8)
 */
export default function RecomendationBar({ videoId, limit = 8 }) {
  // Fetch recommendations with caching
  const { data: recommendations = [], isLoading: loading, error: errorMsg } = useQuery({
    queryKey: ['recommendations', videoId, limit],
    queryFn: async () => {
      // Get current video to find its keywords
      const currentVideo = await getVideoFromSupabase(videoId);
      
      // Get all videos
      const allVideos = await getAllVideosFromSupabase();
      
      // Filter out the current video and find videos with matching keywords
      let filtered = allVideos.filter(v => v.id !== videoId);
      
      if (currentVideo?.keywords && currentVideo.keywords.length > 0) {
        // Sort by number of matching keywords
        filtered = filtered.map(video => {
          const matchingKeywords = video.keywords?.filter(k => 
            currentVideo.keywords.includes(k)
          ).length || 0;
          return { ...video, matchScore: matchingKeywords };
        }).sort((a, b) => b.matchScore - a.matchScore);
      }
      
      // Limit results
      return filtered.slice(0, limit);
    },
    enabled: !!videoId,
  });

  if (!videoId) {
    return null;
  }

  return (
    <div className="VideoRecommendations">
      <h3 className="VideoRecommendations-title">Recommended videos</h3>

      {loading && <p>Loading recommendations...</p>}

      {errorMsg && <p className="Error-Text">{errorMsg.message}</p>}

      {!loading && !errorMsg && recommendations.length === 0 && (
        <p className="VideoRecommendations-empty">
          No recommendations available.
        </p>
      )}

      {!loading && !errorMsg && recommendations.length > 0 && (
        <div className="VideoRecommendations-list">
          {recommendations.map((video) => (
            <a
              key={video.id}
              href={`/watch/${video.id}`}
              className="VideoRecommendations-item"
            >
              <div className="VideoRecommendations-thumbWrapper">
                {video.thumbnail_url ? (
                  <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    className="VideoRecommendations-thumb"
                  />
                ) : (
                  <div className="VideoRecommendations-thumb VideoRecommendations-thumb--placeholder" />
                )}
              </div>

              <div className="VideoRecommendations-info">
                <p className="VideoRecommendations-videoTitle">
                  {video.title}
                </p>

                {video.keywords && video.keywords.length > 0 && (
                  <p className="VideoRecommendations-tags">
                    {video.keywords.slice(0, 3).join(" • ")}
                  </p>
                )}
                
                {video.channel_name && (
                  <p className="VideoRecommendations-channel">
                    {video.channel_name}
                  </p>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
