import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Finds a WatchParty by either its UUID id or its 3-word secret key.
 */
export async function findWatchPartyByIdOrKey(idOrKey: string) {
  // Try UUID first if it matches UUID format, otherwise try key
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrKey);

  if (isUuid) {
    return prisma.watchParty.findUnique({
      where: { id: idOrKey }
    });
  }

  return prisma.watchParty.findUnique({
    where: { key: idOrKey }
  });
}
