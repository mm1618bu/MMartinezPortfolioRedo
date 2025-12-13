import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  searchVideos,
  getRelatedSearches,
  logSearch,
  highlightSearchTerms
} from '../utils/searchAPI';
import VideoCard from './VideoCard';
import SearchFilters from './SearchFilters';
import './SearchResults.css';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const query = searchParams.get('q') || '';
  const sortBy = searchParams.get('sort') || 'relevance';
  const quality = searchParams.get('quality');
  const duration = searchParams.get('duration');
  const uploadDate = searchParams.get('date');
  const channel = searchParams.get('channel');
  
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [showFilters, setShowFilters] = useState(false);
  const resultsPerPage = 20;

  // Fetch search results
  const {
    data: searchData,
    isLoading: resultsLoading,
    error: resultsError
  } = useQuery({
    queryKey: ['search', query, sortBy, page, quality, duration, uploadDate, channel],
    queryFn: async () => {
      const filters = {};
      if (quality) filters.quality = quality;
      if (duration) filters.duration = duration;
      if (uploadDate) filters.uploadDate = uploadDate;
      if (channel) filters.channel = channel;

      const results = await searchVideos(query, {
        limit: resultsPerPage,
        offset: (page - 1) * resultsPerPage,
        sortBy,
        filters
      });

      // Log the search
      if (page === 1) {
        await logSearch(query, results.length);
      }

      return results;
    },
    enabled: !!query,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Fetch related searches
  const { data: relatedSearches } = useQuery({
    queryKey: ['relatedSearches', query],
    queryFn: () => getRelatedSearches(query, 5),
    enabled: !!query,
    staleTime: 10 * 60 * 1000 // 10 minutes
  });

  // Reset page when search query or filters change
  useEffect(() => {
    setPage(1);
  }, [query, sortBy, quality, duration, uploadDate, channel]);

  // Handle video click - track click in search history
  const handleVideoClick = async (videoId) => {
    navigate(`/watch/${videoId}`);
  };

  // Handle related search click
  const handleRelatedSearchClick = (relatedQuery) => {
    const params = new URLSearchParams();
    params.set('q', relatedQuery);
    if (sortBy !== 'relevance') params.set('sort', sortBy);
    navigate(`/search?${params.toString()}`);
  };

  // Handle pagination
  const handleNextPage = () => {
    setPage(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevPage = () => {
    setPage(prev => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle sort change
  const handleSortChange = (newSort) => {
    const params = new URLSearchParams(searchParams);
    params.set('sort', newSort);
    navigate(`/search?${params.toString()}`);
  };

  // Format result count
  const formatResultCount = (count) => {
    if (count === 0) return 'No results';
    if (count === 1) return '1 result';
    if (count < 1000) return `${count} results`;
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K results`;
    return `${(count / 1000000).toFixed(1)}M results`;
  };

  // Get active filters count
  const getActiveFiltersCount = () => {
    let count = 0;
    if (quality) count++;
    if (duration) count++;
    if (uploadDate) count++;
    if (channel) count++;
    return count;
  };

  // Clear all filters
  const clearAllFilters = () => {
    const params = new URLSearchParams();
    params.set('q', query);
    if (sortBy !== 'relevance') params.set('sort', sortBy);
    navigate(`/search?${params.toString()}`);
  };

  if (!query) {
    return (
      <div className="search-results-container">
        <div className="search-empty">
          <div className="search-empty-icon">🔍</div>
          <h2>Start searching</h2>
          <p>Enter a search term to find videos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="search-results-container">
      {/* Search header */}
      <div className="search-header">
        <div className="search-info">
          <h1 className="search-query">
            Results for: <span className="query-text">{query}</span>
          </h1>
          {searchData && (
            <p className="search-count">
              {formatResultCount(searchData.length)}
              {page > 1 && ` (Page ${page})`}
            </p>
          )}
        </div>

        <div className="search-controls">
          {/* Filters button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`filters-btn ${getActiveFiltersCount() > 0 ? 'has-filters' : ''}`}
            title="Filters"
          >
            <span className="filters-icon">⚙</span>
            <span className="filters-text">Filters</span>
            {getActiveFiltersCount() > 0 && (
              <span className="filters-count">{getActiveFiltersCount()}</span>
            )}
          </button>
          {/* Sort dropdown */}
          <div className="sort-control">
            <label htmlFor="sort-select">Sort by:</label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="sort-select"
            >
              <option value="relevance">Relevance</option>
              <option value="upload_date">Upload date</option>
              <option value="view_count">View count</option>
              <option value="rating">Rating</option>
            </select>
          </div>

          {/* View mode toggle */}
          <div className="view-mode-toggle">
            <button
              className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              ⊞
            </button>
            <button
              className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* Filters sidebar */}
      {showFilters && (
        <div className="filters-overlay" onClick={() => setShowFilters(false)}>
          <div className="filters-sidebar" onClick={(e) => e.stopPropagation()}>
            <SearchFilters onClose={() => setShowFilters(false)} />
          </div>
        </div>
      )}

      {/* Active filters indicator */}
      {getActiveFiltersCount() > 0 && (
        <div className="active-filters">
          <span className="filters-label">
            {getActiveFiltersCount()} filter{getActiveFiltersCount() > 1 ? 's' : ''} active:
          </span>
          {quality && <span className="filter-tag">Quality: {quality}</span>}
          {duration && <span className="filter-tag">Duration: {duration}</span>}
          {uploadDate && <span className="filter-tag">Date: {uploadDate}</span>}
          {channel && <span className="filter-tag">Channel: {channel}</span>}
          <button onClick={clearAllFilters} className="clear-filters-btn">
            Clear all
          </button>
        </div>
      )}

      {/* Related searches */}
      {relatedSearches && relatedSearches.length > 0 && (
        <div className="related-searches">
          <h3>Related searches:</h3>
          <div className="related-searches-list">
            {relatedSearches.map((related, index) => (
              <button
                key={index}
                className="related-search-tag"
                onClick={() => handleRelatedSearchClick(related.query)}
              >
                {related.query}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results content */}
      <div className="search-results-content">
        {resultsLoading ? (
          <div className="search-loading">
            <div className="loading-spinner"></div>
            <p>Searching...</p>
          </div>
        ) : resultsError ? (
          <div className="search-error">
            <div className="error-icon">⚠️</div>
            <h2>Error loading results</h2>
            <p>{resultsError.message}</p>
            <button onClick={() => window.location.reload()} className="retry-btn">
              Try again
            </button>
          </div>
        ) : searchData && searchData.length > 0 ? (
          <>
            <div className={`results-grid ${viewMode}`}>
              {searchData.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onClick={() => handleVideoClick(video.id)}
                  highlightQuery={query}
                  viewMode={viewMode}
                />
              ))}
            </div>

            {/* Pagination */}
            <div className="pagination">
              <button
                onClick={handlePrevPage}
                disabled={page === 1}
                className="pagination-btn"
              >
                ← Previous
              </button>
              <span className="page-indicator">Page {page}</span>
              <button
                onClick={handleNextPage}
                disabled={searchData.length < resultsPerPage}
                className="pagination-btn"
              >
                Next →
              </button>
            </div>
          </>
        ) : (
          <div className="no-results">
            <div className="no-results-icon">🔍</div>
            <h2>No results found</h2>
            <p>Try different keywords or check your spelling</p>
            {relatedSearches && relatedSearches.length > 0 && (
              <div className="suggestions">
                <p>Try these related searches:</p>
                <div className="suggestion-list">
                  {relatedSearches.map((related, index) => (
                    <button
                      key={index}
                      className="suggestion-tag"
                      onClick={() => handleRelatedSearchClick(related.query)}
                    >
                      {related.query}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search tips */}
      {searchData && searchData.length === 0 && (
        <div className="search-tips">
          <h3>Search tips:</h3>
          <ul>
            <li>Try different keywords</li>
            <li>Check your spelling</li>
            <li>Use more general terms</li>
            <li>Try removing filters</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchResults;
