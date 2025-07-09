import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { supabase } from '@/lib/supabase/client'

// GET - Fetch user profile
export async function GET(request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
    }

    // Extract the token
    const token = authHeader.replace('Bearer ', '')
    
    // Verify the token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check if profile already exists
    const existingProfile = await prisma.profile.findUnique({
      where: { id: user.id }
    })

    if (existingProfile) {
      return NextResponse.json(existingProfile)
    }

    // Create new profile if doesn't exist
    const newProfile = await prisma.profile.create({
      data: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        phone: null,
        preferences: {},
        timezone: 'UTC'
      }
    })

    return NextResponse.json(newProfile)
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

// POST - Update user profile
export async function POST(request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
    }

    // Extract the token
    const token = authHeader.replace('Bearer ', '')
    
    // Verify the token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Safely parse JSON with error handling
    let body = {}
    try {
      const contentType = request.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const text = await request.text()
        if (text.trim()) {
          body = JSON.parse(text)
        }
      }
    } catch (parseError) {
      console.error('JSON parsing error:', parseError)
      return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 })
    }
    
    const { name, phone, preferences, timezone } = body

    // Update or create profile
    const profile = await prisma.profile.upsert({
      where: { id: user.id },
      update: {
        name: name || undefined,
        phone: phone || undefined,
        preferences: preferences || undefined,
        timezone: timezone || undefined,
        updatedAt: new Date()
      },
      create: {
        id: user.id,
        email: user.email,
        name: name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        phone: phone || null,
        preferences: preferences || {},
        timezone: timezone || 'UTC'
      }
    })

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}