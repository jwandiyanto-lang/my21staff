/**
 * Unit tests for ARI Lead Scoring Module
 */

import { calculateLeadScore, getLeadTemperature, getScoreReasons } from '../scoring';
import type { DocumentStatus } from '../qualification';

describe('calculateLeadScore', () => {
  it('returns low score for empty form and no documents', () => {
    const result = calculateLeadScore({}, undefined);
    // Only engagement default (5 points) should be present
    expect(result.score).toBeLessThan(20);
    expect(result.breakdown.basic_score).toBe(0);
    expect(result.breakdown.document_score).toBe(0);
  });

  it('returns high score for complete form with documents', () => {
    const form = {
      name: 'Budi Santoso',
      email: 'budi@test.com',
      english_level: 'IELTS 7.0',
      budget: '50 juta',
      timeline: '6 bulan',
      country: 'Australia',
    };
    const docs: DocumentStatus = {
      passport: true,
      cv: true,
      english_test: true,
      transcript: true,
    };
    const result = calculateLeadScore(form, docs);
    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.breakdown.basic_score).toBe(25); // 15 + 5 + 5
    expect(result.breakdown.document_score).toBe(30); // 7.5 * 4
  });

  it('applies timeline penalty for 2+ year timeline', () => {
    const formNear = { timeline: '6 bulan', country: 'UK' };
    const formFar = { timeline: '2 tahun lagi', country: 'UK' };

    const nearResult = calculateLeadScore(formNear, undefined);
    const farResult = calculateLeadScore(formFar, undefined);

    expect(nearResult.score).toBeGreaterThan(farResult.score);
    // Both have timeline specified (10 points), but far has -10 penalty
    expect(nearResult.breakdown.qualification_score).toBe(10);
    expect(farResult.breakdown.qualification_score).toBe(0); // 10 - 10 = 0
  });

  it('applies timeline penalty for year 2028 mention', () => {
    const formFar = { timeline: 'kuliah 2028', country: 'UK' };
    const result = calculateLeadScore(formFar, undefined);

    // Timeline penalty should be applied (2028 is 2+ years from 2026)
    expect(result.breakdown.qualification_score).toBe(0);
  });

  it('gives bonus for IELTS 6.5+', () => {
    const formBasic = { english_level: 'pemula' };
    const formHigh = { english_level: 'IELTS 7.0' };

    const basicResult = calculateLeadScore(formBasic, undefined);
    const highResult = calculateLeadScore(formHigh, undefined);

    // Both have english_level (10 points), high gets +3 bonus
    expect(highResult.breakdown.qualification_score).toBe(13); // 10 + 3
    expect(basicResult.breakdown.qualification_score).toBe(10);
  });

  it('scores documents correctly', () => {
    const form = { name: 'Test' };

    const noDocsResult = calculateLeadScore(form, undefined);
    const partialDocsResult = calculateLeadScore(form, {
      passport: true,
      cv: true,
      english_test: false,
      transcript: null,
    });
    const fullDocsResult = calculateLeadScore(form, {
      passport: true,
      cv: true,
      english_test: true,
      transcript: true,
    });

    expect(noDocsResult.breakdown.document_score).toBe(0);
    expect(partialDocsResult.breakdown.document_score).toBe(15); // 7.5 * 2
    expect(fullDocsResult.breakdown.document_score).toBe(30); // 7.5 * 4
  });

  it('uses engagement score when provided', () => {
    const form = { name: 'Test' };

    const defaultResult = calculateLeadScore(form, undefined);
    const highEngagement = calculateLeadScore(form, undefined, 10);
    const lowEngagement = calculateLeadScore(form, undefined, 2);

    expect(defaultResult.breakdown.engagement_score).toBe(5);
    expect(highEngagement.breakdown.engagement_score).toBe(10);
    expect(lowEngagement.breakdown.engagement_score).toBe(2);
  });

  it('clamps engagement score to 0-10', () => {
    const form = { name: 'Test' };

    const overResult = calculateLeadScore(form, undefined, 15);
    const underResult = calculateLeadScore(form, undefined, -5);

    expect(overResult.breakdown.engagement_score).toBe(10);
    expect(underResult.breakdown.engagement_score).toBe(0);
  });

  it('validates email format', () => {
    const validEmail = calculateLeadScore({ email: 'test@example.com' }, undefined);
    const invalidEmail = calculateLeadScore({ email: 'not-an-email' }, undefined);

    // Valid email adds 5 points to basic score
    expect(validEmail.breakdown.basic_score).toBeGreaterThan(invalidEmail.breakdown.basic_score);
  });
});

describe('getLeadTemperature', () => {
  it('returns hot for 70+', () => {
    expect(getLeadTemperature(70)).toBe('hot');
    expect(getLeadTemperature(85)).toBe('hot');
    expect(getLeadTemperature(100)).toBe('hot');
  });

  it('returns warm for 40-69', () => {
    expect(getLeadTemperature(40)).toBe('warm');
    expect(getLeadTemperature(55)).toBe('warm');
    expect(getLeadTemperature(69)).toBe('warm');
  });

  it('returns cold for <40', () => {
    expect(getLeadTemperature(0)).toBe('cold');
    expect(getLeadTemperature(20)).toBe('cold');
    expect(getLeadTemperature(39)).toBe('cold');
  });
});

describe('getScoreReasons', () => {
  it('returns reasons array for scoring factors', () => {
    const form = {
      name: 'Budi',
      email: 'budi@test.com',
      budget: '50 juta',
      country: 'UK',
    };
    const result = calculateLeadScore(form, undefined);

    expect(result.reasons).toContain('Email valid');
    expect(result.reasons.some(r => r.includes('Budget jelas'))).toBe(true);
    expect(result.reasons.some(r => r.includes('Negara tujuan'))).toBe(true);
  });

  it('shows document readiness in reasons', () => {
    const form = { name: 'Test' };
    const docs: DocumentStatus = {
      passport: true,
      cv: true,
      english_test: false,
      transcript: null,
    };
    const result = calculateLeadScore(form, docs);

    expect(result.reasons.some(r => r.includes('Dokumen siap'))).toBe(true);
    expect(result.reasons.some(r => r.includes('Paspor'))).toBe(true);
    expect(result.reasons.some(r => r.includes('CV'))).toBe(true);
  });

  it('shows timeline penalty in reasons', () => {
    const form = { timeline: '2 tahun lagi' };
    const result = calculateLeadScore(form, undefined);

    expect(result.reasons.some(r => r.includes('penalty'))).toBe(true);
  });

  it('shows IELTS bonus in reasons', () => {
    const form = { english_level: 'IELTS 7.5' };
    const result = calculateLeadScore(form, undefined);

    expect(result.reasons.some(r => r.includes('IELTS 6.5+'))).toBe(true);
  });
});
