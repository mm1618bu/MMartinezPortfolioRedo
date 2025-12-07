import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase";
import { debounce } from "../utils/rateLimiting";
import "../../styles/main.css";

export default function VideoSearchBar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**************************************************
   * SEARCH VIDEOS
   **************************************************/
  const searchVideos = async (value) => {
    if (!value.trim()) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const searchTerm = value.toLowerCase();
      
      // Search in title field (case-insensitive)
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .ilike("title", `%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Search error:", error);
        setError("Search failed. Please try again.");
        setResults([]);
      } else {
        setResults(data || []);
      }
    } catch (err) {
      console.error("Search failed:", err);
      setError("An error occurred while searching.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search - waits 500ms after user stops typing
  const debouncedSearch = useCallback(
    debounce((value) => {
      searchVideos(value);
    }, 500), // 500ms delay
    []
  );

  /**************************************************
   * HANDLE INPUT
   **************************************************/
  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setShowResults(true);
    
    // Show loading immediately for user feedback
    if (value.trim()) {
      setLoading(true);
    }
    
    // Debounce the actual search
    debouncedSearch(value);
  };

  const handleBlur = () => {
    // Delay hiding results to allow click event to register
    setTimeout(() => {
      setShowResults(false);
    }, 200);
  };

  const handleResultClick = (videoId) => {
    setShowResults(false);
    setQuery("");
    navigate(`/watch/${videoId}`);
  };

  return (
    <div className="VideoSearchBar">
      <input
        type="text"
        value={query}
        placeholder="Search videos..."
        className="VideoSearchBar-input"
        onChange={handleChange}
        onFocus={() => setShowResults(true)}
        onBlur={handleBlur}
      />

      {showResults && query.trim() && (
        <div className="VideoSearchBar-results">
          {loading && <div className="VideoSearchBar-loading">Searching...</div>}

          {error && !loading && (
            <div className="VideoSearchBar-error">
              {error}
            </div>
          )}

          {!loading && !error && results.length === 0 && (
            <div className="VideoSearchBar-noResults">
              No videos found for "{query}"
            </div>
          )}

          {!loading && !error && results.length > 0 && results.map((video) => (
            <div
              key={video.id}
              className="VideoSearchBar-resultItem"
              onClick={() => handleResultClick(video.id)}
              onMouseDown={(e) => e.preventDefault()} // Prevent blur before click
            >
              <div className="VideoSearchBar-thumbnailWrapper">
                <img
                  src={video.thumbnail_url}
                  alt={video.title}
                  className="VideoSearchBar-thumbnail"
                />
              </div>
              <div className="VideoSearchBar-info">
                <div className="VideoSearchBar-title">
                  {video.title}
                </div>
                {video.keywords && video.keywords.length > 0 && (
                  <div className="VideoSearchBar-tags">
                    {video.keywords.slice(0, 3).join(" • ")}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
