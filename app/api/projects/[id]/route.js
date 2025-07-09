import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request, { params }) {
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

    // Get specific project (only if it belongs to the user)
    const project = await prisma.project.findFirst({
      where: {
        id: id,
        userId: user.id
      },
      include: {
        _count: {
          select: {
            feedback: true,
            categories: true
          }
        },
        feedback: {
          take: 5, // Get latest 5 feedback items for preview
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            content: true,
            category: true,
            sentimentLabel: true,
            createdAt: true,
            status: true
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 404 })
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json({
      error: 'Failed to fetch project',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
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
    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      return NextResponse.json({ error: 'Project name cannot be empty' }, { status: 400 })
    }

    // First, get the existing project to check current state
    const existingProject = await prisma.project.findFirst({
      where: {
        id: id,
        userId: user.id
      }
    })

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 404 })
    }

    // Check if new name conflicts with existing project
    if (name && name.trim() !== existingProject.name) {
      const nameConflict = await prisma.project.findFirst({
        where: {
          userId: user.id,
          name: name.trim(),
          id: { not: id }
        }
      })

      if (nameConflict) {
        return NextResponse.json({ error: 'Project with this name already exists' }, { status: 409 })
      }
    }

    // Prepare update data
    const updateData = {
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(settings !== undefined && { settings: settings || {} })
    }

    let updatedProject

    // Handle default project logic
    if (isDefault !== undefined) {
      if (isDefault) {
        // Use transaction to ensure atomicity
        updatedProject = await prisma.$transaction(async (prisma) => {
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

          // Update this project as default
          const updated = await prisma.project.update({
            where: {
              id: id,
              userId: user.id
            },
            data: {
              ...updateData,
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

          return updated
        })
      } else {
        // Cannot unset default if this is the only project or if it's currently default
        // Check if there are other projects
        const otherProjects = await prisma.project.count({
          where: {
            userId: user.id,
            id: { not: id }
          }
        })

        if (existingProject.isDefault && otherProjects === 0) {
          return NextResponse.json({ 
            error: 'Cannot unset default project. You must have at least one default project.' 
          }, { status: 400 })
        }

        // If unsetting default, make sure another project becomes default
        if (existingProject.isDefault && otherProjects > 0) {
          updatedProject = await prisma.$transaction(async (prisma) => {
            // Find another project to make default
            const nextDefault = await prisma.project.findFirst({
              where: {
                userId: user.id,
                id: { not: id }
              },
              orderBy: { createdAt: 'asc' }
            })

            if (nextDefault) {
              // Set another project as default
              await prisma.project.update({
                where: { id: nextDefault.id },
                data: { isDefault: true }
              })
            }

            // Update current project
            return await prisma.project.update({
              where: {
                id: id,
                userId: user.id
              },
              data: {
                ...updateData,
                isDefault: false
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
          })
        } else {
          // Just update normally
          updatedProject = await prisma.project.update({
            where: {
              id: id,
              userId: user.id
            },
            data: {
              ...updateData,
              isDefault: false
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
        }
      }
    } else {
      // Regular update without changing default status
      updatedProject = await prisma.project.update({
        where: {
          id: id,
          userId: user.id
        },
        data: updateData,
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
    }

    return NextResponse.json(updatedProject)
  } catch (error) {
    console.error('Error updating project:', error)
    
    // Handle Prisma unique constraint errors
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Project with this name already exists' }, { status: 409 })
    }
    
    // Handle record not found errors
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 404 })
    }

    return NextResponse.json({
      error: 'Failed to update project',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
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

    // Get URL search params to check for archive flag
    const url = new URL(request.url)
    const archive = url.searchParams.get('archive') === 'true'

    // First, get the existing project to check current state
    const existingProject = await prisma.project.findFirst({
      where: {
        id: id,
        userId: user.id
      }
    })

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 404 })
    }

    // Check if this is the only project or the default project
    const projectCount = await prisma.project.count({
      where: { userId: user.id }
    })

    if (projectCount === 1) {
      return NextResponse.json({ 
        error: 'Cannot delete the last remaining project. Create another project first.' 
      }, { status: 400 })
    }

    let result

    if (archive) {
      // Archive the project by updating settings instead of deleting
      result = await prisma.project.update({
        where: {
          id: id,
          userId: user.id
        },
        data: {
          settings: {
            ...existingProject.settings,
            archived: true,
            archivedAt: new Date().toISOString()
          }
        }
      })

      return NextResponse.json({ 
        message: 'Project archived successfully',
        project: result
      })
    } else {
      // Handle default project reassignment if needed
      if (existingProject.isDefault) {
        await prisma.$transaction(async (prisma) => {
          // Find another project to make default
          const nextDefault = await prisma.project.findFirst({
            where: {
              userId: user.id,
              id: { not: id }
            },
            orderBy: { createdAt: 'asc' }
          })

          if (nextDefault) {
            // Set another project as default
            await prisma.project.update({
              where: { id: nextDefault.id },
              data: { isDefault: true }
            })
          }

          // Delete the project (cascade will handle related data)
          await prisma.project.delete({
            where: {
              id: id,
              userId: user.id
            }
          })
        })
      } else {
        // Delete project (only if it belongs to the user)
        await prisma.project.delete({
          where: {
            id: id,
            userId: user.id
          }
        })
      }

      return NextResponse.json({ message: 'Project deleted successfully' })
    }
  } catch (error) {
    console.error('Error deleting project:', error)
    
    // Handle record not found errors
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 404 })
    }

    return NextResponse.json({
      error: 'Failed to delete project',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}