import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const contestants = [
  { country: 'Denmark', artist: 'Søren Torpegaard Lund', song: 'Før Vi Går Hjem', performanceOrder: 1, flagEmoji: '🇩🇰', youtubeUrl: 'https://www.youtube.com/watch?v=xKzEP9dwoss' },
  { country: 'Germany', artist: 'Sarah Engels', song: 'Fire', performanceOrder: 2, flagEmoji: '🇩🇪', youtubeUrl: 'https://www.youtube.com/watch?v=AzvRc3eH_rA' },
  { country: 'Israel', artist: 'Noam Bettan', song: 'Michelle', performanceOrder: 3, flagEmoji: '🇮🇱', youtubeUrl: 'https://www.youtube.com/watch?v=xWCnWSoG8nI' },
  { country: 'Belgium', artist: 'Essyla', song: 'Dancing on the Ice', performanceOrder: 4, flagEmoji: '🇧🇪', youtubeUrl: 'https://www.youtube.com/watch?v=9sfI4g6DWTU' },
  { country: 'Albania', artist: 'Alis Kallaçi', song: 'Nân', performanceOrder: 5, flagEmoji: '🇦🇱', youtubeUrl: 'https://www.youtube.com/watch?v=b9AdRrA554o' },
  { country: 'Greece', artist: 'Akylas', song: 'Ferto', performanceOrder: 6, flagEmoji: '🇬🇷', youtubeUrl: 'https://www.youtube.com/watch?v=NGwNTd_DA9s' },
  { country: 'Ukraine', artist: 'LELÉKA', song: 'Ridnym', performanceOrder: 7, flagEmoji: '🇺🇦', youtubeUrl: 'https://www.youtube.com/watch?v=SoEXezpblAc' },
  { country: 'Australia', artist: 'Delta Goodrem', song: 'Eclipse', performanceOrder: 8, flagEmoji: '🇦🇺', youtubeUrl: 'https://www.youtube.com/watch?v=EUMCr1pnaMY' },
  { country: 'Serbia', artist: 'LAVINA', song: 'Kraj Mene', performanceOrder: 9, flagEmoji: '🇷🇸', youtubeUrl: 'https://www.youtube.com/watch?v=FJTLKBOOE98' },
  { country: 'Malta', artist: 'AIDAN', song: 'Bella', performanceOrder: 10, flagEmoji: '🇲🇹', youtubeUrl: 'https://www.youtube.com/watch?v=CW6mQLBh6Js' },
  { country: 'Czechia', artist: 'Daniel Žižka', song: 'CROSSROADS', performanceOrder: 11, flagEmoji: '🇨🇿', youtubeUrl: 'https://www.youtube.com/watch?v=6ea25aRGpLo' },
  { country: 'Bulgaria', artist: 'DARA', song: 'Bangaranga', performanceOrder: 12, flagEmoji: '🇧🇬', youtubeUrl: 'https://www.youtube.com/watch?v=J3oGYo_mekw' },
  { country: 'Croatia', artist: 'LELEK', song: 'Andromeda', performanceOrder: 13, flagEmoji: '🇭🇷', youtubeUrl: 'https://www.youtube.com/watch?v=vl7Jqnw10sU' },
  { country: 'United Kingdom', artist: 'LOOK MUM NO COMPUTER', song: 'Eins, Zwei, Drei', performanceOrder: 14, flagEmoji: '🇬🇧', youtubeUrl: 'https://www.youtube.com/watch?v=niMKvJ-Itq8' },
  { country: 'France', artist: 'Monroe', song: 'Regarde!', performanceOrder: 15, flagEmoji: '🇫🇷', youtubeUrl: 'https://www.youtube.com/watch?v=ujoCYrvvTYQ' },
  { country: 'Moldova', artist: 'Satoshi', song: 'Viva, Moldova!', performanceOrder: 16, flagEmoji: '🇲🇩', youtubeUrl: 'https://www.youtube.com/watch?v=SViojHjNSzc' },
  { country: 'Finland', artist: 'Linda Lampenius & Pete Parkkonen', song: 'Liekinheitin', performanceOrder: 17, flagEmoji: '🇫🇮', youtubeUrl: 'https://www.youtube.com/watch?v=9bfwNIYb96Q' },
  { country: 'Poland', artist: 'ALICJA', song: 'Pray', performanceOrder: 18, flagEmoji: '🇵🇱', youtubeUrl: 'https://www.youtube.com/watch?v=q78cnYIoF9Y' },
  { country: 'Lithuania', artist: 'Lion Ceccah', song: 'Sólo Quiero Más', performanceOrder: 19, flagEmoji: '🇱🇹', youtubeUrl: 'https://www.youtube.com/watch?v=0H-PXnbhG7A' },
  { country: 'Sweden', artist: 'Felicia', song: 'My System', performanceOrder: 20, flagEmoji: '🇸🇪', youtubeUrl: 'https://www.youtube.com/watch?v=ibbfS8iG450' },
  { country: 'Cyprus', artist: 'Antigoni', song: 'JALLA', performanceOrder: 21, flagEmoji: '🇨🇾', youtubeUrl: 'https://www.youtube.com/watch?v=TzSs51BiQrE' },
  { country: 'Italy', artist: 'Sal Da Vinci', song: 'Per Sempre Sì', performanceOrder: 22, flagEmoji: '🇮🇹', youtubeUrl: 'https://www.youtube.com/watch?v=V406FAGkhyQ' },
  { country: 'Norway', artist: 'JONAS LOVV', song: 'YA YA YA', performanceOrder: 23, flagEmoji: '🇳🇴', youtubeUrl: 'https://www.youtube.com/watch?v=MasllzWk_bQ' },
  { country: 'Romania', artist: 'Alexandra Căpitănescu', song: 'Choke Me', performanceOrder: 24, flagEmoji: '🇷🇴', youtubeUrl: 'https://www.youtube.com/watch?v=yn0YmI0dPb8' },
  { country: 'Austria', artist: 'COSMÓ', song: 'TANZSCHEIN', performanceOrder: 25, flagEmoji: '🇦🇹', youtubeUrl: 'https://www.youtube.com/watch?v=zPGP9ZphxiY' },
]

async function main() {
  const armenia = await prisma.contestant.findUnique({
    where: { country: 'Armenia' }
  })

  const contestantCount = await prisma.contestant.count()

  if (armenia || contestantCount === 0) {
    console.log('Finalists list update required. Clearing existing scores and updating contestants...')

    // Clear scores first due to foreign key constraints
    await prisma.score.deleteMany({})

    // Reset hasFinalized status for all members
    await prisma.member.updateMany({
      data: { hasFinalized: false }
    })

    // Remove old contestants
    await prisma.contestant.deleteMany({})

    // Seed new finalists
    for (const contestant of contestants) {
      await prisma.contestant.create({
        data: contestant
      })
    }
    console.log('Seeding complete!')
  } else {
    console.log('Finalists already updated or manually managed. Skipping seed.')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
