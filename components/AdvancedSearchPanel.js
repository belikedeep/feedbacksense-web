'use client'

import { useState, useEffect } from 'react'
import DateRangePicker from './DateRangePicker'
import SearchQueryBuilder from './SearchQueryBuilder'

export default function AdvancedSearchPanel({ 
  feedback, 
  onFilteredResults, 
  onFiltersChange 
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [filters, setFilters] = useState({
    searchQuery: '',
    searchFunction: null,
    dateRange: { start: null, end: null },
    categories: [],
    sentiments: [],
    sources: [],
    statuses: [],
    priorities: [],
    showArchived: false,
    sortBy: 'date',
    sortOrder: 'desc'
  })

  // Extract unique values for filter options
  const filterOptions = {
    categories: [...new Set(feedback.map(f => f.category))].filter(Boolean),
    sentiments: [...new Set(feedback.map(f => f.sentimentLabel || f.sentiment_label))].filter(Boolean),
    sources: [...new Set(feedback.map(f => f.source))].filter(Boolean),
    statuses: [...new Set(feedback.map(f => f.status))].filter(Boolean),
    priorities: [...new Set(feedback.map(f => f.priority))].filter(Boolean)
  }

  // Apply all filters to feedback
  const applyFilters = (feedbackData, currentFilters) => {
    let filtered = [...feedbackData]

    // Apply date range filter
    if (currentFilters.dateRange.start || currentFilters.dateRange.end) {
      filtered = filtered.filter(item => {
        const feedbackDate = new Date(item.feedbackDate || item.feedback_date)
        
        if (currentFilters.dateRange.start && feedbackDate < currentFilters.dateRange.start) {
          return false
        }
        if (currentFilters.dateRange.end && feedbackDate > currentFilters.dateRange.end) {
          return false
        }
        return true
      })
    }

    // Apply category filter
    if (currentFilters.categories.length > 0) {
      filtered = filtered.filter(item => 
        currentFilters.categories.includes(item.category)
      )
    }

    // Apply sentiment filter
    if (currentFilters.sentiments.length > 0) {
      filtered = filtered.filter(item => 
        currentFilters.sentiments.includes(item.sentimentLabel || item.sentiment_label)
      )
    }

    // Apply source filter
    if (currentFilters.sources.length > 0) {
      filtered = filtered.filter(item =>
        currentFilters.sources.includes(item.source)
      )
    }

    // Apply status filter
    if (currentFilters.statuses.length > 0) {
      filtered = filtered.filter(item =>
        currentFilters.statuses.includes(item.status || 'new')
      )
    }

    // Apply priority filter
    if (currentFilters.priorities.length > 0) {
      filtered = filtered.filter(item =>
        currentFilters.priorities.includes(item.priority || 'medium')
      )
    }

    // Apply archived filter
    if (!currentFilters.showArchived) {
      filtered = filtered.filter(item => !item.isArchived)
    }

    // Apply search filter
    if (currentFilters.searchFunction && currentFilters.searchQuery) {
      filtered = currentFilters.searchFunction(filtered, currentFilters.parsedQuery)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue

      switch (currentFilters.sortBy) {
        case 'date':
          aValue = new Date(a.feedbackDate || a.feedback_date)
          bValue = new Date(b.feedbackDate || b.feedback_date)
          break
        case 'sentiment':
          aValue = parseFloat(a.sentimentScore || a.sentiment_score || 0)
          bValue = parseFloat(b.sentimentScore || b.sentiment_score || 0)
          break
        case 'priority':
          // Priority order: high > medium > low
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          aValue = priorityOrder[a.priority] || 2
          bValue = priorityOrder[b.priority] || 2
          break
        case 'status':
          // Status order: new > in_review > resolved > archived
          const statusOrder = { new: 4, in_review: 3, resolved: 2, archived: 1 }
          aValue = statusOrder[a.status] || 4
          bValue = statusOrder[b.status] || 4
          break
        case 'relevance':
          // For relevance, prioritize search matches
          aValue = currentFilters.searchQuery ?
            (a.content.toLowerCase().includes(currentFilters.searchQuery.toLowerCase()) ? 1 : 0) : 0
          bValue = currentFilters.searchQuery ?
            (b.content.toLowerCase().includes(currentFilters.searchQuery.toLowerCase()) ? 1 : 0) : 0
          break
        default:
          aValue = a.createdAt || a.created_at
          bValue = b.createdAt || b.created_at
      }

      if (currentFilters.sortOrder === 'desc') {
        return bValue > aValue ? 1 : bValue < aValue ? -1 : 0
      } else {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
      }
    })

    return filtered
  }

  // Update filtered results whenever filters change
  useEffect(() => {
    const filteredResults = applyFilters(feedback, filters)
    onFilteredResults(filteredResults)
    onFiltersChange(filters)
  }, [feedback, filters])

  const handleSearchChange = (query, parsedQuery, searchFunction) => {
    setFilters(prev => ({
      ...prev,
      searchQuery: query,
      parsedQuery: parsedQuery,
      searchFunction: searchFunction
    }))
  }

  const handleDateRangeChange = (start, end) => {
    setFilters(prev => ({
      ...prev,
      dateRange: { start, end }
    }))
  }

  const handleMultiSelectChange = (filterType, value) => {
    setFilters(prev => {
      const currentValues = prev[filterType]
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value]
      
      return {
        ...prev,
        [filterType]: newValues
      }
    })
  }

  const handleSortChange = (sortBy, sortOrder) => {
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortOrder: sortOrder || prev.sortOrder
    }))
  }

  const clearAllFilters = () => {
    setFilters({
      searchQuery: '',
      searchFunction: null,
      dateRange: { start: null, end: null },
      categories: [],
      sentiments: [],
      sources: [],
      statuses: [],
      priorities: [],
      showArchived: false,
      sortBy: 'date',
      sortOrder: 'desc'
    })
  }

  const hasActiveFilters =
    filters.searchQuery ||
    filters.dateRange.start ||
    filters.dateRange.end ||
    filters.categories.length > 0 ||
    filters.sentiments.length > 0 ||
    filters.sources.length > 0 ||
    filters.statuses.length > 0 ||
    filters.priorities.length > 0 ||
    filters.showArchived

  const getResultsCount = () => {
    return applyFilters(feedback, filters).length
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-medium text-gray-900">Advanced Search & Filters</h3>
            {hasActiveFilters && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {getResultsCount()} of {feedback.length} results
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Clear All
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              {isExpanded ? 'Hide Filters' : 'Show Filters'}
              <svg
                className={`ml-1 h-4 w-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar (Always Visible) */}
      <div className="px-6 py-4">
        <SearchQueryBuilder
          onSearchChange={handleSearchChange}
          placeholder="Search feedback content with advanced operators..."
        />
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="px-6 pb-6 space-y-6">
          {/* Date Range */}
          <div>
            <DateRangePicker
              onDateRangeChange={handleDateRangeChange}
              initialStartDate={filters.dateRange.start}
              initialEndDate={filters.dateRange.end}
            />
          </div>

          {/* Multi-Select Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Categories */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categories
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {filterOptions.categories.map(category => (
                  <label key={category} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(category)}
                      onChange={() => handleMultiSelectChange('categories', category)}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700 capitalize">{category}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Sentiments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sentiments
              </label>
              <div className="space-y-2">
                {filterOptions.sentiments.map(sentiment => (
                  <label key={sentiment} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.sentiments.includes(sentiment)}
                      onChange={() => handleMultiSelectChange('sentiments', sentiment)}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700 capitalize">{sentiment}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Sources */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sources
              </label>
              <div className="space-y-2">
                {filterOptions.sources.map(source => (
                  <label key={source} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.sources.includes(source)}
                      onChange={() => handleMultiSelectChange('sources', source)}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700 capitalize">{source}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Enhanced Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <div className="space-y-2">
                {filterOptions.statuses.map(status => (
                  <label key={status} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.statuses.includes(status)}
                      onChange={() => handleMultiSelectChange('statuses', status)}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700 capitalize">
                      {status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'New'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <div className="space-y-2">
                {filterOptions.priorities.map(priority => (
                  <label key={priority} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.priorities.includes(priority)}
                      onChange={() => handleMultiSelectChange('priorities', priority)}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700 capitalize">
                      {priority?.charAt(0).toUpperCase() + priority?.slice(1) || 'Medium'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Archive Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Archive Options
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.showArchived}
                    onChange={(e) => setFilters(prev => ({ ...prev, showArchived: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">Include Archived Items</span>
                </label>
              </div>
            </div>
          </div>

          {/* Sorting Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort Results
            </label>
            <div className="flex items-center space-x-4">
              <select
                value={filters.sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="date">Date</option>
                <option value="sentiment">Sentiment Score</option>
                <option value="priority">Priority</option>
                <option value="status">Status</option>
                <option value="relevance">Relevance</option>
              </select>
              <select
                value={filters.sortOrder}
                onChange={(e) => handleSortChange(filters.sortBy, e.target.value)}
                className="block w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}