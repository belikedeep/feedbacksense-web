'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  BuildingOfficeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

const BUSINESS_TYPES = [
  { value: 'e-commerce', label: 'E-commerce', icon: '🛒', description: 'Online retail and marketplace' },
  { value: 'saas', label: 'SaaS', icon: '💻', description: 'Software as a Service' },
  { value: 'healthcare', label: 'Healthcare', icon: '🏥', description: 'Medical and health services' },
  { value: 'education', label: 'Education', icon: '🎓', description: 'Educational institutions and e-learning' },
  { value: 'finance', label: 'Finance', icon: '💰', description: 'Financial services and fintech' },
  { value: 'real_estate', label: 'Real Estate', icon: '🏠', description: 'Property and real estate services' },
  { value: 'food_beverage', label: 'Food & Beverage', icon: '🍽️', description: 'Restaurants and food services' },
  { value: 'retail', label: 'Retail', icon: '🏪', description: 'Physical retail and stores' },
  { value: 'consulting', label: 'Consulting', icon: '💼', description: 'Professional services and consulting' },
  { value: 'manufacturing', label: 'Manufacturing', icon: '🏭', description: 'Manufacturing and production' },
  { value: 'other', label: 'Other', icon: '🏢', description: 'Other business types' }
]

export default function CreateProjectModal({ 
  isOpen, 
  onClose, 
  onProjectCreated 
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    businessType: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})

  const validateForm = () => {
    const errors = {}
    
    if (!formData.name.trim()) {
      errors.name = 'Project name is required'
    } else if (formData.name.trim().length < 3) {
      errors.name = 'Project name must be at least 3 characters'
    } else if (formData.name.trim().length > 100) {
      errors.name = 'Project name must be less than 100 characters'
    }

    if (formData.description && formData.description.length > 500) {
      errors.description = 'Description must be less than 500 characters'
    }

    if (!formData.businessType) {
      errors.businessType = 'Business type is required'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: null
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No session found')
      }

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          businessType: formData.businessType
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create project')
      }

      const newProject = await response.json()
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        businessType: ''
      })
      
      // Call success callback
      if (onProjectCreated) {
        onProjectCreated(newProject)
      }
      
      // Close modal
      onClose()
    } catch (error) {
      console.error('Error creating project:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setFormData({
        name: '',
        description: '',
        businessType: ''
      })
      setError(null)
      setValidationErrors({})
      onClose()
    }
  }

  const selectedBusinessType = BUSINESS_TYPES.find(type => type.value === formData.businessType)

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-teal-100 to-teal-200 rounded-lg">
              <BuildingOfficeIcon className="h-5 w-5 text-teal-700" />
            </div>
            Create New Project
          </DialogTitle>
          <DialogDescription>
            Set up a new project to organize your feedback and analytics. Choose the business type that best matches your project.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Alert */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="project-name" className="text-base font-medium">
              Project Name *
            </Label>
            <Input
              id="project-name"
              type="text"
              placeholder="Enter your project name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={validationErrors.name ? 'border-red-300 focus:border-red-500' : ''}
              disabled={loading}
              maxLength={100}
            />
            {validationErrors.name && (
              <p className="text-sm text-red-600">{validationErrors.name}</p>
            )}
            <p className="text-xs text-gray-500">
              {formData.name.length}/100 characters
            </p>
          </div>

          {/* Project Description */}
          <div className="space-y-2">
            <Label htmlFor="project-description" className="text-base font-medium">
              Description
            </Label>
            <Textarea
              id="project-description"
              placeholder="Describe your project (optional)"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={validationErrors.description ? 'border-red-300 focus:border-red-500' : ''}
              disabled={loading}
              rows={3}
              maxLength={500}
            />
            {validationErrors.description && (
              <p className="text-sm text-red-600">{validationErrors.description}</p>
            )}
            <p className="text-xs text-gray-500">
              {formData.description.length}/500 characters
            </p>
          </div>

          <Separator />

          {/* Business Type Selection */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Business Type *</Label>
              <p className="text-sm text-gray-600 mt-1">
                Select the type that best describes your business or project
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {BUSINESS_TYPES.map((type) => (
                <Card
                  key={type.value}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    formData.businessType === type.value
                      ? 'ring-2 ring-teal-500 bg-teal-50 border-teal-200'
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => handleInputChange('businessType', type.value)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl flex-shrink-0">{type.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">{type.label}</h4>
                          {formData.businessType === type.value && (
                            <CheckCircleIcon className="h-5 w-5 text-teal-600 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {validationErrors.businessType && (
              <p className="text-sm text-red-600">{validationErrors.businessType}</p>
            )}
          </div>

          {/* Selected Business Type Preview */}
          {selectedBusinessType && (
            <Card className="bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{selectedBusinessType.icon}</div>
                  <div>
                    <p className="font-medium text-teal-900">
                      Selected: {selectedBusinessType.label}
                    </p>
                    <p className="text-sm text-teal-700">
                      {selectedBusinessType.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </form>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={loading || !formData.name.trim() || !formData.businessType}
            className="gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creating...
              </>
            ) : (
              <>
                <BuildingOfficeIcon className="h-4 w-4" />
                Create Project
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}