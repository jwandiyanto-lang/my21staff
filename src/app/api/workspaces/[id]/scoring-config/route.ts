/**
 * Scoring Config API Route
 *
 * GET: Fetch scoring config for workspace (or return defaults)
 * PUT: Upsert scoring config with validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchQuery, fetchMutation } from 'convex/nextjs';
import { api } from 'convex/_generated/api';
import type { ScoringConfig } from '@/lib/ari/types';
import { DEFAULT_SCORING_CONFIG } from '@/lib/ari/types';
import { requireWorkspaceMembership } from '@/lib/auth/workspace-auth';

function isDevMode(): boolean {
  return process.env.NEXT_PUBLIC_DEV_MODE === 'true'
}

interface RouteParams {
  params: Promise<{ id: string }>;
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
    const { id: workspaceId } = await params;

    // Dev mode: return mock config without auth
    if (isDevMode() && workspaceId === 'demo') {
      return NextResponse.json({
        config: {
          workspace_id: workspaceId,
          ...DEFAULT_SCORING_CONFIG,
        },
        isDefault: true,
      });
    }

    // Verify user has access to workspace
    const authResult = await requireWorkspaceMembership(workspaceId);
    if (authResult instanceof NextResponse) return authResult;

    // Get workspace to get Convex ID
    const workspace = await fetchQuery(api.workspaces.getBySlug, { slug: workspaceId });
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Fetch config from Convex (may not exist yet)
    const config = await fetchQuery(api.ari.getScoringConfig, {
      workspace_id: workspace._id,
    });

    // If no config exists, return defaults
    if (!config) {
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
    const { id: workspaceId } = await params;

    // Dev mode: return mock config without auth
    if (isDevMode() && workspaceId === 'demo') {
      const body = await request.json();
      return NextResponse.json({
        config: {
          workspace_id: workspaceId,
          hot_threshold: body.hot_threshold ?? DEFAULT_SCORING_CONFIG.hot_threshold,
          warm_threshold: body.warm_threshold ?? DEFAULT_SCORING_CONFIG.warm_threshold,
          weight_basic: body.weight_basic ?? DEFAULT_SCORING_CONFIG.weight_basic,
          weight_qualification: body.weight_qualification ?? DEFAULT_SCORING_CONFIG.weight_qualification,
          weight_document: body.weight_document ?? DEFAULT_SCORING_CONFIG.weight_document,
          weight_engagement: body.weight_engagement ?? DEFAULT_SCORING_CONFIG.weight_engagement,
        },
      });
    }

    // Verify user has access (admin role check is implicit in mutation)
    const authResult = await requireWorkspaceMembership(workspaceId);
    if (authResult instanceof NextResponse) return authResult;

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

    // Get workspace to get Convex ID
    const workspace = await fetchQuery(api.workspaces.getBySlug, { slug: workspaceId });
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Upsert config in Convex
    const config = await fetchMutation(api.ari.upsertScoringConfig, {
      workspace_id: workspace._id,
      hot_threshold: configData.hot_threshold,
      warm_threshold: configData.warm_threshold,
      weight_basic: configData.weight_basic,
      weight_qualification: configData.weight_qualification,
      weight_document: configData.weight_document,
      weight_engagement: configData.weight_engagement,
    });

    return NextResponse.json({ config });

  } catch (error) {
    console.error('[scoring-config] PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
