import { describe, it, expect } from 'vitest';
import { createWatchPartySchema, joinWatchPartySchema } from './validation';

describe('Normalization logic', () => {
  describe('createWatchPartySchema', () => {
    it('should normalize member name and location', () => {
      const data = {
        partyName: ' Eurovision Party ',
        memberName: ' Alice ',
        memberLocation: ' London '
      };
      const result = createWatchPartySchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        // Party name might not need lowercasing, but trimming is good.
        // User said: "user names, locations and three-word-names are not case-sensitive"
        expect(result.data.memberName).toBe('alice');
        expect(result.data.memberLocation).toBe('london');
      }
    });
  });

  describe('joinWatchPartySchema', () => {
    it('should normalize name, location and key', () => {
      const data = {
        key: ' Neon-Disco-Glitter ',
        name: ' ALICE ',
        location: ' LDN '
      };
      const result = joinWatchPartySchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.key).toBe('neon-disco-glitter');
        expect(result.data.name).toBe('alice');
        expect(result.data.location).toBe('ldn');
      }
    });
  });
});
