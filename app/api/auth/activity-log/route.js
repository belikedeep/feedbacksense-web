import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { prisma } from '@/lib/prisma'

export async function POST(request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    const userAgent = request.headers.get('user-agent')
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    
    // Get IP address (try different headers)
    const clientIp = forwardedFor?.split(',')[0] || realIp || 'unknown'

    let user
    
    // If no auth header, try to get user from cookies (for client-side calls)
    if (!authHeader) {
      const { data: { user: cookieUser }, error } = await supabase.auth.getUser()
      if (error || !cookieUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      user = cookieUser
    } else {
      // Verify the JWT token
      const token = authHeader.replace('Bearer ', '')
      const { data: { user: tokenUser }, error } = await supabase.auth.getUser(token)
      
      if (error || !tokenUser) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }
      user = tokenUser
    }

    const { action, details } = await request.json()

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 })
    }

    // Log the activity
    const activityLog = await prisma.activityLog.create({
      data: {
        userId: user.id,
        action,
        details: details || {},
        ipAddress: clientIp,
        userAgent: userAgent || 'unknown'
      }
    })

    return NextResponse.json({ success: true, id: activityLog.id })

  } catch (error) {
    console.error('Error logging activity:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    
    let user
    
    // If no auth header, try to get user from cookies
    if (!authHeader) {
      const { data: { user: cookieUser }, error } = await supabase.auth.getUser()
      if (error || !cookieUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      user = cookieUser
    } else {
      // Verify the JWT token
      const token = authHeader.replace('Bearer ', '')
      const { data: { user: tokenUser }, error } = await supabase.auth.getUser(token)
      
      if (error || !tokenUser) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }
      user = tokenUser
    }

    // Get query parameters
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit')) || 50
    const offset = parseInt(url.searchParams.get('offset')) || 0

    // Fetch activity logs for the user
    const activities = await prisma.activityLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        action: true,
        details: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true
      }
    })

    // Get total count for pagination
    const total = await prisma.activityLog.count({
      where: { userId: user.id }
    })

    return NextResponse.json({
      activities,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })

  } catch (error) {
    console.error('Error fetching activity logs:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}