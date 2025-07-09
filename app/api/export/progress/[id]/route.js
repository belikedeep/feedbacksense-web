import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

// GET /api/export/progress/[id] - Get export progress by export ID
export async function GET(request, { params }) {
  try {
    const { supabase } = createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params; // This is the export ID

    if (!id) {
      return NextResponse.json(
        { error: 'Export ID is required' },
        { status: 400 }
      );
    }

    // Verify export belongs to user and get progress
    const exportWithProgress = await prisma.exportHistory.findFirst({
      where: {
        id,
        userId: session.user.id
      },
      include: {
        progress: {
          orderBy: { updatedAt: 'asc' }
        }
      }
    });

    if (!exportWithProgress) {
      return NextResponse.json(
        { error: 'Export not found or access denied' },
        { status: 404 }
      );
    }

    // Get the latest progress
    const latestProgress = exportWithProgress.progress[exportWithProgress.progress.length - 1];

    return NextResponse.json({
      success: true,
      data: {
        exportId: id,
        status: exportWithProgress.status,
        exportType: exportWithProgress.exportType,
        createdAt: exportWithProgress.createdAt,
        completedAt: exportWithProgress.completedAt,
        currentProgress: latestProgress,
        progressHistory: exportWithProgress.progress
      }
    });

  } catch (error) {
    console.error('Export progress GET by ID error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch export progress', details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/export/progress/[id] - Update export progress by export ID
export async function PUT(request, { params }) {
  try {
    const { supabase } = createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params; // This is the export ID
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Export ID is required' },
        { status: 400 }
      );
    }

    // Verify export belongs to user
    const exportRecord = await prisma.exportHistory.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    });

    if (!exportRecord) {
      return NextResponse.json(
        { error: 'Export not found or access denied' },
        { status: 404 }
      );
    }

    const {
      stage,
      progressPercent,
      message,
      estimatedCompletion
    } = body;

    // Validate required fields
    if (!stage) {
      return NextResponse.json(
        { error: 'Stage is required' },
        { status: 400 }
      );
    }

    // Validate progress percent
    if (progressPercent !== undefined && (progressPercent < 0 || progressPercent > 100)) {
      return NextResponse.json(
        { error: 'Progress percent must be between 0 and 100' },
        { status: 400 }
      );
    }

    // Validate stage
    const validStages = ['initialization', 'data_collection', 'processing', 'file_generation', 'completion', 'cleanup', 'error'];
    if (!validStages.includes(stage)) {
      return NextResponse.json(
        { error: 'Invalid stage' },
        { status: 400 }
      );
    }

    // Create new progress record
    const progressData = {
      exportId: id,
      stage,
      ...(progressPercent !== undefined && { progressPercent }),
      ...(message && { message }),
      ...(estimatedCompletion && { estimatedCompletion: new Date(estimatedCompletion) })
    };

    const progress = await prisma.exportProgress.create({
      data: progressData
    });

    // Update export status based on progress
    let newStatus = exportRecord.status;
    let updateData = {};

    if (progressPercent === 0 && stage === 'initialization') {
      newStatus = 'processing';
    } else if (progressPercent === 100 || stage === 'completion') {
      newStatus = 'completed';
      updateData.completedAt = new Date();
    } else if (stage === 'error') {
      newStatus = 'failed';
      if (message) {
        updateData.errorMessage = message;
      }
    }

    if (newStatus !== exportRecord.status) {
      updateData.status = newStatus;
      await prisma.exportHistory.update({
        where: { id },
        data: updateData
      });
    }

    // Get updated export with latest progress
    const updatedExport = await prisma.exportHistory.findUnique({
      where: { id },
      include: {
        progress: {
          orderBy: { updatedAt: 'desc' },
          take: 1
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        progress,
        export: updatedExport
      }
    });

  } catch (error) {
    console.error('Export progress PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update export progress', details: error.message },
      { status: 500 }
    );
  }
}