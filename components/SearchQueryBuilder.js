'use client'

import { useState, useEffect } from 'react'

export default function SearchQueryBuilder({ onSearchChange, placeholder = "Search feedback..." }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchMode, setSearchMode] = useState('simple') // 'simple' or 'advanced'
  const [showHelp, setShowHelp] = useState(false)

  // Parse search query for advanced operators
  const parseAdvancedQuery = (query) => {
    if (!query.trim()) return null

    // Simple mode - just return the query as-is for basic text search
    if (searchMode === 'simple') {
      return {
        type: 'simple',
        term: query.trim(),
        originalQuery: query
      }
    }

    // Advanced mode - parse AND, OR, NOT operators
    const terms = []
    let currentTerm = ''
    let currentOperator = 'AND'
    let isNegated = false
    
    // Split by spaces but preserve quoted strings
    const tokens = query.match(/(?:[^\s"]+|"[^"]*")+/g) || []
    
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i].toLowerCase()
      
      if (token === 'and' || token === '&&') {
        if (currentTerm) {
          terms.push({
            term: currentTerm.replace(/"/g, ''),
            operator: currentOperator,
            negated: isNegated
          })
          currentTerm = ''
          isNegated = false
        }
        currentOperator = 'AND'
      } else if (token === 'or' || token === '||') {
        if (currentTerm) {
          terms.push({
            term: currentTerm.replace(/"/g, ''),
            operator: currentOperator,
            negated: isNegated
          })
          currentTerm = ''
          isNegated = false
        }
        currentOperator = 'OR'
      } else if (token === 'not' || token === '!') {
        isNegated = true
      } else {
        if (currentTerm) currentTerm += ' '
        currentTerm += tokens[i] // Use original case for the term
      }
    }
    
    // Add the last term
    if (currentTerm) {
      terms.push({
        term: currentTerm.replace(/"/g, ''),
        operator: currentOperator,
        negated: isNegated
      })
    }

    return {
      type: 'advanced',
      terms: terms,
      originalQuery: query
    }
  }

  // Execute search logic
  const executeSearch = (feedback, parsedQuery) => {
    if (!parsedQuery) return feedback

    if (parsedQuery.type === 'simple') {
      return feedback.filter(item => 
        item.content.toLowerCase().includes(parsedQuery.term.toLowerCase())
      )
    }

    // Advanced search logic
    return feedback.filter(item => {
      const content = item.content.toLowerCase()
      let result = true
      let hasOrCondition = false
      let orResult = false

      for (const term of parsedQuery.terms) {
        const matches = content.includes(term.term.toLowerCase())
        const termResult = term.negated ? !matches : matches

        if (term.operator === 'OR') {
          hasOrCondition = true
          orResult = orResult || termResult
        } else { // AND
          if (hasOrCondition) {
            // Complete the OR group
            result = result && orResult
            hasOrCondition = false
            orResult = false
          }
          result = result && termResult
        }
      }

      // Handle final OR condition
      if (hasOrCondition) {
        result = result && orResult
      }

      return result
    })
  }

  useEffect(() => {
    const parsedQuery = parseAdvancedQuery(searchQuery)
    onSearchChange(searchQuery, parsedQuery, executeSearch)
  }, [searchQuery, searchMode])

  const handleModeToggle = () => {
    const newMode = searchMode === 'simple' ? 'advanced' : 'simple'
    setSearchMode(newMode)
    
    // Clear search when switching modes
    if (newMode === 'simple' && searchQuery.includes(' AND ') || searchQuery.includes(' OR ') || searchQuery.includes(' NOT ')) {
      setSearchQuery('')
    }
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center space-x-2">
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Search Mode Toggle */}
      <div className="flex items-center space-x-3">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={searchMode === 'advanced'}
            onChange={handleModeToggle}
            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
          <span className="ml-2 text-sm text-gray-600">Advanced search</span>
        </label>
        
        {searchQuery && (
          <span className="text-xs text-gray-500">
            Mode: {searchMode === 'advanced' ? 'Advanced (AND/OR/NOT)' : 'Simple text search'}
          </span>
        )}
      </div>

      {/* Help Text */}
      {showHelp && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm">
          <h4 className="font-medium text-blue-900 mb-2">Search Help</h4>
          <div className="text-blue-800 space-y-1">
            <div><strong>Simple mode:</strong> Search for any text in feedback content</div>
            <div><strong>Advanced mode operators:</strong></div>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><code>AND</code> or <code>&&</code> - Both terms must be present</li>
              <li><code>OR</code> or <code>||</code> - Either term can be present</li>
              <li><code>NOT</code> or <code>!</code> - Term must not be present</li>
              <li><code>"phrase"</code> - Search for exact phrase</li>
            </ul>
            <div className="mt-2">
              <strong>Examples:</strong>
              <ul className="list-disc list-inside ml-4">
                <li><code>bug AND critical</code> - Find feedback with both words</li>
                <li><code>feature OR request</code> - Find feedback with either word</li>
                <li><code>NOT spam</code> - Exclude feedback containing "spam"</li>
                <li><code>"great product"</code> - Find exact phrase</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}