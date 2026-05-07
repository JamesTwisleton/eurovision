import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const contestants = [
  { country: 'Albania', artist: 'TBA', song: 'TBA', performanceOrder: 1, flagEmoji: '🇦🇱' },
  { country: 'Armenia', artist: 'TBA', song: 'TBA', performanceOrder: 2, flagEmoji: '🇦🇲' },
  { country: 'Australia', artist: 'TBA', song: 'TBA', performanceOrder: 3, flagEmoji: '🇦🇺' },
  { country: 'Austria', artist: 'TBA', song: 'TBA', performanceOrder: 4, flagEmoji: '🇦🇹' },
  { country: 'Azerbaijan', artist: 'TBA', song: 'TBA', performanceOrder: 5, flagEmoji: '🇦🇿' },
  { country: 'Belgium', artist: 'TBA', song: 'TBA', performanceOrder: 6, flagEmoji: '🇧🇪' },
  { country: 'Bulgaria', artist: 'TBA', song: 'TBA', performanceOrder: 7, flagEmoji: '🇧🇬' },
  { country: 'Croatia', artist: 'TBA', song: 'TBA', performanceOrder: 8, flagEmoji: '🇭🇷' },
  { country: 'Cyprus', artist: 'TBA', song: 'TBA', performanceOrder: 9, flagEmoji: '🇨🇾' },
  { country: 'Czechia', artist: 'TBA', song: 'TBA', performanceOrder: 10, flagEmoji: '🇨🇿' },
  { country: 'Denmark', artist: 'TBA', song: 'TBA', performanceOrder: 11, flagEmoji: '🇩🇰' },
  { country: 'Estonia', artist: 'TBA', song: 'TBA', performanceOrder: 12, flagEmoji: '🇪🇪' },
  { country: 'Finland', artist: 'TBA', song: 'TBA', performanceOrder: 13, flagEmoji: '🇫🇮' },
  { country: 'France', artist: 'TBA', song: 'TBA', performanceOrder: 14, flagEmoji: '🇫🇷' },
  { country: 'Georgia', artist: 'TBA', song: 'TBA', performanceOrder: 15, flagEmoji: '🇬🇪' },
  { country: 'Germany', artist: 'TBA', song: 'TBA', performanceOrder: 16, flagEmoji: '🇩🇪' },
  { country: 'Greece', artist: 'TBA', song: 'TBA', performanceOrder: 17, flagEmoji: '🇬🇷' },
  { country: 'Israel', artist: 'TBA', song: 'TBA', performanceOrder: 18, flagEmoji: '🇮🇱' },
  { country: 'Italy', artist: 'TBA', song: 'TBA', performanceOrder: 19, flagEmoji: '🇮🇹' },
  { country: 'Latvia', artist: 'TBA', song: 'TBA', performanceOrder: 20, flagEmoji: '🇱🇻' },
  { country: 'Lithuania', artist: 'TBA', song: 'TBA', performanceOrder: 21, flagEmoji: '🇱🇹' },
  { country: 'Luxembourg', artist: 'TBA', song: 'TBA', performanceOrder: 22, flagEmoji: '🇱🇺' },
  { country: 'Malta', artist: 'TBA', song: 'TBA', performanceOrder: 23, flagEmoji: '🇲🇹' },
  { country: 'Moldova', artist: 'TBA', song: 'TBA', performanceOrder: 24, flagEmoji: '🇲🇩' },
  { country: 'Montenegro', artist: 'TBA', song: 'TBA', performanceOrder: 25, flagEmoji: '🇲🇪' },
  { country: 'Norway', artist: 'TBA', song: 'TBA', performanceOrder: 26, flagEmoji: '🇳🇴' },
  { country: 'Poland', artist: 'TBA', song: 'TBA', performanceOrder: 27, flagEmoji: '🇵🇱' },
  { country: 'Portugal', artist: 'TBA', song: 'TBA', performanceOrder: 28, flagEmoji: '🇵🇹' },
  { country: 'Romania', artist: 'TBA', song: 'TBA', performanceOrder: 29, flagEmoji: '🇷🇴' },
  { country: 'San Marino', artist: 'TBA', song: 'TBA', performanceOrder: 30, flagEmoji: '🇸🇲' },
  { country: 'Serbia', artist: 'TBA', song: 'TBA', performanceOrder: 31, flagEmoji: '🇷🇸' },
  { country: 'Sweden', artist: 'TBA', song: 'TBA', performanceOrder: 32, flagEmoji: '🇸🇪' },
  { country: 'Switzerland', artist: 'TBA', song: 'TBA', performanceOrder: 33, flagEmoji: '🇨🇭' },
  { country: 'Ukraine', artist: 'TBA', song: 'TBA', performanceOrder: 34, flagEmoji: '🇺🇦' },
  { country: 'United Kingdom', artist: 'TBA', song: 'TBA', performanceOrder: 35, flagEmoji: '🇬🇧' },
]

async function main() {
  console.log('Seeding contestants...')
  for (const contestant of contestants) {
    await prisma.contestant.upsert({
      where: { country: contestant.country },
      update: contestant,
      create: contestant,
    })
  }
  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
