import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request, { params }) {
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

    const { id } = await params

    // First, verify the project exists and belongs to the user
    const targetProject = await prisma.project.findFirst({
      where: {
        id: id,
        userId: user.id
      }
    })

    if (!targetProject) {
      return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 404 })
    }

    // Check if project is archived
    if (targetProject.settings?.archived) {
      return NextResponse.json({ error: 'Cannot switch to an archived project' }, { status: 400 })
    }

    // Use transaction to ensure atomicity when switching default projects
    const updatedProject = await prisma.$transaction(async (prisma) => {
      // First, unset any existing default project for this user
      await prisma.project.updateMany({
        where: {
          userId: user.id,
          isDefault: true,
          id: { not: id }
        },
        data: {
          isDefault: false
        }
      })

      // Set the target project as default (current project)
      const updated = await prisma.project.update({
        where: {
          id: id,
          userId: user.id
        },
        data: {
          isDefault: true
        },
        include: {
          _count: {
            select: {
              feedback: true,
              categories: true,
              exportHistory: true,
              exportTemplates: true
            }
          }
        }
      })

      // Log the project switch activity
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'project_switch',
          details: {
            projectId: id,
            projectName: updated.name,
            timestamp: new Date().toISOString()
          },
          ipAddress: request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      }).catch(logError => {
        // Don't fail the request if logging fails
        console.error('Failed to log project switch activity:', logError)
      })

      return updated
    })

    return NextResponse.json({
      message: 'Successfully switched to project',
      project: updatedProject
    })
  } catch (error) {
    console.error('Error switching project:', error)
    
    // Handle record not found errors
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 404 })
    }

    return NextResponse.json({
      error: 'Failed to switch project',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}