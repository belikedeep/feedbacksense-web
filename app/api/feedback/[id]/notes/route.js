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

    // First, verify the feedback belongs to the user
    const feedback = await prisma.feedback.findFirst({
      where: {
        id: id,
        userId: user.id
      }
    })

    if (!feedback) {
      return NextResponse.json({ error: 'Feedback not found or unauthorized' }, { status: 404 })
    }

    // Get notes for the feedback
    const notes = await prisma.feedbackNote.findMany({
      where: {
        feedbackId: id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(notes)
  } catch (error) {
    console.error('Error fetching feedback notes:', error)
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
  }
}

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
    const { content, isInternal = true } = await request.json()

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // First, verify the feedback belongs to the user
    const feedback = await prisma.feedback.findFirst({
      where: {
        id: id,
        userId: user.id
      }
    })

    if (!feedback) {
      return NextResponse.json({ error: 'Feedback not found or unauthorized' }, { status: 404 })
    }

    // Create the note
    const note = await prisma.feedbackNote.create({
      data: {
        feedbackId: id,
        userId: user.id,
        content: content.trim(),
        isInternal
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(note)
  } catch (error) {
    console.error('Error creating feedback note:', error)
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 })
  }
}