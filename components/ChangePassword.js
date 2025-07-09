'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Key,
  Save
} from 'lucide-react'

export default function ChangePassword() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  })
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: [],
    checks: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false
    }
  })

  const evaluatePasswordStrength = (password) => {
    let score = 0
    const feedback = []
    const checks = {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false
    }

    if (password.length === 0) {
      return { score: 0, feedback: [], checks }
    }

    // Length check
    if (password.length >= 8) {
      score += 1
      checks.length = true
    } else {
      feedback.push('Use at least 8 characters')
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
      score += 1
      checks.uppercase = true
    } else {
      feedback.push('Include uppercase letters')
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
      score += 1
      checks.lowercase = true
    } else {
      feedback.push('Include lowercase letters')
    }

    // Number check
    if (/\d/.test(password)) {
      score += 1
      checks.number = true
    } else {
      feedback.push('Include numbers')
    }

    // Special character check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1
      checks.special = true
    } else {
      feedback.push('Include special characters')
    }

    return { score, feedback, checks }
  }

  const handlePasswordChange = (field, value) => {
    setPasswords(prev => ({ ...prev, [field]: value }))
    
    if (field === 'new') {
      setPasswordStrength(evaluatePasswordStrength(value))
    }
    
    setMessage('') // Clear any existing messages
  }

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const getStrengthColor = (score) => {
    if (score < 2) return 'bg-red-500'
    if (score < 4) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStrengthText = (score) => {
    if (score < 2) return 'Weak'
    if (score < 4) return 'Medium'
    return 'Strong'
  }

  const getStrengthTextColor = (score) => {
    if (score < 2) return 'text-red-600'
    if (score < 4) return 'text-yellow-600'
    return 'text-green-600'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (passwords.new !== passwords.confirm) {
      setMessage('New passwords do not match')
      setMessageType('error')
      return
    }

    if (passwordStrength.score < 3) {
      setMessage('Please choose a stronger password')
      setMessageType('error')
      return
    }

    try {
      setLoading(true)
      setMessage('')

      // Update password using Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: passwords.new
      })

      if (error) throw error

      // Log activity
      await logActivity('password_changed', { 
        timestamp: new Date().toISOString(),
        strength_score: passwordStrength.score
      })

      setMessage('Password updated successfully!')
      setMessageType('success')
      
      // Clear form
      setPasswords({ current: '', new: '', confirm: '' })
      setPasswordStrength({ score: 0, feedback: [], checks: {} })

    } catch (error) {
      console.error('Error updating password:', error)
      setMessage('Error updating password: ' + error.message)
      setMessageType('error')
    } finally {
      setLoading(false)
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

  const passwordChecks = [
    { key: 'length', label: 'At least 8 characters', icon: '8+' },
    { key: 'uppercase', label: 'Uppercase letter', icon: 'A' },
    { key: 'lowercase', label: 'Lowercase letter', icon: 'a' },
    { key: 'number', label: 'Number', icon: '1' },
    { key: 'special', label: 'Special character', icon: '@' }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Change Password
        </CardTitle>
        <CardDescription>
          Ensure your account is using a strong, secure password
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="current-password" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Current Password
            </Label>
            <div className="relative">
              <Input
                type={showPasswords.current ? 'text' : 'password'}
                id="current-password"
                value={passwords.current}
                onChange={(e) => handlePasswordChange('current', e.target.value)}
                placeholder="Enter your current password"
                className="pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('current')}
              >
                {showPasswords.current ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Separator />

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="new-password" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              New Password
            </Label>
            <div className="relative">
              <Input
                type={showPasswords.new ? 'text' : 'password'}
                id="new-password"
                value={passwords.new}
                onChange={(e) => handlePasswordChange('new', e.target.value)}
                placeholder="Enter your new password"
                className="pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('new')}
              >
                {showPasswords.new ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Password Strength Indicator */}
            {passwords.new && (
              <div className="space-y-3 mt-4 p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Password strength:</span>
                  <Badge variant="outline" className={`${getStrengthTextColor(passwordStrength.score)} border-current`}>
                    {getStrengthText(passwordStrength.score)}
                  </Badge>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(passwordStrength.score)}`}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  ></div>
                </div>

                {/* Password Requirements Checklist */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Requirements:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {passwordChecks.map((check) => {
                      const isValid = passwordStrength.checks[check.key]
                      return (
                        <div key={check.key} className="flex items-center gap-2 text-sm">
                          {isValid ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-400" />
                          )}
                          <span className={`flex items-center gap-1 ${isValid ? 'text-green-600' : 'text-muted-foreground'}`}>
                            <span className="font-mono text-xs bg-muted px-1 rounded">{check.icon}</span>
                            {check.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Confirm New Password */}
          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Confirm New Password
            </Label>
            <div className="relative">
              <Input
                type={showPasswords.confirm ? 'text' : 'password'}
                id="confirm-password"
                value={passwords.confirm}
                onChange={(e) => handlePasswordChange('confirm', e.target.value)}
                placeholder="Confirm your new password"
                className="pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('confirm')}
              >
                {showPasswords.confirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {passwords.confirm && passwords.new !== passwords.confirm && (
              <div className="flex items-center gap-2 mt-2 text-red-600">
                <XCircle className="h-4 w-4" />
                <span className="text-sm">Passwords do not match</span>
              </div>
            )}
            {passwords.confirm && passwords.new === passwords.confirm && passwords.confirm.length > 0 && (
              <div className="flex items-center gap-2 mt-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Passwords match</span>
              </div>
            )}
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
              onClick={() => {
                setPasswords({ current: '', new: '', confirm: '' })
                setPasswordStrength({ score: 0, feedback: [], checks: {} })
                setMessage('')
              }}
              className="gap-2"
            >
              <XCircle className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || passwords.new !== passwords.confirm || passwordStrength.score < 3}
              className="gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Update Password
                </>
              )}
            </Button>
          </div>

          {/* Security Tips */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900 mb-2">Security Tips</p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Use a unique password that you don't use anywhere else</li>
                  <li>• Consider using a password manager to generate and store strong passwords</li>
                  <li>• Enable two-factor authentication for additional security</li>
                  <li>• Avoid using personal information in your password</li>
                </ul>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}