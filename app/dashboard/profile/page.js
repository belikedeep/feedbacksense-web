'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import UserProfile from '@/components/UserProfile'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ArrowLeft, 
  Settings, 
  BarChart3, 
  Plus, 
  FileUp, 
  List, 
  HelpCircle,
  Download,
  Activity
} from 'lucide-react'

export default function ProfilePage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    getUser()
  }, [])

  const getUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        console.error('Error getting user:', error)
        router.push('/login')
        return
      }

      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)
    } catch (error) {
      console.error('Error:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex items-center justify-center min-h-screen">
          <Card className="w-96">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-muted-foreground">Loading your profile...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  const quickActions = [
    {
      icon: Settings,
      title: 'Account Settings',
      description: 'Password & security',
      href: '/dashboard/settings',
      color: 'blue'
    },
    {
      icon: BarChart3,
      title: 'View Analytics',
      description: 'Dashboard insights',
      href: '/dashboard',
      color: 'green'
    },
    {
      icon: Plus,
      title: 'Add Feedback',
      description: 'Create new entry',
      href: '/dashboard?tab=add-feedback',
      color: 'purple'
    },
    {
      icon: FileUp,
      title: 'Import Data',
      description: 'Bulk CSV import',
      href: '/dashboard?tab=import-csv',
      color: 'orange'
    },
    {
      icon: List,
      title: 'All Feedback',
      description: 'Browse entries',
      href: '/dashboard?tab=feedback-list',
      color: 'indigo'
    },
    {
      icon: Download,
      title: 'Export Data',
      description: 'Download reports',
      href: '#',
      color: 'teal'
    }
  ]

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700',
      green: 'bg-green-50 border-green-200 hover:bg-green-100 text-green-700',
      purple: 'bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-700',
      orange: 'bg-orange-50 border-orange-200 hover:bg-orange-100 text-orange-700',
      indigo: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100 text-indigo-700',
      teal: 'bg-teal-50 border-teal-200 hover:bg-teal-100 text-teal-700'
    }
    return colors[color] || colors.blue
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Modern Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center shadow-lg">
                <span className="text-xl">👤</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  My Profile
                </h1>
                <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard')}
              className="gap-2 hover:bg-slate-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="border-b bg-white/50">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="h-auto p-0 text-muted-foreground hover:text-foreground"
            >
              Dashboard
            </Button>
            <span>/</span>
            <span className="text-foreground font-medium">Profile</span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Profile Information */}
          <UserProfile user={user} />

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Jump to commonly used features and settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {quickActions.map((action, index) => {
                  const Icon = action.icon
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      onClick={() => router.push(action.href)}
                      className={`h-auto p-6 flex flex-col items-start gap-3 transition-all duration-200 hover:scale-105 hover:shadow-md ${getColorClasses(action.color)}`}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="h-12 w-12 rounded-xl bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm">
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="text-left flex-1">
                          <div className="font-semibold text-base">{action.title}</div>
                          <div className="text-sm opacity-80">{action.description}</div>
                        </div>
                      </div>
                    </Button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Help & Support */}
          <Card className="border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Need Help?
              </CardTitle>
              <CardDescription>
                Get support or learn more about FeedbackSense
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col gap-2 hover:bg-blue-50 hover:border-blue-200"
                >
                  <div className="text-2xl">📚</div>
                  <div className="font-medium">Documentation</div>
                  <div className="text-xs text-muted-foreground">Learn how to use all features</div>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col gap-2 hover:bg-green-50 hover:border-green-200"
                >
                  <div className="text-2xl">💬</div>
                  <div className="font-medium">Contact Support</div>
                  <div className="text-xs text-muted-foreground">Get help from our team</div>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col gap-2 hover:bg-purple-50 hover:border-purple-200"
                >
                  <div className="text-2xl">🎯</div>
                  <div className="font-medium">Feature Requests</div>
                  <div className="text-xs text-muted-foreground">Suggest improvements</div>
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  )
}