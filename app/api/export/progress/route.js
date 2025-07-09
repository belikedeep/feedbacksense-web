import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

// GET /api/export/progress - Get progress for multiple exports
export async function GET(request) {
  try {
    const { supabase } = createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const exportIds = searchParams.get('export_ids')?.split(',') || [];
    const activeOnly = searchParams.get('active_only') === 'true';

    if (exportIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one export ID is required' },
        { status: 400 }
      );
    }

    // Verify exports belong to user and get progress
    const exports = await prisma.exportHistory.findMany({
      where: {
        id: { in: exportIds },
        userId: session.user.id
      },
      select: {
        id: true,
        status: true,
        exportType: true,
        createdAt: true,
        progress: {
          orderBy: { updatedAt: 'desc' },
          ...(activeOnly && {
            where: {
              progressPercent: { lt: 100 }
            }
          })
        }
      }
    });

    if (exports.length === 0) {
      return NextResponse.json(
        { error: 'No accessible exports found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: exports
    });

  } catch (error) {
    console.error('Export progress GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch export progress', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/export/progress - Create progress record
export async function POST(request) {
  try {
    const { supabase } = createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      exportId,
      stage,
      progressPercent = 0,
      message,
      estimatedCompletion
    } = body;

    // Validate required fields
    if (!exportId || !stage) {
      return NextResponse.json(
        { error: 'Export ID and stage are required' },
        { status: 400 }
      );
    }

    // Validate progress percent
    if (progressPercent < 0 || progressPercent > 100) {
      return NextResponse.json(
        { error: 'Progress percent must be between 0 and 100' },
        { status: 400 }
      );
    }

    // Validate export belongs to user
    const exportRecord = await prisma.exportHistory.findFirst({
      where: {
        id: exportId,
        userId: session.user.id
      }
    });

    if (!exportRecord) {
      return NextResponse.json(
        { error: 'Export not found or access denied' },
        { status: 404 }
      );
    }

    // Validate stage
    const validStages = ['initialization', 'data_collection', 'processing', 'file_generation', 'completion', 'cleanup'];
    if (!validStages.includes(stage)) {
      return NextResponse.json(
        { error: 'Invalid stage' },
        { status: 400 }
      );
    }

    // Create progress record
    const progress = await prisma.exportProgress.create({
      data: {
        exportId,
        stage,
        progressPercent,
        message,
        ...(estimatedCompletion && { estimatedCompletion: new Date(estimatedCompletion) })
      }
    });

    // Update export status based on progress
    let newStatus = exportRecord.status;
    if (progressPercent === 0 && stage === 'initialization') {
      newStatus = 'processing';
    } else if (progressPercent === 100 && stage === 'completion') {
      newStatus = 'completed';
    } else if (stage === 'error') {
      newStatus = 'failed';
    }

    if (newStatus !== exportRecord.status) {
      await prisma.exportHistory.update({
        where: { id: exportId },
        data: {
          status: newStatus,
          ...(newStatus === 'completed' && { completedAt: new Date() })
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: progress
    }, { status: 201 });

  } catch (error) {
    console.error('Export progress POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create progress record', details: error.message },
      { status: 500 }
    );
  }
}