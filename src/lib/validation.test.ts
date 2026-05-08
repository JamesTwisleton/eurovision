import { describe, it, expect } from 'vitest';
import { validateFinalScores, VALID_FINAL_POINTS, createWatchPartySchema, joinWatchPartySchema, contestantSchema, draftScoreSchema } from './validation';

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

  describe('joinWatchPartySchema', () => {
    it('should validate correct join data', () => {
      const data = { key: 'neon-disco-glitter', name: 'Rebecca', location: 'London' };
      expect(joinWatchPartySchema.safeParse(data).success).toBe(true);
    });

    it('should reject empty key', () => {
      expect(joinWatchPartySchema.safeParse({ key: '', name: 'Rebecca', location: 'London' }).success).toBe(false);
    });

    it('should reject empty name or location', () => {
      expect(joinWatchPartySchema.safeParse({ key: 'abc', name: '', location: 'London' }).success).toBe(false);
      expect(joinWatchPartySchema.safeParse({ key: 'abc', name: 'Rebecca', location: '' }).success).toBe(false);
    });

    it('should reject names over 100 characters', () => {
      const longName = 'a'.repeat(101);
      expect(joinWatchPartySchema.safeParse({ key: 'abc', name: longName, location: 'London' }).success).toBe(false);
    });
  });

  describe('contestantSchema', () => {
    it('should validate a full contestant', () => {
      const data = {
        country: 'United Kingdom',
        artist: 'RAYE',
        song: 'Genesis',
        performanceOrder: 1,
        imageUrl: 'https://example.com/img.jpg',
        youtubeUrl: 'https://youtube.com/watch?v=abc',
        flagEmoji: '\u{1F1EC}\u{1F1E7}',
      };
      expect(contestantSchema.safeParse(data).success).toBe(true);
    });

    it('should default imageUrl and youtubeUrl to empty string when omitted', () => {
      const data = {
        country: 'France',
        artist: 'Louane',
        song: 'Maman',
        performanceOrder: 5,
        flagEmoji: '\u{1F1EB}\u{1F1F7}',
      };
      const result = contestantSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.imageUrl).toBe('');
        expect(result.data.youtubeUrl).toBe('');
      }
    });

    it('should reject performanceOrder less than 1', () => {
      const data = {
        country: 'France',
        artist: 'Louane',
        song: 'Maman',
        performanceOrder: 0,
        flagEmoji: '\u{1F1EB}\u{1F1F7}',
      };
      expect(contestantSchema.safeParse(data).success).toBe(false);
    });

    it('should reject empty country or artist', () => {
      const base = { song: 'Song', performanceOrder: 1, flagEmoji: '\u{1F1EB}\u{1F1F7}' };
      expect(contestantSchema.safeParse({ ...base, country: '', artist: 'A' }).success).toBe(false);
      expect(contestantSchema.safeParse({ ...base, country: 'FR', artist: '' }).success).toBe(false);
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

    it('should reject non-uuid contestantId', () => {
      expect(draftScoreSchema.safeParse({ contestantId: 'not-a-uuid', points: 5 }).success).toBe(false);
    });

    it('should reject non-integer points', () => {
      expect(draftScoreSchema.safeParse({ contestantId: '550e8400-e29b-41d4-a716-446655440000', points: 5.5 }).success).toBe(false);
    });
  });
});
