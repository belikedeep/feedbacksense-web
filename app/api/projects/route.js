import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
    }

    // Verify the JWT token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get projects for the authenticated user with retry logic
    let projects
    let retryCount = 0
    const maxRetries = 3
    
    while (retryCount < maxRetries) {
      try {
        projects = await prisma.project.findMany({
          where: {
            userId: user.id
          },
          include: {
            _count: {
              select: {
                feedback: true,
                categories: true
              }
            }
          },
          orderBy: [
            { isDefault: 'desc' },
            { createdAt: 'desc' }
          ]
        })
        break
      } catch (dbError) {
        retryCount++
        console.error(`Database error (attempt ${retryCount}):`, dbError)
        
        if (retryCount >= maxRetries) {
          // Check if it's a connection error
          if (dbError.code === 'P1001' || dbError.message?.includes("Can't reach database server")) {
            return NextResponse.json({
              error: 'Database connection failed. Please check your database connection and try again.',
              details: 'Unable to connect to database server'
            }, { status: 503 })
          }
          throw dbError
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000))
      }
    }

    return NextResponse.json(projects || [])
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json({
      error: 'Failed to fetch projects',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
    }

    // Verify the JWT token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
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

    const { name, description, settings, isDefault } = body

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 })
    }

    // Check if project name already exists for this user
    const existingProject = await prisma.project.findFirst({
      where: {
        userId: user.id,
        name: name.trim()
      }
    })

    if (existingProject) {
      return NextResponse.json({ error: 'Project with this name already exists' }, { status: 409 })
    }

    // Ensure user profile exists with retry logic
    let existingProfile
    let retryCount = 0
    const maxRetries = 3
    
    while (retryCount < maxRetries) {
      try {
        existingProfile = await prisma.profile.findUnique({
          where: { id: user.id }
        })
        break
      } catch (dbError) {
        retryCount++
        console.error(`Database error checking profile (attempt ${retryCount}):`, dbError)
        
        if (retryCount >= maxRetries) {
          if (dbError.code === 'P1001' || dbError.message?.includes("Can't reach database server")) {
            return NextResponse.json({
              error: 'Database connection failed. Please check your database connection and try again.',
              details: 'Unable to connect to database server'
            }, { status: 503 })
          }
          throw dbError
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000))
      }
    }

    if (!existingProfile) {
      try {
        // Create profile if it doesn't exist
        await prisma.profile.create({
          data: {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            preferences: {},
            timezone: 'UTC'
          }
        })
      } catch (profileError) {
        console.error('Error creating profile:', profileError)
        return NextResponse.json({
          error: 'Failed to create user profile. Please try again.',
          details: process.env.NODE_ENV === 'development' ? profileError.message : undefined
        }, { status: 500 })
      }
    }

    // Handle default project logic
    let newProject
    if (isDefault) {
      // Use transaction to ensure atomicity
      newProject = await prisma.$transaction(async (prisma) => {
        // First, unset any existing default project for this user
        await prisma.project.updateMany({
          where: {
            userId: user.id,
            isDefault: true
          },
          data: {
            isDefault: false
          }
        })

        // Create the new project as default
        return await prisma.project.create({
          data: {
            userId: user.id,
            name: name.trim(),
            description: description?.trim() || null,
            settings: settings || {},
            isDefault: true
          },
          include: {
            _count: {
              select: {
                feedback: true,
                categories: true
              }
            }
          }
        })
      })
    } else {
      // Check if this is the user's first project - if so, make it default
      const projectCount = await prisma.project.count({
        where: { userId: user.id }
      })

      // Create new project with retry logic
      retryCount = 0
      
      while (retryCount < maxRetries) {
        try {
          newProject = await prisma.project.create({
            data: {
              userId: user.id,
              name: name.trim(),
              description: description?.trim() || null,
              settings: settings || {},
              isDefault: projectCount === 0 // Make it default if it's the first project
            },
            include: {
              _count: {
                select: {
                  feedback: true,
                  categories: true
                }
              }
            }
          })
          break
        } catch (dbError) {
          retryCount++
          console.error(`Database error creating project (attempt ${retryCount}):`, dbError)
          
          if (retryCount >= maxRetries) {
            if (dbError.code === 'P1001' || dbError.message?.includes("Can't reach database server")) {
              return NextResponse.json({
                error: 'Database connection failed. Please check your database connection and try again.',
                details: 'Unable to connect to database server'
              }, { status: 503 })
            }
            throw dbError
          }
          
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000))
        }
      }
    }

    return NextResponse.json(newProject)
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json({
      error: 'Failed to create project',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}