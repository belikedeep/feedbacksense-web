'use client'

import { createContext, useContext, useState, useEffect } from 'react'

const SidebarContext = createContext()

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}

export function SidebarProvider({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [breakpoint, setBreakpoint] = useState('desktop')

  // Responsive breakpoint detection
  useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth
      if (width < 768) {
        setBreakpoint('mobile')
      } else if (width < 1024) {
        setBreakpoint('tablet')
      } else {
        setBreakpoint('desktop')
      }
    }

    checkBreakpoint()
    window.addEventListener('resize', checkBreakpoint)
    return () => window.removeEventListener('resize', checkBreakpoint)
  }, [])

  // Load desktop collapse preference from localStorage
  useEffect(() => {
    if (breakpoint === 'desktop') {
      const savedState = localStorage.getItem('sidebar-collapsed')
      if (savedState !== null) {
        setIsCollapsed(JSON.parse(savedState))
      }
    }
  }, [breakpoint])

  // Save desktop collapse preference to localStorage
  useEffect(() => {
    if (breakpoint === 'desktop') {
      localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed))
    }
  }, [isCollapsed, breakpoint])

  // Close mobile drawer when breakpoint changes to desktop
  useEffect(() => {
    if (breakpoint === 'desktop') {
      setIsMobileOpen(false)
    }
  }, [breakpoint])

  const toggleCollapse = () => {
    if (breakpoint === 'desktop') {
      setIsCollapsed(!isCollapsed)
    } else {
      setIsMobileOpen(!isMobileOpen)
    }
  }

  const closeMobileDrawer = () => {
    setIsMobileOpen(false)
  }

  const openMobileDrawer = () => {
    setIsMobileOpen(true)
  }

  // Determine sidebar width based on state and breakpoint
  const getSidebarWidth = () => {
    if (breakpoint === 'desktop') {
      return isCollapsed ? '80px' : '288px' // 20 and 72 in Tailwind
    }
    return '288px' // Full width for mobile/tablet drawer
  }

  // Determine main content margin based on state and breakpoint
  const getMainContentMargin = () => {
    if (breakpoint === 'desktop') {
      return isCollapsed ? '80px' : '288px'
    }
    return '0px' // No margin for mobile/tablet
  }

  const value = {
    isCollapsed,
    isMobileOpen,
    breakpoint,
    toggleCollapse,
    closeMobileDrawer,
    openMobileDrawer,
    getSidebarWidth,
    getMainContentMargin,
    isDesktop: breakpoint === 'desktop',
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isMobileOrTablet: breakpoint === 'mobile' || breakpoint === 'tablet',
    showOverlay: (breakpoint === 'mobile' || breakpoint === 'tablet') && isMobileOpen
  }

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  )
}