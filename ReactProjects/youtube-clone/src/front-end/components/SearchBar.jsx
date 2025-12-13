/**
 * SearchBar Component
 * Advanced search bar with autocomplete, suggestions, and history
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getSearchSuggestions, 
  getTrendingSearches,
  getUserSearchHistory,
  deleteSearchFromHistory,
  debouncedSearch 
} from '../utils/searchAPI';
import { supabase } from '../utils/supabase';
import './SearchBar.css';

export default function SearchBar({ onSearch, autoFocus = false }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [trending, setTrending] = useState([]);
  const [history, setHistory] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const searchRef = useRef(null);
  const suggestionsRef = useRef(null);
  const navigate = useNavigate();

  // DEBUG: Add sample data for testing
  useEffect(() => {
    console.log('🔍 SearchBar: Component mounted and rendering!');
    console.log('🔍 SearchBar: DOM elements:', {
      searchRef: searchRef.current,
      suggestionsRef: suggestionsRef.current
    });
  }, []);

  // DEBUG: Watch suggestions changes
  useEffect(() => {
    console.log('🔍 SearchBar: Suggestions changed!', {
      count: suggestions.length,
      showSuggestions,
      suggestions: suggestions.slice(0, 3)
    });
    // If we have suggestions and query length >= 2, show them
    if (suggestions.length > 0 && query.length >= 2) {
      console.log('🔍 SearchBar: Auto-showing suggestions because we have data');
      setShowSuggestions(true);
    }
  }, [suggestions, query]);

  // DEBUG: Log render
  console.log('🔍 SearchBar RENDER:', { 
    query, 
    showSuggestions, 
    suggestionsCount: suggestions.length,
    trendingCount: trending.length 
  });

  // Get current user
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      console.log('SearchBar: Current user:', user?.email || 'Not logged in');
    };
    fetchUser();
  }, []);

  // Load trending searches on mount
  useEffect(() => {
    const loadTrending = async () => {
      console.log('SearchBar: Loading trending searches...');
      const data = await getTrendingSearches(24, 5);
      console.log('SearchBar: Trending searches:', data);
      setTrending(data);
    };
    loadTrending();
  }, []);

  // Load user's search history
  useEffect(() => {
    const loadHistory = async () => {
      if (currentUser) {
        console.log('SearchBar: Loading search history...');
        const data = await getUserSearchHistory(currentUser.id, 5);
        console.log('SearchBar: Search history:', data);
        setHistory(data);
      }
    };
    loadHistory();
  }, [currentUser]);

  // Handle input change with debounced suggestions
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    console.log('🔍 SearchBar: Query changed to:', value, 'showSuggestions:', showSuggestions);

    if (value.length >= 2) {
      setLoading(true);
      console.log('🔍 SearchBar: Calling debouncedSearch...');
      debouncedSearch(value, async (q) => {
        console.log('🔍 SearchBar: Fetching suggestions for:', q);
        const data = await getSearchSuggestions(q, 8);
        console.log('🔍 SearchBar: Got suggestions:', data, 'length:', data?.length);
        setSuggestions(data);
        setShowSuggestions(true); // Make sure suggestions show when we get data
        setLoading(false);
      }, 300);
    } else {
      console.log('🔍 SearchBar: Query too short, clearing suggestions');
      setSuggestions([]);
      setLoading(false);
    }
  };

  // Handle search submission
  const handleSearch = (searchQuery = query) => {
    if (!searchQuery.trim()) return;

    setShowSuggestions(false);
    setQuery(searchQuery);

    if (onSearch) {
      onSearch(searchQuery);
    } else {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestion(prev => 
        prev < (suggestions.length - 1) ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestion(prev => prev > -1 ? prev - 1 : -1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeSuggestion >= 0 && suggestions[activeSuggestion]) {
        handleSearch(suggestions[activeSuggestion].suggestion);
      } else {
        handleSearch();
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveSuggestion(-1);
    }
  };

  // Handle focus
  const handleFocus = () => {
    console.log('🔍 SearchBar: Input focused!', {
      timestamp: Date.now(),
      currentShowSuggestions: showSuggestions,
      hasSuggestions: suggestions.length > 0,
      hasTrending: trending.length > 0,
      hasHistory: history.length > 0
    });
    setShowSuggestions(true);
    console.log('🔍 SearchBar: setShowSuggestions(true) called');
  };

  // Handle click outside - using ref to avoid stale closure
  useEffect(() => {
    const handleClickOutside = (event) => {
      console.log('🔍 SearchBar: Click detected', {
        target: event.target?.className,
        isInsideSearch: searchRef.current?.contains(event.target),
        isInsideSuggestions: suggestionsRef.current?.contains(event.target)
      });

      if (
        searchRef.current && 
        !searchRef.current.contains(event.target) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        console.log('🔍 SearchBar: Outside click - hiding suggestions');
        setShowSuggestions(false);
        setActiveSuggestion(-1);
      }
    };

    // Use 'click' instead of 'mousedown' to avoid race condition with focus
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []); // Empty deps is OK - we use refs to access current DOM state

  // Handle delete from history
  const handleDeleteHistory = async (e, searchId) => {
    e.stopPropagation();
    await deleteSearchFromHistory(searchId);
    setHistory(prev => prev.filter(h => h.id !== searchId));
  };

  // Clear search input
  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setActiveSuggestion(-1);
    searchRef.current?.focus();
  };

  // DEBUG: Expose function to test state updates
  useEffect(() => {
    window.testShowSuggestions = () => {
      console.log('TEST: Manual trigger - Before:', showSuggestions);
      setShowSuggestions(true);
      console.log('TEST: Manual trigger - After setState call');
    };
    console.log('🔍 SearchBar: RENDER', {
      showSuggestions,
      suggestionsCount: suggestions.length,
      timestamp: Date.now()
    });
  });

  return (
    <div className="search-bar-container">
      <div className="search-bar" ref={searchRef}>
        <div className="search-input-wrapper">
          <svg 
            className="search-icon" 
            viewBox="0 0 24 24" 
            width="20" 
            height="20"
          >
            <path 
              fill="currentColor" 
              d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
            />
          </svg>

          <input
            type="text"
            className="search-input"
            placeholder="Search videos..."
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            autoFocus={autoFocus}
          />

          {query && (
            <button 
              className="search-clear-btn"
              onClick={handleClear}
              aria-label="Clear search"
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path 
                  fill="currentColor" 
                  d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                />
              </svg>
            </button>
          )}
        </div>

        <button 
          className="search-submit-btn"
          onClick={() => handleSearch()}
          aria-label="Search"
        >
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path 
              fill="currentColor" 
              d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
            />
          </svg>
        </button>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div className="search-suggestions" ref={suggestionsRef}>
          {/* Loading state */}
          {loading && (
            <div className="suggestion-section">
              <div className="suggestion-item loading">
                <span>Loading suggestions...</span>
              </div>
            </div>
          )}

          {/* Search History */}
          {!query && history.length > 0 && (
            <div className="suggestion-section">
              <div className="suggestion-header">
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path 
                    fill="currentColor" 
                    d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"
                  />
                </svg>
                <span>Recent searches</span>
              </div>
              {history.map((item, index) => (
                <div
                  key={item.id}
                  className={`suggestion-item ${activeSuggestion === index ? 'active' : ''}`}
                  onClick={() => handleSearch(item.query)}
                >
                  <svg className="history-icon" viewBox="0 0 24 24" width="18" height="18">
                    <path 
                      fill="currentColor" 
                      d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"
                    />
                  </svg>
                  <span className="suggestion-text">{item.query}</span>
                  <button
                    className="delete-history-btn"
                    onClick={(e) => handleDeleteHistory(e, item.id)}
                    aria-label="Remove from history"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16">
                      <path 
                        fill="currentColor" 
                        d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Suggestions from query */}
          {query && suggestions.length > 0 && !loading && (
            <div className="suggestion-section">
              {suggestions.map((item, index) => (
                <div
                  key={index}
                  className={`suggestion-item ${activeSuggestion === index ? 'active' : ''}`}
                  onClick={() => handleSearch(item.suggestion)}
                >
                  <svg className="search-icon-small" viewBox="0 0 24 24" width="18" height="18">
                    <path 
                      fill="currentColor" 
                      d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
                    />
                  </svg>
                  <span className="suggestion-text">{item.suggestion}</span>
                  {item.source && (
                    <span className="suggestion-source">{item.source}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* No results */}
          {query && suggestions.length === 0 && !loading && (
            <div className="suggestion-section">
              <div className="suggestion-item no-results">
                <span>No suggestions found</span>
              </div>
            </div>
          )}

          {/* Trending searches */}
          {!query && trending.length > 0 && (
            <div className="suggestion-section">
              <div className="suggestion-header">
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path 
                    fill="currentColor" 
                    d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"
                  />
                </svg>
                <span>Trending</span>
              </div>
              {trending.map((item, index) => (
                <div
                  key={index}
                  className="suggestion-item trending"
                  onClick={() => handleSearch(item.query)}
                >
                  <svg className="trending-icon" viewBox="0 0 24 24" width="18" height="18">
                    <path 
                      fill="currentColor" 
                      d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"
                    />
                  </svg>
                  <span className="suggestion-text">{item.query}</span>
                  <span className="search-count">{item.search_count} searches</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
