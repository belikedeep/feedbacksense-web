'use client'

import { useState } from 'react'
import { format, subDays, subMonths, subYears, startOfDay, endOfDay } from 'date-fns'
import { Calendar as CalendarIcon, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'

export default function DateRangePicker({ onDateRangeChange, initialStartDate, initialEndDate }) {
  const [startDate, setStartDate] = useState(initialStartDate || null)
  const [endDate, setEndDate] = useState(initialEndDate || null)
  const [selectedRange, setSelectedRange] = useState(null)
  const [startDatePopoverOpen, setStartDatePopoverOpen] = useState(false)
  const [endDatePopoverOpen, setEndDatePopoverOpen] = useState(false)

  const predefinedRanges = [
    { label: '7d', fullLabel: 'Last 7 days', days: 7 },
    { label: '30d', fullLabel: 'Last 30 days', days: 30 },
    { label: '3m', fullLabel: 'Last 3 months', months: 3 },
    { label: '6m', fullLabel: 'Last 6 months', months: 6 },
    { label: '1y', fullLabel: 'Last year', years: 1 },
  ]

  const handlePredefinedRange = (range) => {
    const end = endOfDay(new Date())
    let start

    if (range.days) {
      start = startOfDay(subDays(end, range.days - 1))
    } else if (range.months) {
      start = startOfDay(subMonths(end, range.months))
    } else if (range.years) {
      start = startOfDay(subYears(end, range.years))
    }

    setStartDate(start)
    setEndDate(end)
    setSelectedRange(range.label)
    onDateRangeChange(start, end)
  }

  const handleStartDateSelect = (date) => {
    setStartDate(date)
    setSelectedRange(null)
    setStartDatePopoverOpen(false)
    
    if (date && endDate) {
      onDateRangeChange(startOfDay(date), endOfDay(endDate))
    } else if (date) {
      onDateRangeChange(startOfDay(date), endDate)
    }
  }

  const handleEndDateSelect = (date) => {
    setEndDate(date)
    setSelectedRange(null)
    setEndDatePopoverOpen(false)
    
    if (startDate && date) {
      onDateRangeChange(startOfDay(startDate), endOfDay(date))
    } else if (date) {
      onDateRangeChange(startDate, endOfDay(date))
    }
  }

  const clearDateRange = () => {
    setStartDate(null)
    setEndDate(null)
    setSelectedRange(null)
    onDateRangeChange(null, null)
  }

  const isDateDisabled = (date, type) => {
    if (date > new Date()) return true
    
    if (type === 'start' && endDate) {
      return date > endDate
    }
    
    if (type === 'end' && startDate) {
      return date < startDate
    }
    
    return false
  }

  const getCustomDateDisplay = (type) => {
    const date = type === 'start' ? startDate : endDate
    return date ? format(date, 'MMM dd') : `${type === 'start' ? 'From' : 'To'}`
  }

  const getDaysCount = () => {
    if (startDate && endDate) {
      const diffTime = Math.abs(endDate - startDate)
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    }
    return 0
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
      {/* Quick Range Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-600 mr-1 shrink-0">Range:</span>
        <div className="flex flex-wrap gap-1.5">
          {predefinedRanges.map((range, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className={cn(
                "h-8 sm:h-7 px-3 text-xs font-medium transition-all duration-200 touch-manipulation",
                selectedRange === range.label 
                  ? "bg-teal-500 text-white border-teal-500 hover:bg-teal-600" 
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              )}
              onClick={() => handlePredefinedRange(range)}
            >
              {range.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Separator - Hidden on mobile */}
      <div className="hidden sm:block h-4 w-px bg-gray-300 shrink-0"></div>

      {/* Custom Date Inputs */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
        <span className="text-sm font-medium text-gray-600 shrink-0">Custom:</span>
        
        <div className="flex items-center gap-2">
          {/* Start Date */}
          <Popover open={startDatePopoverOpen} onOpenChange={setStartDatePopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-8 sm:h-7 px-2 text-xs min-w-[70px] sm:min-w-[60px] justify-center touch-manipulation",
                  startDate && !selectedRange 
                    ? "bg-teal-50 border-teal-300 text-teal-900 hover:bg-teal-100" 
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <CalendarIcon className="mr-1 h-3 w-3 shrink-0" />
                <span className="truncate">{getCustomDateDisplay('start')}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start" side="bottom">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={handleStartDateSelect}
                disabled={(date) => isDateDisabled(date, 'start')}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <span className="text-xs text-gray-400 shrink-0">→</span>

          {/* End Date */}
          <Popover open={endDatePopoverOpen} onOpenChange={setEndDatePopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-8 sm:h-7 px-2 text-xs min-w-[70px] sm:min-w-[60px] justify-center touch-manipulation",
                  endDate && !selectedRange 
                    ? "bg-teal-50 border-teal-300 text-teal-900 hover:bg-teal-100" 
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <CalendarIcon className="mr-1 h-3 w-3 shrink-0" />
                <span className="truncate">{getCustomDateDisplay('end')}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start" side="bottom">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={handleEndDateSelect}
                disabled={(date) => isDateDisabled(date, 'end')}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Clear Custom Dates */}
          {(startDate || endDate) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 sm:h-7 sm:w-7 p-0 hover:bg-red-50 hover:text-red-600 touch-manipulation shrink-0"
              onClick={clearDateRange}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Current Selection Info */}
      {!selectedRange && startDate && endDate && (
        <div className="flex sm:ml-auto">
          <Badge variant="outline" className="text-xs bg-teal-50 text-teal-700 border-teal-200">
            {getDaysCount()} days
          </Badge>
        </div>
      )}

      {/* Error State */}
      {startDate && endDate && startDate > endDate && (
        <div className="flex sm:ml-auto">
          <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
            Invalid range
          </Badge>
        </div>
      )}
    </div>
  )
}