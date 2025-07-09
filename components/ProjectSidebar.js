'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useProject } from '@/contexts/ProjectContext'
import { useSidebar } from '@/contexts/SidebarContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import BrandLogo from '@/components/icons/BrandLogo'
import AnalyticsIcon from '@/components/icons/AnalyticsIcon'
import AIIcon from '@/components/icons/AIIcon'
import ProjectSelectorSidebar from '@/components/ProjectSelectorSidebar'
import {
  PlusIcon,
  DocumentArrowUpIcon,
  DocumentTextIcon,
  ChartBarIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  DocumentArrowDownIcon,
  XMarkIcon,
  Bars3Icon,
  CogIcon,
  BuildingOfficeIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

export default function ProjectSidebar({ user, onSignOut }) {
  const { project } = useProject()
  const pathname = usePathname()
  const router = useRouter()
  const { 
    isCollapsed, 
    isMobileOpen, 
    toggleCollapse, 
    closeMobileDrawer, 
    getSidebarWidth,
    isDesktop,
    isMobileOrTablet
  } = useSidebar()

  // Project-specific navigation items - keeping original structure
  const getNavigationItems = () => {
    if (!project) return []
    
    return [
      {
        id: 'dashboard',
        label: 'Analytics Dashboard',
        href: `/project/${project.id}/dashboard`,
        icon: AnalyticsIcon,
        description: 'Comprehensive insights'
      },
      {
        id: 'add-feedback',
        label: 'Add Feedback',
        href: `/project/${project.id}/dashboard?tab=add-feedback`,
        icon: PlusIcon,
        description: 'Create new entry'
      },
      {
        id: 'import-csv',
        label: 'Import Data',
        href: `/project/${project.id}/dashboard?tab=import-csv`,
        icon: DocumentArrowUpIcon,
        description: 'Bulk import CSV'
      },
      {
        id: 'feedback-list',
        label: 'All Feedback',
        href: `/project/${project.id}/dashboard?tab=feedback-list`,
        icon: DocumentTextIcon,
        description: 'View all entries'
      },
      {
        id: 'category-analytics',
        label: 'Category Insights',
        href: `/project/${project.id}/dashboard?tab=category-analytics`,
        icon: ChartBarIcon,
        description: 'Deep category analysis'
      },
      {
        id: 'ai-performance',
        label: 'AI Performance',
        href: `/project/${project.id}/dashboard?tab=ai-performance`,
        icon: AIIcon,
        description: 'AI metrics & accuracy'
      }
    ]
  }

  const navigationItems = getNavigationItems()

  const handleNavItemClick = (href) => {
    router.push(href)
    if (isMobileOrTablet) {
      closeMobileDrawer()
    }
  }

  const reanalyzeAllFeedback = async () => {
    if (!project) return
    
    if (!confirm('This will re-analyze all feedback in this project with improved sentiment analysis. Continue?')) {
      return
    }

    try {
      // Implementation for project-specific reanalysis
      console.log('Reanalyzing feedback for project:', project.id)
      // TODO: Implement project-scoped reanalysis API call
    } catch (error) {
      console.error('Error reanalyzing feedback:', error)
    }
  }

  const exportReport = () => {
    if (!project) return
    
    // TODO: Implement project-specific export
    console.log('Exporting report for project:', project.id)
  }

  // Mobile/Tablet drawer
  if (isMobileOrTablet) {
    return (
      <>
        {/* Overlay */}
        {isMobileOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
            onClick={closeMobileDrawer}
          />
        )}
        
        {/* Drawer */}
        <aside
          className={`fixed left-0 top-0 z-50 h-screen bg-gradient-to-b from-teal-900 via-teal-800 to-teal-700 shadow-2xl transform transition-transform duration-300 ease-in-out ${
            isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ width: getSidebarWidth() }}
        >
          <SidebarContent
            isCollapsed={false}
            navigationItems={navigationItems}
            pathname={pathname}
            onNavItemClick={handleNavItemClick}
            reanalyzeAllFeedback={reanalyzeAllFeedback}
            exportReport={exportReport}
            user={user}
            onSignOut={onSignOut}
            showCloseButton={true}
            closeMobileDrawer={closeMobileDrawer}
            toggleCollapse={toggleCollapse}
            project={project}
          />
        </aside>
      </>
    )
  }

  // Desktop sidebar
  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen bg-gradient-to-b from-teal-900 via-teal-800 to-teal-700 shadow-2xl transition-all duration-300 ease-in-out`}
      style={{ width: getSidebarWidth() }}
    >
      <SidebarContent
        isCollapsed={isCollapsed}
        navigationItems={navigationItems}
        pathname={pathname}
        onNavItemClick={handleNavItemClick}
        reanalyzeAllFeedback={reanalyzeAllFeedback}
        exportReport={exportReport}
        user={user}
        onSignOut={onSignOut}
        showCloseButton={false}
        closeMobileDrawer={closeMobileDrawer}
        toggleCollapse={toggleCollapse}
        project={project}
      />
    </aside>
  )
}

function SidebarContent({
  isCollapsed,
  navigationItems,
  pathname,
  reanalyzeAllFeedback,
  exportReport,
  user,
  onSignOut,
  showCloseButton,
  closeMobileDrawer,
  toggleCollapse,
  project,
  onNavItemClick
}) {
  const [currentTab, setCurrentTab] = useState(null)

  // Update currentTab when pathname or window location changes
  useEffect(() => {
    const updateCurrentTab = () => {
      if (typeof window !== 'undefined') {
        const searchParams = new URLSearchParams(window.location.search)
        const tab = searchParams.get('tab')
        setCurrentTab(tab)
      }
    }

    updateCurrentTab()

    // Listen for navigation events
    const handleNavigation = () => {
      setTimeout(updateCurrentTab, 100) // Small delay to ensure URL has updated
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', handleNavigation)
      window.addEventListener('pushstate', handleNavigation)
      window.addEventListener('replacestate', handleNavigation)
      
      // Custom event for manual navigation
      window.addEventListener('urlchange', handleNavigation)
      
      return () => {
        window.removeEventListener('popstate', handleNavigation)
        window.removeEventListener('pushstate', handleNavigation)
        window.removeEventListener('replacestate', handleNavigation)
        window.removeEventListener('urlchange', handleNavigation)
      }
    }
  }, [pathname])

  // Handle navigation item clicks - use the passed function or create a local one
  const handleNavClick = onNavItemClick || ((href) => {
    if (typeof window !== 'undefined') {
      window.location.href = href
    }
  })

  const isActiveNavItem = (item) => {
    if (item.id === 'dashboard') {
      return pathname === item.href && !currentTab
    }
    
    return currentTab === item.id
  }

  const getBusinessTypeIcon = (businessType) => {
    const types = {
      'e-commerce': '🛒',
      'saas': '💻',
      'healthcare': '🏥',
      'education': '🎓',
      'finance': '💰',
      'real_estate': '🏠',
      'food_beverage': '🍽️',
      'retail': '🏪',
      'consulting': '💼',
      'manufacturing': '🏭',
      'other': '🏢'
    }
    return types[businessType] || '🏢'
  }

  return (
    <div className="flex h-full flex-col">
      {/* Logo and Project */}
      <div className={`border-b border-teal-600/30 px-6 py-6 relative`}>
        {showCloseButton && (
          <button
            onClick={closeMobileDrawer}
            className="absolute top-4 right-4 p-2 text-stone-300 hover:text-stone-50 hover:bg-teal-600/30 rounded-lg transition-colors z-10"
            aria-label="Close sidebar"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
        
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
          <BrandLogo className="w-10 h-10 text-stone-100 flex-shrink-0" />
          
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-stone-50">FeedbackSense</h1>
              <Badge className="w-fit text-xs bg-amber-500/20 text-amber-200 border-amber-400/30 hover:bg-amber-500/30">
                v2.0 AI-Powered
              </Badge>
            </div>
          )}
        </div>
        
        {!showCloseButton && (
          <button
            onClick={toggleCollapse}
            className={`absolute top-6 right-4 p-2 text-stone-300 hover:text-stone-50 hover:bg-teal-600/30 rounded-lg transition-colors`}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Bars3Icon className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Project Selector */}
      <ProjectSelectorSidebar
        currentProject={project}
        onProjectChange={(newProject) => {
          // Handle project change - could refresh or navigate
          window.location.href = `/project/${newProject.id}/dashboard`
        }}
        onCreateProject={() => {
          window.location.href = '/projects?create=true'
        }}
        isCollapsed={isCollapsed}
      />

      {/* Navigation */}
      <nav className="space-y-2 p-4 flex-1 overflow-y-auto">
        {!isCollapsed && (
          <div className="text-xs font-semibold text-stone-300 uppercase tracking-wider mb-4">
            Project Navigation
          </div>
        )}
        
        {navigationItems.map((item) => {
          const IconComponent = item.icon
          const isActive = isActiveNavItem(item)
          
          return (
            <button
              key={item.id}
              onClick={() => {
                handleNavClick(item.href)
                // Update tab state immediately for visual feedback
                const url = new URL(item.href, window.location.origin)
                const tab = url.searchParams.get('tab')
                setCurrentTab(tab)
              }}
              className={`flex w-full items-center rounded-xl px-4 py-3 text-left text-sm font-medium transition-all duration-200 group ${
                isCollapsed ? 'justify-center' : 'gap-3'
              } ${
                isActive
                  ? 'bg-stone-100/10 text-stone-50 shadow-lg backdrop-blur-sm border border-stone-100/20'
                  : 'text-stone-200 hover:bg-stone-100/5 hover:text-stone-50 hover:translate-x-1'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <div className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                isActive
                  ? 'bg-amber-400/20 text-amber-200'
                  : 'bg-teal-600/30 text-stone-300 group-hover:bg-teal-500/40 group-hover:text-stone-200'
              }`}>
                <IconComponent className="h-5 w-5" />
              </div>
              
              {!isCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold">{item.label}</span>
                  <span className={`text-xs ${isActive ? 'text-stone-300' : 'text-stone-400'}`}>
                    {item.description}
                  </span>
                </div>
              )}
            </button>
          )
        })}

      </nav>

      {/* Quick Actions */}
      <div className={`space-y-3 p-4 border-t border-teal-600/30 ${isCollapsed ? 'px-2' : ''}`}>
        {!isCollapsed && (
          <div className="text-xs font-semibold text-stone-300 uppercase tracking-wider mb-3">
            Quick Actions
          </div>
        )}
        
        <Button
          onClick={reanalyzeAllFeedback}
          variant="outline"
          size="sm"
          className={`w-full ${isCollapsed ? 'px-2' : 'justify-start gap-3'} bg-teal-600/20 border-teal-500/30 text-stone-200 hover:bg-teal-500/30 hover:text-stone-50 hover:border-teal-400/50`}
          title={isCollapsed ? "Re-analyze project feedback" : undefined}
        >
          <ArrowPathIcon className="h-4 w-4 flex-shrink-0" />
          {!isCollapsed && <span>Re-analyze</span>}
        </Button>
        
        <Button
          onClick={exportReport}
          variant="outline"
          size="sm"
          className={`w-full ${isCollapsed ? 'px-2' : 'justify-start gap-3'} bg-teal-600/20 border-teal-500/30 text-stone-200 hover:bg-teal-500/30 hover:text-stone-50 hover:border-teal-400/50`}
          title={isCollapsed ? "Export project report" : undefined}
        >
          <DocumentArrowDownIcon className="h-4 w-4 flex-shrink-0" />
          {!isCollapsed && <span>Export Report</span>}
        </Button>
      </div>

      {/* User Section */}
      <div className={`border-t border-teal-600/30 p-4 bg-teal-800/30 ${isCollapsed ? 'px-2' : ''}`}>
        <div className={`flex items-center mb-4 ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-lg flex-shrink-0">
            <UserIcon className="h-5 w-5" />
          </div>
          
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold truncate text-stone-50">
                {user?.email || 'User'}
              </span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-xs text-stone-300">Online</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.href = '/dashboard/profile'}
            className={`w-full ${isCollapsed ? 'px-2' : 'justify-start gap-3'} bg-transparent border-stone-300/30 text-stone-200 hover:bg-stone-100/10 hover:text-stone-50 hover:border-stone-200/50`}
            title={isCollapsed ? "View Profile" : undefined}
          >
            <UserIcon className="h-4 w-4 flex-shrink-0" />
            {!isCollapsed && <span>View Profile</span>}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onSignOut}
            className={`w-full ${isCollapsed ? 'px-2' : 'justify-start gap-3'} bg-transparent border-red-400/30 text-red-200 hover:bg-red-500/20 hover:text-red-100 hover:border-red-300/50`}
            title={isCollapsed ? "Sign Out" : undefined}
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4 flex-shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </Button>
        </div>
      </div>
    </div>
  )
}