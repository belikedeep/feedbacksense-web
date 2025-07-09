'use client'

import { useSidebar } from '@/contexts/SidebarContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import BrandLogo from '@/components/icons/BrandLogo'
import {
  Bars3Icon
} from '@heroicons/react/24/outline'

export default function MobileHeader({ user }) {
  const { 
    isMobileOrTablet, 
    openMobileDrawer 
  } = useSidebar()

  // Only show on mobile/tablet
  if (!isMobileOrTablet) {
    return null
  }

  return (
    <header className="sticky top-0 z-30 bg-gradient-to-r from-teal-900 to-teal-800 shadow-lg border-b border-teal-600/30">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Hamburger Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={openMobileDrawer}
          className="p-2 text-stone-200 hover:text-stone-50 hover:bg-teal-700/50"
          aria-label="Open navigation menu"
        >
          <Bars3Icon className="h-6 w-6" />
        </Button>

        {/* Brand Logo and Title */}
        <div className="flex items-center gap-3">
          <BrandLogo className="w-8 h-8 text-stone-100" />
          <div className="flex flex-col">
            <h1 className="text-lg font-bold tracking-tight text-stone-50">FeedbackSense</h1>
            <Badge className="w-fit text-xs bg-amber-500/20 text-amber-200 border-amber-400/30">
              v2.0 AI-Powered
            </Badge>
          </div>
        </div>

        {/* User Avatar (Optional) */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-white text-sm font-semibold shadow-lg">
          {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
        </div>
      </div>
    </header>
  )
}