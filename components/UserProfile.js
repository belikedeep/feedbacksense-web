'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  User, 
  Mail, 
  Phone, 
  Save, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  Calendar,
  Shield,
  Edit,
  Camera
} from 'lucide-react'

export default function UserProfile({ user }) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')
  const [profile, setProfile] = useState({
    name: '',
    phone: ''
  })

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      
      // Get the session token
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No session found')
      }
      
      // Fetch profile via API route
      const response = await fetch('/api/auth/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }

      const data = await response.json()
      
      setProfile({
        name: data.name || '',
        phone: data.phone || ''
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
      setMessage('Error loading profile data')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (e) => {
    e.preventDefault()
    
    try {
      setSaving(true)
      setMessage('')

      // Get the session token
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No session found')
      }

      // Update profile via API route
      const response = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update profile')
      }

      setMessage('Profile updated successfully!')
      setMessageType('success')

      // Log activity
      await logActivity('profile_updated', {
        fields_updated: ['name', 'phone']
      })

    } catch (error) {
      console.error('Error updating profile:', error)
      setMessage('Error updating profile: ' + error.message)
      setMessageType('error')
    } finally {
      setSaving(false)
    }
  }

  const logActivity = async (action, details) => {
    try {
      await fetch('/api/auth/activity-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, details })
      })
    } catch (error) {
      console.error('Error logging activity:', error)
    }
  }

  const handleInputChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }))
    setMessage('') // Clear any existing messages
  }

  const getInitials = (email) => {
    return email?.split('@')[0]?.slice(0, 2)?.toUpperCase() || 'U'
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading your profile...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-slate-200 bg-gradient-to-br from-white to-slate-50/50 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Profile Information
        </CardTitle>
        <CardDescription>
          Update your account information and personal details
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={updateProfile} className="space-y-6">
          
          {/* Profile Picture & Basic Info */}
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
                  <AvatarImage src="" alt={user?.email} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-xl">
                    {getInitials(user?.email)}
                  </AvatarFallback>
                </Avatar>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 bg-white shadow-lg hover:shadow-xl"
                  disabled
                >
                  <Camera className="h-3 w-3" />
                </Button>
              </div>
              <Badge variant="outline" className="text-xs">
                Photo upload coming soon
              </Badge>
            </div>

            <div className="flex-1 space-y-4">
              {/* Account Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg bg-blue-50/50 border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Account Status</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-200">
                      ✅ Verified
                    </Badge>
                    <Badge variant="outline">Premium</Badge>
                  </div>
                </div>

                <div className="p-4 border rounded-lg bg-slate-50/50 border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-slate-600" />
                    <span className="text-sm font-medium text-slate-900">Member Since</span>
                  </div>
                  <p className="text-sm font-medium">
                    {new Date(user?.created_at).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric' 
                    })}
                  </p>
                </div>
              </div>

              {/* Account ID */}
              <div className="p-3 bg-muted/50 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs text-muted-foreground">Account ID</Label>
                    <div className="font-mono text-sm">{user?.id?.slice(0, 8)}...{user?.id?.slice(-4)}</div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {user?.id?.length} chars
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Full Name
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                type="text"
                value={profile.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter your full name"
                required
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-xs text-muted-foreground">
                This will be displayed as your public name
              </p>
            </div>

            {/* Phone Field */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number
                <Badge variant="secondary" className="ml-auto text-xs">
                  Optional
                </Badge>
              </Label>
              <Input
                id="phone"
                type="tel"
                value={profile.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter your phone number"
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-xs text-muted-foreground">
                Used for account recovery and important notifications
              </p>
            </div>
          </div>

          {/* Email Display (Read-only) */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Address
              <Badge className="ml-auto text-xs bg-green-100 text-green-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            </Label>
            <div className="relative">
              <Input
                type="email"
                value={user?.email || ''}
                readOnly
                className="bg-muted/50 text-muted-foreground cursor-not-allowed pr-10"
              />
              <Shield className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">
              Email address is managed by your authentication provider and cannot be changed here
            </p>
          </div>

          {/* Message Display */}
          {message && (
            <Alert className={messageType === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
              <div className="flex items-center gap-2">
                {messageType === 'error' ? (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
                <AlertDescription className={messageType === 'error' ? 'text-red-700' : 'text-green-700'}>
                  {message}
                </AlertDescription>
              </div>
            </Alert>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={fetchProfile}
              className="gap-2"
              disabled={loading || saving}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Reset Changes
            </Button>
            <Button
              type="submit"
              disabled={saving || loading}
              className="gap-2 min-w-32"
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>

          {/* Profile Completion */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Edit className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 mb-2">Profile Completion</p>
                <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(profile.name ? 50 : 0) + (profile.phone ? 30 : 0) + 20}%` }}
                  ></div>
                </div>
                <p className="text-sm text-blue-700">
                  {profile.name && profile.phone 
                    ? '🎉 Your profile is complete!' 
                    : 'Complete your profile to unlock all features'
                  }
                </p>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}