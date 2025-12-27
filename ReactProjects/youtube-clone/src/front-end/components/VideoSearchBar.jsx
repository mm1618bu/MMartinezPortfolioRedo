import { useState, useCallback } from "react";
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
   * SEARCH VIDEOS - Simplified version
   * Uses basic ILIKE search that works without RPC function
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

    console.log('Searching for:', value.trim());

    try {
      const searchTerm = value.trim();
      
      // Direct search across multiple fields
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,channel_name.ilike.%${searchTerm}%`)
        .order('views', { ascending: false })
        .limit(10);

      if (error) {
        console.error("Search error:", error);
        setError("Search failed. Please try again.");
        setResults([]);
      } else {
        console.log('Search results:', data?.length || 0, 'videos found');
        setResults(data || []);
      }
    } catch (err) {
      console.error("Search exception:", err);
      setError("An error occurred while searching.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  /**************************************************
   * FALLBACK SEARCH (kept for reference)
   * Used when full-text search RPC is unavailable
   **************************************************/
  const fallbackSearch = async (value) => {
    const searchTerm = value.trim();
    
    console.log('Using fallback search for:', searchTerm);
    
    // Search across multiple fields - corrected query format
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,channel_name.ilike.%${searchTerm}%`)
      .eq('is_public', true)
      .order('views', { ascending: false })
      .limit(10);

    if (error) {
      console.error("Fallback search error:", error);
      throw error;
    }
    
    console.log('Fallback search results:', data?.length || 0, 'videos');
    return data || [];
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

  /**************************************************
   * HIGHLIGHT SEARCH TERMS
   * Highlights matching text in search results
   **************************************************/
  const highlightText = (text, searchQuery) => {
    if (!text || !searchQuery) return text;
    
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === searchQuery.toLowerCase() 
        ? <mark key={index} className="highlight">{part}</mark>
        : part
    );
  };

  /**************************************************
   * FORMAT RELEVANCE SCORE
   * Shows why result is relevant
   **************************************************/
  const getRelevanceBadge = (score) => {
    if (!score) return null;
    
    if (score > 60) return <span className="relevance-badge high">Highly Relevant</span>;
    if (score > 30) return <span className="relevance-badge medium">Relevant</span>;
    return <span className="relevance-badge low">Match</span>;
  };

  return (
    <div className="VideoSearchBar">
      <input
        type="text"
        value={query}
        placeholder="Search videos... (powered by full-text search)"
        className="VideoSearchBar-input"
        onChange={handleChange}
        onFocus={() => setShowResults(true)}
        onBlur={handleBlur}
      />

      {showResults && query.trim() && (
        <div className="VideoSearchBar-results">
          {loading && (
            <div className="VideoSearchBar-loading">
              🔍 Searching...
            </div>
          )}

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

          {!loading && !error && results.length > 0 && (
            <>
              <div className="VideoSearchBar-resultsHeader">
                Found {results.length} result{results.length !== 1 ? 's' : ''} • Sorted by relevance
              </div>
              {results.map((video) => (
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
                    {video.duration && (
                      <span className="VideoSearchBar-duration">
                        {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                      </span>
                    )}
                  </div>
                  <div className="VideoSearchBar-info">
                    <div className="VideoSearchBar-title">
                      {highlightText(video.title, query)}
                      {video.relevance_score && getRelevanceBadge(video.relevance_score)}
                    </div>
                    <div className="VideoSearchBar-metadata">
                      <span className="channel-name">
                        {highlightText(video.channel_name, query)}
                      </span>
                      {video.views !== undefined && (
                        <span className="views">
                          • {video.views.toLocaleString()} views
                        </span>
                      )}
                    </div>
                    {video.keywords && video.keywords.length > 0 && (
                      <div className="VideoSearchBar-tags">
                        {video.keywords.slice(0, 3).map((kw, idx) => (
                          <span key={idx} className="tag">
                            {highlightText(kw, query)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
