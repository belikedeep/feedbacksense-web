'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function CategoryManager({ onCategoryUpdate }) {
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    keywords: '',
    color: '#3B82F6',
    isActive: true
  })

  // Default categories that come with the system
  const defaultCategories = [
    { id: 'feature_request', name: 'Feature Request', description: 'Requests for new features or improvements', keywords: 'feature,add,request,suggestion,improve,enhancement', color: '#10B981', isActive: true, isDefault: true },
    { id: 'bug_report', name: 'Bug Report', description: 'Reports of technical issues, errors, or malfunctions', keywords: 'bug,error,broken,crash,issue,problem,not working,fails,glitch', color: '#EF4444', isActive: true, isDefault: true },
    { id: 'shipping_complaint', name: 'Shipping Complaint', description: 'Issues related to delivery, packaging, or shipping', keywords: 'delivery,shipping,arrived,package,late,delayed,damaged,lost', color: '#F59E0B', isActive: true, isDefault: true },
    { id: 'product_quality', name: 'Product Quality', description: 'Concerns about product quality, materials, or build', keywords: 'quality,material,build,durability,defective,cheap,flimsy', color: '#8B5CF6', isActive: true, isDefault: true },
    { id: 'customer_service', name: 'Customer Service', description: 'Feedback about customer support or service experience', keywords: 'service,support,staff,representative,help,rude,unhelpful,friendly', color: '#06B6D4', isActive: true, isDefault: true },
    { id: 'general_inquiry', name: 'General Inquiry', description: 'General questions or neutral feedback', keywords: 'question,inquiry,information,help,general', color: '#6B7280', isActive: true, isDefault: true },
    { id: 'refund_request', name: 'Refund Request', description: 'Requests for refunds, returns, or billing issues', keywords: 'refund,return,money back,cancel,charge,billing,payment', color: '#DC2626', isActive: true, isDefault: true },
    { id: 'compliment', name: 'Compliment', description: 'Positive feedback, praise, or compliments', keywords: 'great,excellent,amazing,love,perfect,awesome,fantastic,thank you', color: '#059669', isActive: true, isDefault: true }
  ]

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setIsLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('User not authenticated')

      // For now, we'll use localStorage to store custom categories
      // In a full implementation, you'd want to store these in the database
      const storedCategories = localStorage.getItem('feedbacksense_custom_categories')
      const customCategories = storedCategories ? JSON.parse(storedCategories) : []
      
      // Combine default and custom categories
      const allCategories = [
        ...defaultCategories,
        ...customCategories.map(cat => ({ ...cat, isDefault: false }))
      ]
      
      setCategories(allCategories)
    } catch (error) {
      console.error('Error loading categories:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveCustomCategories = (customCategories) => {
    localStorage.setItem('feedbacksense_custom_categories', JSON.stringify(customCategories))
  }

  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) {
      alert('Category name is required')
      return
    }

    try {
      setIsCreating(true)
      const customCategories = categories.filter(cat => !cat.isDefault)
      
      const categoryToAdd = {
        id: newCategory.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
        name: newCategory.name.trim(),
        description: newCategory.description.trim(),
        keywords: newCategory.keywords.trim(),
        color: newCategory.color,
        isActive: newCategory.isActive,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const updatedCustomCategories = [...customCategories, categoryToAdd]
      saveCustomCategories(updatedCustomCategories)
      
      setCategories([...defaultCategories, ...updatedCustomCategories.map(cat => ({ ...cat, isDefault: false }))])
      setNewCategory({ name: '', description: '', keywords: '', color: '#3B82F6', isActive: true })
      
      if (onCategoryUpdate) {
        onCategoryUpdate()
      }
    } catch (error) {
      console.error('Error creating category:', error)
      alert('Error creating category: ' + error.message)
    } finally {
      setIsCreating(false)
    }
  }

  const handleUpdateCategory = async (categoryId, updates) => {
    try {
      if (categories.find(cat => cat.id === categoryId)?.isDefault) {
        alert('Cannot edit default categories')
        return
      }

      const customCategories = categories.filter(cat => !cat.isDefault)
      const updatedCustomCategories = customCategories.map(cat =>
        cat.id === categoryId
          ? { ...cat, ...updates, updatedAt: new Date().toISOString() }
          : cat
      )
      
      saveCustomCategories(updatedCustomCategories)
      setCategories([...defaultCategories, ...updatedCustomCategories.map(cat => ({ ...cat, isDefault: false }))])
      setEditingCategory(null)
      
      if (onCategoryUpdate) {
        onCategoryUpdate()
      }
    } catch (error) {
      console.error('Error updating category:', error)
      alert('Error updating category: ' + error.message)
    }
  }

  const handleDeleteCategory = async (categoryId) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return
    }

    try {
      if (categories.find(cat => cat.id === categoryId)?.isDefault) {
        alert('Cannot delete default categories')
        return
      }

      const customCategories = categories.filter(cat => !cat.isDefault && cat.id !== categoryId)
      saveCustomCategories(customCategories)
      setCategories([...defaultCategories, ...customCategories.map(cat => ({ ...cat, isDefault: false }))])
      
      if (onCategoryUpdate) {
        onCategoryUpdate()
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Error deleting category: ' + error.message)
    }
  }

  const toggleCategoryActive = async (categoryId, isActive) => {
    await handleUpdateCategory(categoryId, { isActive })
  }

  const exportCategories = () => {
    const customCategories = categories.filter(cat => !cat.isDefault)
    const dataStr = JSON.stringify(customCategories, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'feedbacksense_categories.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  const importCategories = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedCategories = JSON.parse(e.target.result)
        if (!Array.isArray(importedCategories)) {
          throw new Error('Invalid file format')
        }

        const existingCustomCategories = categories.filter(cat => !cat.isDefault)
        const mergedCategories = [...existingCustomCategories]

        importedCategories.forEach(importCat => {
          if (!mergedCategories.find(cat => cat.id === importCat.id)) {
            mergedCategories.push({
              ...importCat,
              importedAt: new Date().toISOString()
            })
          }
        })

        saveCustomCategories(mergedCategories)
        setCategories([...defaultCategories, ...mergedCategories.map(cat => ({ ...cat, isDefault: false }))])
        
        if (onCategoryUpdate) {
          onCategoryUpdate()
        }
        
        alert(`Successfully imported ${importedCategories.length} categories`)
      } catch (error) {
        alert('Error importing categories: ' + error.message)
      }
    }
    reader.readAsText(file)
    event.target.value = '' // Reset input
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Category Management</h2>
          <p className="text-gray-500 mt-1">Manage custom feedback categories for AI classification</p>
        </div>
        <div className="flex items-center space-x-3">
          <input
            type="file"
            accept=".json"
            onChange={importCategories}
            className="hidden"
            id="import-categories"
          />
          <label
            htmlFor="import-categories"
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
          >
            <svg className="-ml-0.5 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            Import
          </label>
          <button
            onClick={exportCategories}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="-ml-0.5 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Create New Category */}
      <div className="bg-white rounded-lg shadow border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Category</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category Name *
            </label>
            <input
              type="text"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Website Feedback"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <input
              type="color"
              value={newCategory.color}
              onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
              className="w-full h-10 border border-gray-300 rounded-md"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={newCategory.description}
              onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Brief description of this category"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Keywords (comma-separated)
            </label>
            <input
              type="text"
              value={newCategory.keywords}
              onChange={(e) => setNewCategory({ ...newCategory, keywords: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="website,ui,interface,design,navigation"
            />
            <p className="text-xs text-gray-500 mt-1">
              Keywords help the AI identify which feedback belongs to this category
            </p>
          </div>
          <div className="md:col-span-2 flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={newCategory.isActive}
                onChange={(e) => setNewCategory({ ...newCategory, isActive: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Active (used for AI classification)</span>
            </label>
            <button
              onClick={handleCreateCategory}
              disabled={isCreating || !newCategory.name.trim()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isCreating ? 'Creating...' : 'Create Category'}
            </button>
          </div>
        </div>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-lg shadow border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            All Categories ({categories.filter(cat => cat.isActive).length} active)
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {categories.map((category) => (
            <div key={category.id} className="p-6">
              {editingCategory === category.id ? (
                <EditCategoryForm
                  category={category}
                  onSave={(updates) => handleUpdateCategory(category.id, updates)}
                  onCancel={() => setEditingCategory(null)}
                />
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: category.color }}
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-lg font-medium text-gray-900">{category.name}</h4>
                        {category.isDefault && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            Default
                          </span>
                        )}
                        {!category.isActive && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{category.description}</p>
                      {category.keywords && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {category.keywords.split(',').map((keyword, index) => (
                            <span key={index} className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                              {keyword.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={category.isActive}
                        onChange={(e) => !category.isDefault && toggleCategoryActive(category.id, e.target.checked)}
                        disabled={category.isDefault}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">Active</span>
                    </label>
                    {!category.isDefault && (
                      <>
                        <button
                          onClick={() => setEditingCategory(category.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function EditCategoryForm({ category, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: category.name,
    description: category.description,
    keywords: category.keywords,
    color: category.color,
    isActive: category.isActive
  })

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('Category name is required')
      return
    }
    onSave(formData)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Color
          </label>
          <input
            type="color"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            className="w-full h-10 border border-gray-300 rounded-md"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Keywords (comma-separated)
          </label>
          <input
            type="text"
            value={formData.keywords}
            onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">Active</span>
        </label>
        <div className="flex items-center space-x-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}