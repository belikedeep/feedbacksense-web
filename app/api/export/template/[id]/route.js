import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

// GET /api/export/template/[id] - Get specific template
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
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    // Get template (user's own or shared)
    const template = await prisma.exportTemplate.findFirst({
      where: {
        id,
        OR: [
          { userId: session.user.id },
          { isShared: true }
        ]
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
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: template
    });

  } catch (error) {
    console.error('Export template GET by ID error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template', details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/export/template/[id] - Update template
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
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    // Check if template belongs to user
    const existingTemplate = await prisma.exportTemplate.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template not found or access denied' },
        { status: 404 }
      );
    }

    const {
      name,
      description,
      configuration,
      isShared,
      isDefault
    } = body;

    // Validate name if provided
    if (name && name !== existingTemplate.name) {
      const nameExists = await prisma.exportTemplate.findFirst({
        where: {
          userId: session.user.id,
          name,
          id: { not: id }
        }
      });

      if (nameExists) {
        return NextResponse.json(
          { error: 'Template with this name already exists' },
          { status: 409 }
        );
      }
    }

    // If setting as default, unset other defaults for this user
    if (isDefault && !existingTemplate.isDefault) {
      await prisma.exportTemplate.updateMany({
        where: {
          userId: session.user.id,
          isDefault: true
        },
        data: {
          isDefault: false
        }
      });
    }

    // Prepare update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (configuration !== undefined) updateData.configuration = configuration;
    if (isShared !== undefined) updateData.isShared = isShared;
    if (isDefault !== undefined) updateData.isDefault = isDefault;

    // Update template
    const updatedTemplate = await prisma.exportTemplate.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Increment usage count if template was used
    if (Object.keys(updateData).length > 0) {
      await prisma.exportTemplate.update({
        where: { id },
        data: {
          usageCount: {
            increment: 1
          }
        }
      });
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'export_template_updated',
        details: {
          templateId: id,
          updatedFields: Object.keys(updateData)
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedTemplate
    });

  } catch (error) {
    console.error('Export template PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update template', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/export/template/[id] - Delete template
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
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    // Check if template belongs to user
    const existingTemplate = await prisma.exportTemplate.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template not found or access denied' },
        { status: 404 }
      );
    }

    // Delete template
    await prisma.exportTemplate.delete({
      where: { id }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'export_template_deleted',
        details: {
          templateId: id,
          templateName: existingTemplate.name
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    });

  } catch (error) {
    console.error('Export template DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete template', details: error.message },
      { status: 500 }
    );
  }
}