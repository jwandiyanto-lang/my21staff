/**
 * Scoring Config API Route
 *
 * GET: Fetch scoring config for workspace (or return defaults)
 * PUT: Upsert scoring config with validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ScoringConfig } from '@/lib/ari/types';
import { DEFAULT_SCORING_CONFIG } from '@/lib/ari/types';

interface RouteParams {
  params: Promise<{ workspaceId: string }>;
}

// ===========================================
// Validation
// ===========================================

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function validateScoringConfig(data: Partial<ScoringConfig>): ValidationResult {
  const errors: string[] = [];

  // Validate thresholds
  if (data.hot_threshold !== undefined) {
    if (data.hot_threshold < 1 || data.hot_threshold > 100) {
      errors.push('Hot threshold must be between 1 and 100');
    }
  }

  if (data.warm_threshold !== undefined) {
    if (data.warm_threshold < 0 || data.warm_threshold >= 100) {
      errors.push('Warm threshold must be between 0 and 99');
    }
  }

  // Hot must be > warm
  const hot = data.hot_threshold ?? DEFAULT_SCORING_CONFIG.hot_threshold;
  const warm = data.warm_threshold ?? DEFAULT_SCORING_CONFIG.warm_threshold;
  if (hot <= warm) {
    errors.push('Hot threshold must be greater than warm threshold');
  }

  // Validate weights
  const weights = {
    basic: data.weight_basic ?? DEFAULT_SCORING_CONFIG.weight_basic,
    qualification: data.weight_qualification ?? DEFAULT_SCORING_CONFIG.weight_qualification,
    document: data.weight_document ?? DEFAULT_SCORING_CONFIG.weight_document,
    engagement: data.weight_engagement ?? DEFAULT_SCORING_CONFIG.weight_engagement,
  };

  // Each weight must be non-negative
  if (weights.basic < 0) errors.push('Basic weight must be non-negative');
  if (weights.qualification < 0) errors.push('Qualification weight must be non-negative');
  if (weights.document < 0) errors.push('Document weight must be non-negative');
  if (weights.engagement < 0) errors.push('Engagement weight must be non-negative');

  // Weights must sum to 100
  const totalWeight = weights.basic + weights.qualification + weights.document + weights.engagement;
  if (totalWeight !== 100) {
    errors.push(`Weights must sum to 100 (currently ${totalWeight})`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ===========================================
// GET - Fetch scoring config
// ===========================================

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check workspace membership
    const { data: member } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!member) {
      return NextResponse.json({ error: 'Not a workspace member' }, { status: 403 });
    }

    // Fetch config (may not exist yet)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: config, error } = await (supabase as any)
      .from('ari_scoring_config')
      .select('*')
      .eq('workspace_id', workspaceId)
      .single() as { data: ScoringConfig | null; error: { message: string } | null };

    // If no config exists, return defaults
    if (error || !config) {
      return NextResponse.json({
        config: {
          workspace_id: workspaceId,
          ...DEFAULT_SCORING_CONFIG,
        },
        isDefault: true,
      });
    }

    return NextResponse.json({ config, isDefault: false });

  } catch (error) {
    console.error('[scoring-config] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ===========================================
// PUT - Upsert scoring config
// ===========================================

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check workspace admin role
    const { data: member } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!member || !['owner', 'admin'].includes(member.role)) {
      return NextResponse.json(
        { error: 'Only workspace owners and admins can update scoring config' },
        { status: 403 }
      );
    }

    // Parse body
    const body = await request.json();
    const {
      hot_threshold,
      warm_threshold,
      weight_basic,
      weight_qualification,
      weight_document,
      weight_engagement,
    } = body;

    // Build config data
    const configData = {
      workspace_id: workspaceId,
      hot_threshold: hot_threshold ?? DEFAULT_SCORING_CONFIG.hot_threshold,
      warm_threshold: warm_threshold ?? DEFAULT_SCORING_CONFIG.warm_threshold,
      weight_basic: weight_basic ?? DEFAULT_SCORING_CONFIG.weight_basic,
      weight_qualification: weight_qualification ?? DEFAULT_SCORING_CONFIG.weight_qualification,
      weight_document: weight_document ?? DEFAULT_SCORING_CONFIG.weight_document,
      weight_engagement: weight_engagement ?? DEFAULT_SCORING_CONFIG.weight_engagement,
    };

    // Validate
    const validation = validateScoringConfig(configData);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    // Upsert config (insert or update on workspace_id conflict)
    const { data: config, error } = await supabase
      .from('ari_scoring_config')
      .upsert(configData, {
        onConflict: 'workspace_id',
      })
      .select()
      .single();

    if (error) {
      console.error('[scoring-config] Upsert error:', error);
      return NextResponse.json(
        { error: 'Failed to save scoring config', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ config });

  } catch (error) {
    console.error('[scoring-config] PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
