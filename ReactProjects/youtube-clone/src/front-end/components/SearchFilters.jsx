import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './SearchFilters.css';

const SearchFilters = ({ onClose }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const query = searchParams.get('q') || '';
  const currentSort = searchParams.get('sort') || 'relevance';
  const currentQuality = searchParams.get('quality') || '';
  const currentDuration = searchParams.get('duration') || '';
  const currentDate = searchParams.get('date') || '';
  const currentChannel = searchParams.get('channel') || '';

  const [filters, setFilters] = useState({
    sort: currentSort,
    quality: currentQuality,
    duration: currentDuration,
    date: currentDate,
    channel: currentChannel
  });

  // Update filters when URL params change
  useEffect(() => {
    setFilters({
      sort: currentSort,
      quality: currentQuality,
      duration: currentDuration,
      date: currentDate,
      channel: currentChannel
    });
  }, [currentSort, currentQuality, currentDuration, currentDate, currentChannel]);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    params.set('q', query);
    
    if (filters.sort && filters.sort !== 'relevance') {
      params.set('sort', filters.sort);
    }
    if (filters.quality) {
      params.set('quality', filters.quality);
    }
    if (filters.duration) {
      params.set('duration', filters.duration);
    }
    if (filters.date) {
      params.set('date', filters.date);
    }
    if (filters.channel) {
      params.set('channel', filters.channel);
    }

    navigate(`/search?${params.toString()}`);
    if (onClose) onClose();
  };

  const clearFilters = () => {
    setFilters({
      sort: 'relevance',
      quality: '',
      duration: '',
      date: '',
      channel: ''
    });
    
    const params = new URLSearchParams();
    params.set('q', query);
    navigate(`/search?${params.toString()}`);
    if (onClose) onClose();
  };

  const hasActiveFilters = () => {
    return filters.quality || filters.duration || filters.date || filters.channel || filters.sort !== 'relevance';
  };

  return (
    <div className="search-filters">
      <div className="search-filters-header">
        <h2>Filters</h2>
        {onClose && (
          <button onClick={onClose} className="search-filters-close">
            ✕
          </button>
        )}
      </div>

      <div className="search-filters-content">
        {/* Sort By */}
        <div className="filter-section">
          <h3 className="filter-section-title">Sort by</h3>
          <div className="filter-options">
            <label className="filter-option">
              <input
                type="radio"
                name="sort"
                value="relevance"
                checked={filters.sort === 'relevance'}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
              />
              <span>Relevance</span>
            </label>
            <label className="filter-option">
              <input
                type="radio"
                name="sort"
                value="upload_date"
                checked={filters.sort === 'upload_date'}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
              />
              <span>Upload date</span>
            </label>
            <label className="filter-option">
              <input
                type="radio"
                name="sort"
                value="view_count"
                checked={filters.sort === 'view_count'}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
              />
              <span>View count</span>
            </label>
            <label className="filter-option">
              <input
                type="radio"
                name="sort"
                value="rating"
                checked={filters.sort === 'rating'}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
              />
              <span>Rating</span>
            </label>
          </div>
        </div>

        {/* Upload Date */}
        <div className="filter-section">
          <h3 className="filter-section-title">Upload date</h3>
          <div className="filter-options">
            <label className="filter-option">
              <input
                type="radio"
                name="date"
                value=""
                checked={!filters.date}
                onChange={(e) => handleFilterChange('date', e.target.value)}
              />
              <span>Any time</span>
            </label>
            <label className="filter-option">
              <input
                type="radio"
                name="date"
                value="today"
                checked={filters.date === 'today'}
                onChange={(e) => handleFilterChange('date', e.target.value)}
              />
              <span>Today</span>
            </label>
            <label className="filter-option">
              <input
                type="radio"
                name="date"
                value="week"
                checked={filters.date === 'week'}
                onChange={(e) => handleFilterChange('date', e.target.value)}
              />
              <span>This week</span>
            </label>
            <label className="filter-option">
              <input
                type="radio"
                name="date"
                value="month"
                checked={filters.date === 'month'}
                onChange={(e) => handleFilterChange('date', e.target.value)}
              />
              <span>This month</span>
            </label>
            <label className="filter-option">
              <input
                type="radio"
                name="date"
                value="year"
                checked={filters.date === 'year'}
                onChange={(e) => handleFilterChange('date', e.target.value)}
              />
              <span>This year</span>
            </label>
          </div>
        </div>

        {/* Duration */}
        <div className="filter-section">
          <h3 className="filter-section-title">Duration</h3>
          <div className="filter-options">
            <label className="filter-option">
              <input
                type="radio"
                name="duration"
                value=""
                checked={!filters.duration}
                onChange={(e) => handleFilterChange('duration', e.target.value)}
              />
              <span>Any duration</span>
            </label>
            <label className="filter-option">
              <input
                type="radio"
                name="duration"
                value="short"
                checked={filters.duration === 'short'}
                onChange={(e) => handleFilterChange('duration', e.target.value)}
              />
              <span>Under 4 minutes</span>
            </label>
            <label className="filter-option">
              <input
                type="radio"
                name="duration"
                value="medium"
                checked={filters.duration === 'medium'}
                onChange={(e) => handleFilterChange('duration', e.target.value)}
              />
              <span>4-20 minutes</span>
            </label>
            <label className="filter-option">
              <input
                type="radio"
                name="duration"
                value="long"
                checked={filters.duration === 'long'}
                onChange={(e) => handleFilterChange('duration', e.target.value)}
              />
              <span>Over 20 minutes</span>
            </label>
          </div>
        </div>

        {/* Quality */}
        <div className="filter-section">
          <h3 className="filter-section-title">Quality</h3>
          <div className="filter-options">
            <label className="filter-option">
              <input
                type="radio"
                name="quality"
                value=""
                checked={!filters.quality}
                onChange={(e) => handleFilterChange('quality', e.target.value)}
              />
              <span>Any quality</span>
            </label>
            <label className="filter-option">
              <input
                type="radio"
                name="quality"
                value="4K"
                checked={filters.quality === '4K'}
                onChange={(e) => handleFilterChange('quality', e.target.value)}
              />
              <span>4K (2160p)</span>
            </label>
            <label className="filter-option">
              <input
                type="radio"
                name="quality"
                value="HD"
                checked={filters.quality === 'HD'}
                onChange={(e) => handleFilterChange('quality', e.target.value)}
              />
              <span>HD (1080p/720p)</span>
            </label>
            <label className="filter-option">
              <input
                type="radio"
                name="quality"
                value="SD"
                checked={filters.quality === 'SD'}
                onChange={(e) => handleFilterChange('quality', e.target.value)}
              />
              <span>SD (480p and below)</span>
            </label>
          </div>
        </div>

        {/* Channel Filter */}
        <div className="filter-section">
          <h3 className="filter-section-title">Channel</h3>
          <input
            type="text"
            className="filter-channel-input"
            placeholder="Enter channel name..."
            value={filters.channel}
            onChange={(e) => handleFilterChange('channel', e.target.value)}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="search-filters-actions">
        <button
          onClick={clearFilters}
          className="search-filters-btn secondary"
          disabled={!hasActiveFilters()}
        >
          Clear filters
        </button>
        <button
          onClick={applyFilters}
          className="search-filters-btn primary"
        >
          Apply
        </button>
      </div>
    </div>
  );
};

export default SearchFilters;
