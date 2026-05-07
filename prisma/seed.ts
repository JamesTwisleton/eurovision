import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const contestants = [
  // Semi-final 1
  { country: 'Moldova', artist: 'Satoshi', song: 'Viva, Moldova!', performanceOrder: 1, flagEmoji: '🇲🇩' },
  { country: 'Sweden', artist: 'Felicia', song: 'My System', performanceOrder: 2, flagEmoji: '🇸🇪' },
  { country: 'Croatia', artist: 'Lelek', song: 'Andromeda', performanceOrder: 3, flagEmoji: '🇭🇷' },
  { country: 'Greece', artist: 'Akylas', song: 'Ferto', performanceOrder: 4, flagEmoji: '🇬🇷' },
  { country: 'Portugal', artist: 'Bandidos do Cante', song: 'Rosa', performanceOrder: 5, flagEmoji: '🇵🇹' },
  { country: 'Georgia', artist: 'Bzikebi', song: 'On Replay', performanceOrder: 6, flagEmoji: '🇬🇪' },
  { country: 'Finland', artist: 'Linda Lampenius and Pete Parkkonen', song: 'Liekinheitin', performanceOrder: 7, flagEmoji: '🇫🇮' },
  { country: 'Montenegro', artist: 'Tamara Živković', song: 'Nova zora', performanceOrder: 8, flagEmoji: '🇲🇪' },
  { country: 'Estonia', artist: 'Vanilla Ninja', song: 'Too Epic to Be True', performanceOrder: 9, flagEmoji: '🇪🇪' },
  { country: 'Israel', artist: 'Noam Bettan', song: 'Michelle', performanceOrder: 10, flagEmoji: '🇮🇱' },
  { country: 'Belgium', artist: 'Essyla', song: 'Dancing on the Ice', performanceOrder: 11, flagEmoji: '🇧🇪' },
  { country: 'Lithuania', artist: 'Lion Ceccah', song: 'Sólo quiero más', performanceOrder: 12, flagEmoji: '🇱🇹' },
  { country: 'San Marino', artist: 'Senhit', song: 'Superstar', performanceOrder: 13, flagEmoji: '🇸🇲' },
  { country: 'Poland', artist: 'Alicja', song: 'Pray', performanceOrder: 14, flagEmoji: '🇵🇱' },
  { country: 'Serbia', artist: 'Lavina', song: 'Kraj mene', performanceOrder: 15, flagEmoji: '🇷🇸' },

  // Semi-final 2
  { country: 'Bulgaria', artist: 'Dara', song: 'Bangaranga', performanceOrder: 16, flagEmoji: '🇧🇬' },
  { country: 'Azerbaijan', artist: 'Jiva', song: 'Just Go', performanceOrder: 17, flagEmoji: '🇦🇿' },
  { country: 'Romania', artist: 'Alexandra Căpitănescu', song: 'Choke Me', performanceOrder: 18, flagEmoji: '🇷🇴' },
  { country: 'Luxembourg', artist: 'Eva Marija', song: 'Mother Nature', performanceOrder: 19, flagEmoji: '🇱🇺' },
  { country: 'Czechia', artist: 'Daniel Zizka', song: 'Crossroads', performanceOrder: 20, flagEmoji: '🇨🇿' },
  { country: 'Armenia', artist: 'Simón', song: 'Paloma Rumba', performanceOrder: 21, flagEmoji: '🇦🇲' },
  { country: 'Switzerland', artist: 'Veronica Fusaro', song: 'Alice', performanceOrder: 22, flagEmoji: '🇨🇭' },
  { country: 'Cyprus', artist: 'Antigoni', song: 'Jalla', performanceOrder: 23, flagEmoji: '🇨🇾' },
  { country: 'Latvia', artist: 'Atvara', song: 'Ēnā', performanceOrder: 24, flagEmoji: '🇱🇻' },
  { country: 'Denmark', artist: 'Søren Torpegaard Lund', song: 'Før vi går hjem', performanceOrder: 25, flagEmoji: '🇩🇰' },
  { country: 'Australia', artist: 'Delta Goodrem', song: 'Eclipse', performanceOrder: 26, flagEmoji: '🇦🇺' },
  { country: 'Ukraine', artist: 'Leléka', song: 'Ridnym', performanceOrder: 27, flagEmoji: '🇺🇦' },
  { country: 'Albania', artist: 'Alis', song: 'Nân', performanceOrder: 28, flagEmoji: '🇦🇱' },
  { country: 'Malta', artist: 'Aidan', song: 'Bella', performanceOrder: 29, flagEmoji: '🇲🇹' },
  { country: 'Norway', artist: 'Jonas Lovv', song: 'Ya Ya Ya', performanceOrder: 30, flagEmoji: '🇳🇴' },

  // Automatic Qualifiers (Final)
  { country: 'France', artist: 'Monroe', song: 'Regarde !', performanceOrder: 31, flagEmoji: '🇫🇷' },
  { country: 'Germany', artist: 'Sarah Engels', song: 'Fire', performanceOrder: 32, flagEmoji: '🇩🇪' },
  { country: 'Italy', artist: 'Sal Da Vinci', song: 'Per sempre sì', performanceOrder: 33, flagEmoji: '🇮🇹' },
  { country: 'United Kingdom', artist: 'Look Mum No Computer', song: 'Eins, Zwei, Drei', performanceOrder: 34, flagEmoji: '🇬🇧' },
  { country: 'Austria', artist: 'Cosmó', song: 'Tanzschein', performanceOrder: 35, flagEmoji: '🇦🇹' },
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
