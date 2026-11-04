'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover'
import { Globe, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { searchCountries, GLOBAL_CITIES_DB, getCountryName } from '@/lib/data/global-cities'
import type { Locale } from '@/lib/i18n/config'

interface CountryComboboxProps {
  value: string // country code or empty
  onChange: (countryCode: string) => void
  placeholder?: string
  className?: string
  locale?: Locale
  t?: Record<string, string>
}

export function CountryCombobox({
  value,
  onChange,
  placeholder = 'Select a country...',
  className,
  locale = 'en',
  t,
}: CountryComboboxProps) {
  const [inputValue, setInputValue] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Get country display name from code
  const getDisplayName = useCallback((code: string): string => {
    const country = GLOBAL_CITIES_DB.find((c) => c.code === code)
    if (!country) return code
    return getCountryName(country, locale)
  }, [locale])

  // Search countries based on input
  const results = searchCountries(inputValue, locale, 15)

  // Reset highlight when input changes
  useEffect(() => {
    setHighlightIndex(0)
  }, [inputValue])

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const item = listRef.current.children[highlightIndex] as HTMLElement
      item?.scrollIntoView({ block: 'nearest' })
    }
  }, [highlightIndex, isOpen])

  const selectCountry = useCallback((code: string) => {
    onChange(code)
    setInputValue('')
    setIsOpen(false)
  }, [onChange])

  const clearSelection = useCallback(() => {
    onChange('')
    setInputValue('')
    inputRef.current?.focus()
  }, [onChange])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    setIsOpen(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setIsOpen(true)
      setHighlightIndex((prev) =>
        prev < results.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : 0))
    } else if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault()
      selectCountry(results[highlightIndex].code)
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const handleFocus = () => {
    setIsOpen(true)
  }

  // Display value: selected country name when not editing, otherwise search text
  const displayValue = value && !isOpen ? getDisplayName(value) : inputValue

  return (
    <Popover open={isOpen && results.length > 0} onOpenChange={setIsOpen}>
      <PopoverAnchor asChild>
        <div
          className={cn(
            'flex items-center min-h-[44px] rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors',
            'focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30',
            className
          )}
          onClick={() => inputRef.current?.focus()}
        >
          <div className="flex items-center gap-1.5 flex-1">
            <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              value={displayValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              onBlur={() => {
                setTimeout(() => setIsOpen(false), 200)
              }}
              placeholder={placeholder}
              aria-label={placeholder}
              role="combobox"
              aria-expanded={isOpen && results.length > 0}
              aria-autocomplete="list"
              className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground text-sm"
            />
          </div>
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                clearSelection()
              }}
              aria-label={t?.clearSelection}
              className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
      </PopoverAnchor>

      <PopoverContent
        align="start"
        sideOffset={4}
        className="w-[var(--radix-popover-trigger-width)] p-0 max-h-[240px] overflow-hidden"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div ref={listRef} className="overflow-y-auto max-h-[240px] py-1">
          {results.map((country, index) => (
            <button
              key={country.code}
              type="button"
              className={cn(
                'flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors',
                index === highlightIndex
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-muted/50'
              )}
              onMouseDown={(e) => {
                e.preventDefault()
                selectCountry(country.code)
              }}
              onMouseEnter={() => setHighlightIndex(index)}
            >
              <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="flex-1">{country.name}</span>
              {value === country.code && (
                <Check className="h-3.5 w-3.5 text-primary shrink-0" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
