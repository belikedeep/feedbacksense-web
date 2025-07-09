import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

// GET /api/export/history - List user's export history with pagination
export async function GET(request) {
  try {
    const { supabase } = createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const exportType = searchParams.get('export_type');
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';

    const skip = (page - 1) * limit;

    // Build where clause
    const where = {
      userId: session.user.id,
      ...(status && { status }),
      ...(exportType && { exportType })
    };

    // Build orderBy clause
    const orderBy = {
      [sortBy]: sortOrder.toLowerCase()
    };

    // Get export history with pagination
    const [exportHistory, totalCount] = await Promise.all([
      prisma.exportHistory.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          progress: {
            orderBy: { updatedAt: 'desc' },
            take: 1
          }
        }
      }),
      prisma.exportHistory.count({ where })
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: exportHistory,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPrevPage,
        limit
      }
    });

  } catch (error) {
    console.error('Export history GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch export history', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/export/history - Create new export record
export async function POST(request) {
  try {
    const { supabase } = createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      exportType,
      configuration = {},
      filePath,
      status = 'pending',
      fileSize,
      recordCount,
      metadata = {}
    } = body;

    // Validate required fields
    if (!exportType) {
      return NextResponse.json(
        { error: 'Export type is required' },
        { status: 400 }
      );
    }

    // Validate export type
    const validExportTypes = ['csv', 'pdf', 'excel', 'json'];
    if (!validExportTypes.includes(exportType)) {
      return NextResponse.json(
        { error: 'Invalid export type' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['pending', 'processing', 'completed', 'failed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Create export history record
    const exportHistory = await prisma.exportHistory.create({
      data: {
        userId: session.user.id,
        exportType,
        configuration,
        filePath,
        status,
        fileSize,
        recordCount,
        metadata,
        ...(status === 'completed' && { completedAt: new Date() })
      },
      include: {
        progress: true
      }
    });

    // Create initial progress record
    if (status === 'pending' || status === 'processing') {
      await prisma.exportProgress.create({
        data: {
          exportId: exportHistory.id,
          stage: 'initialization',
          progressPercent: 0,
          message: 'Export initialized'
        }
      });
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'export_created',
        details: {
          exportId: exportHistory.id,
          exportType,
          status
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: exportHistory
    }, { status: 201 });

  } catch (error) {
    console.error('Export history POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create export record', details: error.message },
      { status: 500 }
    );
  }
}