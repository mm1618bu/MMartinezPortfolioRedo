// src/front-end/components/RecomendationBar.jsx
import { useQuery } from '@tanstack/react-query';
import { getAllVideosFromSupabase, getVideoFromSupabase } from "../utils/supabase";
import { getSimilarVideos } from '../utils/recommendationModel';
import "../../styles/main.css";

/**
 * Props:
 *  - videoId (string, required): the currently watched video's ID
 *  - limit? (number, optional): how many recommendations to fetch (default 8)
 */
export default function RecomendationBar({ videoId, limit = 8 }) {
  // Fetch all videos with shared cache
  const { data: allVideos = [] } = useQuery({
    queryKey: ['allVideos'], // Use shared cache
    queryFn: async () => {
      const videos = await getAllVideosFromSupabase();
      return videos;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    cacheTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
  });

  // Fetch current video with caching
  const { data: currentVideo } = useQuery({
    queryKey: ['video', videoId],
    queryFn: () => getVideoFromSupabase(videoId),
    enabled: !!videoId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Compute recommendations using recommendation model
  const { data: recommendations = [], isLoading: loading, error: errorMsg } = useQuery({
    queryKey: ['recommendations', videoId, limit],
    queryFn: async () => {
      // Use recommendation model for personalized suggestions
      const recommended = getSimilarVideos(allVideos, currentVideo, limit);
      
      return recommended;
    },
    enabled: !!videoId && allVideos.length > 0 && !!currentVideo,
    staleTime: 1000 * 60 * 5, // 5 minutes
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
