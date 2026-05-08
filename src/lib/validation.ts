import { z } from "zod";

export const VALID_FINAL_POINTS = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12] as const;

export const draftScoreSchema = z.object({
  contestantId: z.string().uuid(),
  points: z.number().int().min(0).max(12),
});

export const createJurySchema = z.object({
  name: z.string().min(1).max(100),
  location: z.string().min(1).max(100),
});

export const joinJurySchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1).max(100),
  location: z.string().min(1).max(100),
});

export const contestantSchema = z.object({
  country: z.string().min(1).max(100),
  artist: z.string().min(1).max(200),
  song: z.string().min(1).max(200),
  performanceOrder: z.number().int().min(1),
  imageUrl: z.string().optional().default(""),
  youtubeUrl: z.string().optional().default(""),
  flagEmoji: z.string().min(1).max(10),
});

export function validateFinalScores(
  scores: { points: number }[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const assignedPoints = scores.map((s) => s.points).filter((p) => p > 0);

  for (const required of VALID_FINAL_POINTS) {
    const count = assignedPoints.filter((p) => p === required).length;
    if (count === 0) {
      errors.push(`Missing: ${required} points not assigned to any contestant`);
    } else if (count > 1) {
      errors.push(
        `Duplicate: ${required} points assigned to ${count} contestants`
      );
    }
  }

  const nonZeroNonValid = scores.filter(
    (s) =>
      s.points !== 0 &&
      !(VALID_FINAL_POINTS as readonly number[]).includes(s.points)
  );
  if (nonZeroNonValid.length > 0) {
    errors.push(
      `Invalid point values: ${nonZeroNonValid.map((s) => s.points).join(", ")}. Allowed: 0, ${VALID_FINAL_POINTS.join(", ")}`
    );
  }

  return { valid: errors.length === 0, errors };
}
