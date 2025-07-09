'use client'

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
  Bars3Icon
} from '@heroicons/react/24/outline'

export default function Sidebar({
  user,
  onSignOut,
  activeTab,
  setActiveTab,
  feedback,
  reanalyzeAllFeedback,
  currentProject,
  onProjectChange,
  onCreateProject
}) {
  const { 
    isCollapsed, 
    isMobileOpen, 
    breakpoint, 
    toggleCollapse, 
    closeMobileDrawer, 
    getSidebarWidth,
    isDesktop,
    isMobileOrTablet,
    showOverlay
  } = useSidebar()

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Analytics Dashboard',
      icon: AnalyticsIcon,
      description: 'Comprehensive insights'
    },
    {
      id: 'add-feedback',
      label: 'Add Feedback',
      icon: PlusIcon,
      description: 'Create new entry'
    },
    {
      id: 'import-csv',
      label: 'Import Data',
      icon: DocumentArrowUpIcon,
      description: 'Bulk import CSV'
    },
    {
      id: 'feedback-list',
      label: 'All Feedback',
      icon: DocumentTextIcon,
      description: 'View all entries'
    },
    {
      id: 'category-analytics',
      label: 'Category Insights',
      icon: ChartBarIcon,
      description: 'Deep category analysis'
    },
    {
      id: 'ai-performance',
      label: 'AI Performance',
      icon: AIIcon,
      description: 'AI metrics & accuracy'
    },
  ]

  const handleSignOut = async () => {
    if (onSignOut) {
      onSignOut()
    }
  }

  const handleNavItemClick = (itemId) => {
    setActiveTab(itemId)
    if (isMobileOrTablet) {
      closeMobileDrawer()
    }
  }

  const exportReport = () => {
    const csvData = feedback.map(f => ({
      content: f.content,
      category: f.category,
      aiConfidence: f.aiCategoryConfidence ? Math.round(f.aiCategoryConfidence * 100) + '%' : 'N/A',
      manualOverride: f.manualOverride ? 'Yes' : 'No',
      sentiment: f.sentimentLabel || f.sentiment_label,
      source: f.source,
      date: f.feedbackDate || f.feedback_date
    }))
    const csv = 'data:text/csv;charset=utf-8,' + encodeURIComponent(
      'Content,Category,AI Confidence,Manual Override,Sentiment,Source,Date\n' +
      csvData.map(row => Object.values(row).map(val => `"${val}"`).join(',')).join('\n')
    )
    const link = document.createElement('a')
    link.href = csv
    link.download = 'feedback-category-report.csv'
    link.click()
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
            activeTab={activeTab}
            handleNavItemClick={handleNavItemClick}
            reanalyzeAllFeedback={reanalyzeAllFeedback}
            exportReport={exportReport}
            user={user}
            handleSignOut={handleSignOut}
            showCloseButton={true}
            closeMobileDrawer={closeMobileDrawer}
            toggleCollapse={toggleCollapse}
            currentProject={currentProject}
            onProjectChange={onProjectChange}
            onCreateProject={onCreateProject}
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
        activeTab={activeTab}
        handleNavItemClick={handleNavItemClick}
        reanalyzeAllFeedback={reanalyzeAllFeedback}
        exportReport={exportReport}
        user={user}
        handleSignOut={handleSignOut}
        showCloseButton={false}
        closeMobileDrawer={closeMobileDrawer}
        toggleCollapse={toggleCollapse}
        currentProject={currentProject}
        onProjectChange={onProjectChange}
        onCreateProject={onCreateProject}
      />
    </aside>
  )
}

function SidebarContent({
  isCollapsed,
  navigationItems,
  activeTab,
  handleNavItemClick,
  reanalyzeAllFeedback,
  exportReport,
  user,
  handleSignOut,
  showCloseButton,
  closeMobileDrawer,
  toggleCollapse,
  currentProject,
  onProjectChange,
  onCreateProject
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={`flex items-center border-b border-teal-600/30 px-6 py-6 relative ${
        isCollapsed ? 'justify-center' : 'gap-3'
      }`}>
        {showCloseButton && (
          <button
            onClick={closeMobileDrawer}
            className="absolute top-4 right-4 p-2 text-stone-300 hover:text-stone-50 hover:bg-teal-600/30 rounded-lg transition-colors z-10"
            aria-label="Close sidebar"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
        
        <BrandLogo className="w-10 h-10 text-stone-100 flex-shrink-0" />
        
        {!isCollapsed && (
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight text-stone-50">FeedbackSense</h1>
            <Badge className="w-fit text-xs bg-amber-500/20 text-amber-200 border-amber-400/30 hover:bg-amber-500/30">
              v2.0 AI-Powered
            </Badge>
          </div>
        )}
        
        {!showCloseButton && (
          <button
            onClick={toggleCollapse}
            className={`p-2 text-stone-300 hover:text-stone-50 hover:bg-teal-600/30 rounded-lg transition-colors ${
              isCollapsed ? 'ml-0' : 'ml-auto'
            }`}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Bars3Icon className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Project Selector */}
      <ProjectSelectorSidebar
        currentProject={currentProject}
        onProjectChange={onProjectChange}
        onCreateProject={onCreateProject}
        isCollapsed={isCollapsed}
      />

      {/* Navigation */}
      <nav className="space-y-2 p-4 flex-1 overflow-y-auto">
        {!isCollapsed && (
          <div className="text-xs font-semibold text-stone-300 uppercase tracking-wider mb-4">
            Main Navigation
          </div>
        )}
        
        {navigationItems.map((item) => {
          const IconComponent = item.icon
          const isActive = activeTab === item.id
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavItemClick(item.id)}
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
          title={isCollapsed ? "Re-analyze all feedback with AI categorization" : undefined}
        >
          <AIIcon className="h-4 w-4 flex-shrink-0" />
          {!isCollapsed && <span>Re-analyze All</span>}
        </Button>
        
        <Button
          onClick={exportReport}
          variant="outline"
          size="sm"
          className={`w-full ${isCollapsed ? 'px-2' : 'justify-start gap-3'} bg-teal-600/20 border-teal-500/30 text-stone-200 hover:bg-teal-500/30 hover:text-stone-50 hover:border-teal-400/50`}
          title={isCollapsed ? "Export category analysis report" : undefined}
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
            onClick={handleSignOut}
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