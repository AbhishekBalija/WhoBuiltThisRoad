import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchRoads } from '@/utils/api'
import type { Road } from '@/types'

export function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Road[]>([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const showDropdown = query.length >= 3

  useEffect(() => {
    if (query.length < 3) return

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await searchRoads(query)
        setResults(data.results)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  function handleSelect(road: Road) {
    setQuery('')
    navigate(`/road/${road.slug}`)
  }

  function handleKeyDown(road: Road, event: React.KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleSelect(road)
    }
  }

  function handleBlur() {
    setTimeout(() => {
      if (dropdownRef.current) dropdownRef.current.style.display = 'none'
    }, 200)
  }

  return (
    <div ref={dropdownRef} className="relative w-full max-w-xl">
      <input
        type="text"
        placeholder="Search any road in Bengaluru..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => {
          if (dropdownRef.current) dropdownRef.current.style.display = ''
        }}
        onBlur={handleBlur}
        className="w-full rounded-lg border border-gray-300 px-4 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        aria-label="Search roads"
        role="combobox"
        aria-expanded={showDropdown && results.length > 0}
        aria-autocomplete="list"
        aria-controls="search-results"
      />
      {loading && (
        <div className="mt-1 text-sm text-gray-500" aria-live="polite">
          Loading...
        </div>
      )}
      {showDropdown && results.length > 0 && (
        <ul
          id="search-results"
          role="listbox"
          className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg"
        >
          {results.map(road => (
            <li
              key={road.slug}
              role="option"
              aria-selected={false}
              onClick={() => handleSelect(road)}
              onKeyDown={e => handleKeyDown(road, e)}
              className="cursor-pointer px-4 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
              tabIndex={0}
            >
              <strong className="text-gray-900">{road.name}</strong>
              <small className="ml-2 text-gray-500">
                {[road.ward_name, road.division].filter(Boolean).join(' · ')}
              </small>
            </li>
          ))}
        </ul>
      )}
      {showDropdown && results.length === 0 && !loading && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-500 shadow-lg" aria-live="polite">
          No roads found for &ldquo;{query}&rdquo;
        </div>
      )}
    </div>
  )
}
