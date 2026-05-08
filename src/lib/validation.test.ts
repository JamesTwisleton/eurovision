import { describe, it, expect } from 'vitest';
import { validateFinalScores, VALID_FINAL_POINTS, createWatchPartySchema, draftScoreSchema } from './validation';

describe('validateFinalScores', () => {
  it('should return valid for a correct set of scores', () => {
    const scores = VALID_FINAL_POINTS.map(p => ({ points: p }));
    const result = validateFinalScores(scores);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should return invalid when points are missing', () => {
    const scores = [{ points: 12 }, { points: 10 }];
    const result = validateFinalScores(scores);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing: 8 points not assigned to any contestant');
  });

  it('should return invalid when points are duplicated', () => {
    const scores = [...VALID_FINAL_POINTS.map(p => ({ points: p })), { points: 12 }];
    const result = validateFinalScores(scores);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Duplicate: 12 points assigned to 2 contestants');
  });

  it('should return invalid for values not in 0, 1-8, 10, 12', () => {
    const scores = [{ points: 9 }, { points: 11 }];
    const result = validateFinalScores(scores);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Invalid point values: 9, 11'))).toBe(true);
  });

  it('should ignore 0 points for duplicate/missing checks but allow them in the list', () => {
    const scores = [...VALID_FINAL_POINTS.map(p => ({ points: p })), { points: 0 }];
    const result = validateFinalScores(scores);
    expect(result.valid).toBe(true);
  });
});

describe('Zod schemas', () => {
  describe('createWatchPartySchema', () => {
    it('should validate correct watch party data', () => {
      const data = { partyName: 'London Legends', memberName: 'Rebecca', memberLocation: 'London' };
      expect(createWatchPartySchema.safeParse(data).success).toBe(true);
    });

    it('should reject empty fields', () => {
      expect(createWatchPartySchema.safeParse({ partyName: '', memberName: 'Rebecca', memberLocation: 'London' }).success).toBe(false);
      expect(createWatchPartySchema.safeParse({ partyName: 'Party', memberName: '', memberLocation: 'London' }).success).toBe(false);
      expect(createWatchPartySchema.safeParse({ partyName: 'Party', memberName: 'Rebecca', memberLocation: '' }).success).toBe(false);
    });
  });

  describe('draftScoreSchema', () => {
    it('should validate correct draft score', () => {
      const data = { contestantId: '550e8400-e29b-41d4-a716-446655440000', points: 7 };
      expect(draftScoreSchema.safeParse(data).success).toBe(true);
    });

    it('should reject points outside 0-12', () => {
      expect(draftScoreSchema.safeParse({ contestantId: '550e8400-e29b-41d4-a716-446655440000', points: 13 }).success).toBe(false);
      expect(draftScoreSchema.safeParse({ contestantId: '550e8400-e29b-41d4-a716-446655440000', points: -1 }).success).toBe(false);
    });
  });
});
