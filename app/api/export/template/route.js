import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

// GET /api/export/template - List user's templates
export async function GET(request) {
  try {
    const { supabase } = createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeShared = searchParams.get('include_shared') === 'true';
    const isDefault = searchParams.get('is_default');
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';

    // Build where clause
    const where = {
      OR: [
        { userId: session.user.id },
        ...(includeShared ? [{ isShared: true }] : [])
      ],
      ...(isDefault !== null && { isDefault: isDefault === 'true' })
    };

    // Build orderBy clause
    const orderBy = {
      [sortBy]: sortOrder.toLowerCase()
    };

    // Get export templates
    const templates = await prisma.exportTemplate.findMany({
      where,
      orderBy,
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

    return NextResponse.json({
      success: true,
      data: templates
    });

  } catch (error) {
    console.error('Export templates GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch export templates', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/export/template - Create new template
export async function POST(request) {
  try {
    const { supabase } = createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      configuration = {},
      isShared = false,
      isDefault = false
    } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Template name is required' },
        { status: 400 }
      );
    }

    if (!configuration || typeof configuration !== 'object') {
      return NextResponse.json(
        { error: 'Valid configuration object is required' },
        { status: 400 }
      );
    }

    // Check if template name already exists for user
    const existingTemplate = await prisma.exportTemplate.findFirst({
      where: {
        userId: session.user.id,
        name
      }
    });

    if (existingTemplate) {
      return NextResponse.json(
        { error: 'Template with this name already exists' },
        { status: 409 }
      );
    }

    // If setting as default, unset other defaults for this user
    if (isDefault) {
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

    // Create export template
    const template = await prisma.exportTemplate.create({
      data: {
        userId: session.user.id,
        name,
        description,
        configuration,
        isShared,
        isDefault
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

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'export_template_created',
        details: {
          templateId: template.id,
          templateName: name,
          isShared,
          isDefault
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: template
    }, { status: 201 });

  } catch (error) {
    console.error('Export template POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create export template', details: error.message },
      { status: 500 }
    );
  }
}