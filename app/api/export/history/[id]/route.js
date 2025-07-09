import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

// GET /api/export/history/[id] - Get specific export details
export async function GET(request, { params }) {
  try {
    const { supabase } = createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Export ID is required' },
        { status: 400 }
      );
    }

    // Get export history record with progress
    const exportHistory = await prisma.exportHistory.findFirst({
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

    if (!exportHistory) {
      return NextResponse.json(
        { error: 'Export record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: exportHistory
    });

  } catch (error) {
    console.error('Export history GET by ID error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch export record', details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/export/history/[id] - Update export record
export async function PUT(request, { params }) {
  try {
    const { supabase } = createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Export ID is required' },
        { status: 400 }
      );
    }

    // Check if export belongs to user
    const existingExport = await prisma.exportHistory.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    });

    if (!existingExport) {
      return NextResponse.json(
        { error: 'Export record not found' },
        { status: 404 }
      );
    }

    const {
      status,
      filePath,
      fileSize,
      recordCount,
      metadata,
      errorMessage,
      retryCount
    } = body;

    // Validate status if provided
    if (status) {
      const validStatuses = ['pending', 'processing', 'completed', 'failed'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (filePath !== undefined) updateData.filePath = filePath;
    if (fileSize !== undefined) updateData.fileSize = fileSize;
    if (recordCount !== undefined) updateData.recordCount = recordCount;
    if (metadata !== undefined) updateData.metadata = metadata;
    if (errorMessage !== undefined) updateData.errorMessage = errorMessage;
    if (retryCount !== undefined) updateData.retryCount = retryCount;

    // Set completion time if status is completed
    if (status === 'completed') {
      updateData.completedAt = new Date();
    }

    // Update export history record
    const updatedExport = await prisma.exportHistory.update({
      where: { id },
      data: updateData,
      include: {
        progress: {
          orderBy: { updatedAt: 'desc' },
          take: 1
        }
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'export_updated',
        details: {
          exportId: id,
          updatedFields: Object.keys(updateData),
          newStatus: status
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedExport
    });

  } catch (error) {
    console.error('Export history PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update export record', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/export/history/[id] - Delete export record
export async function DELETE(request, { params }) {
  try {
    const { supabase } = createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Export ID is required' },
        { status: 400 }
      );
    }

    // Check if export belongs to user
    const existingExport = await prisma.exportHistory.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    });

    if (!existingExport) {
      return NextResponse.json(
        { error: 'Export record not found' },
        { status: 404 }
      );
    }

    // Delete export history record (progress records will be deleted by cascade)
    await prisma.exportHistory.delete({
      where: { id }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'export_deleted',
        details: {
          exportId: id,
          exportType: existingExport.exportType,
          status: existingExport.status
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Export record deleted successfully'
    });

  } catch (error) {
    console.error('Export history DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete export record', details: error.message },
      { status: 500 }
    );
  }
}