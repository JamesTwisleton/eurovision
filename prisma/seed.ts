import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const contestants = [
  { country: 'Albania', artist: 'Alis', song: 'Nan', performanceOrder: 1, flagEmoji: '🇦🇱', youtubeUrl: 'https://www.youtube.com/watch?v=b9AdRrA554o' },
  { country: 'Armenia', artist: 'SIMON', song: 'Paloma Rumba', performanceOrder: 2, flagEmoji: '🇦🇲', youtubeUrl: 'https://www.youtube.com/watch?v=5EXoK-lgocw' },
  { country: 'Australia', artist: 'Delta Goodrem', song: 'Eclipse', performanceOrder: 3, flagEmoji: '🇦🇺', youtubeUrl: 'https://www.youtube.com/watch?v=EUMCr1pnaMY' },
  { country: 'Austria', artist: 'COSMO', song: 'Tanzschein', performanceOrder: 4, flagEmoji: '🇦🇹', youtubeUrl: 'https://www.youtube.com/watch?v=zPGP9ZphxiY' },
  { country: 'Azerbaijan', artist: 'JIVA', song: 'Just Go', performanceOrder: 5, flagEmoji: '🇦🇿', youtubeUrl: 'https://www.youtube.com/watch?v=iMDBPe25JhM' },
  { country: 'Belgium', artist: 'ESSYLA', song: 'Dancing on the Ice', performanceOrder: 6, flagEmoji: '🇧🇪', youtubeUrl: 'https://www.youtube.com/watch?v=9sfI4g6DWTU' },
  { country: 'Bulgaria', artist: 'DARA', song: 'Bangaranga', performanceOrder: 7, flagEmoji: '🇧🇬', youtubeUrl: 'https://www.youtube.com/watch?v=J3oGYo_mekw' },
  { country: 'Croatia', artist: 'LELEK', song: 'Andromeda', performanceOrder: 8, flagEmoji: '🇭🇷', youtubeUrl: 'https://www.youtube.com/watch?v=vl7Jqnw10sU' },
  { country: 'Cyprus', artist: 'Antigoni', song: 'JALLA', performanceOrder: 9, flagEmoji: '🇨🇾', youtubeUrl: 'https://www.youtube.com/watch?v=TzSs51BiQrE' },
  { country: 'Czechia', artist: 'Daniel Zizka', song: 'CROSSROADS', performanceOrder: 10, flagEmoji: '🇨🇿', youtubeUrl: 'https://www.youtube.com/watch?v=6ea25aRGpLo' },
  { country: 'Denmark', artist: 'Søren Torpegaard Lund', song: 'Før Vi Går Hjem', performanceOrder: 11, flagEmoji: '🇩🇰', youtubeUrl: 'https://www.youtube.com/watch?v=xKzEP9dwoss' },
  { country: 'Estonia', artist: 'Vanilla Ninja', song: 'Too Epic To Be True', performanceOrder: 12, flagEmoji: '🇪🇪', youtubeUrl: 'https://www.youtube.com/watch?v=lOiWuol3t3o' },
  { country: 'Finland', artist: 'Linda Lampenius x Pete Parkkonen', song: 'Liekinheitin', performanceOrder: 13, flagEmoji: '🇫🇮', youtubeUrl: 'https://www.youtube.com/watch?v=9bfwNIYb96Q' },
  { country: 'France', artist: 'Monroe', song: 'Regarde !', performanceOrder: 14, flagEmoji: '🇫🇷', youtubeUrl: 'https://www.youtube.com/watch?v=ujoCYrvvTYQ' },
  { country: 'Georgia', artist: 'Bzikebi', song: 'On Replay', performanceOrder: 15, flagEmoji: '🇬🇪', youtubeUrl: 'https://www.youtube.com/watch?v=coh-lygCINY' },
  { country: 'Germany', artist: 'Sarah Engels', song: 'Fire', performanceOrder: 16, flagEmoji: '🇩🇪', youtubeUrl: 'https://www.youtube.com/watch?v=AzvRc3eH_rA' },
  { country: 'Greece', artist: 'Akylas', song: 'Ferto', performanceOrder: 17, flagEmoji: '🇬🇷', youtubeUrl: 'https://www.youtube.com/watch?v=NGwNTd_DA9s' },
  { country: 'Israel', artist: 'Noam Bettan', song: 'Michelle', performanceOrder: 18, flagEmoji: '🇮🇱', youtubeUrl: 'https://www.youtube.com/watch?v=xWCnWSoG8nI' },
  { country: 'Italy', artist: 'Sal Da Vinci', song: 'Per Sempre Sì', performanceOrder: 19, flagEmoji: '🇮🇹', youtubeUrl: 'https://www.youtube.com/watch?v=V406FAGkhyQ' },
  { country: 'Latvia', artist: 'Atvara', song: 'Ēnā', performanceOrder: 20, flagEmoji: '🇱🇻', youtubeUrl: 'https://www.youtube.com/watch?v=6C2ivaB5D00' },
  { country: 'Lithuania', artist: 'Lion Ceccah', song: 'Sólo Quiero Más', performanceOrder: 21, flagEmoji: '🇱🇹', youtubeUrl: 'https://www.youtube.com/watch?v=0H-PXnbhG7A' },
  { country: 'Luxembourg', artist: 'Eva Marija', song: 'Mother Nature', performanceOrder: 22, flagEmoji: '🇱🇺', youtubeUrl: 'https://www.youtube.com/watch?v=bXIOlWnDzaY' },
  { country: 'Malta', artist: 'AIDAN', song: 'Bella', performanceOrder: 23, flagEmoji: '🇲🇹', youtubeUrl: 'https://www.youtube.com/watch?v=CW6mQLBh6Js' },
  { country: 'Moldova', artist: 'Satoshi', song: 'Viva, Moldova!', performanceOrder: 24, flagEmoji: '🇲🇩', youtubeUrl: 'https://www.youtube.com/watch?v=SViojHjNSzc' },
  { country: 'Montenegro', artist: 'Tamara Zivkovic', song: 'Nova Zora', performanceOrder: 25, flagEmoji: '🇲🇪', youtubeUrl: 'https://www.youtube.com/watch?v=nuvy2d60HbI' },
  { country: 'Norway', artist: 'JONAS LOVV', song: 'YA YA YA', performanceOrder: 26, flagEmoji: '🇳🇴', youtubeUrl: 'https://www.youtube.com/watch?v=MasllzWk_bQ' },
  { country: 'Poland', artist: 'ALICJA', song: 'Pray', performanceOrder: 27, flagEmoji: '🇵🇱', youtubeUrl: 'https://www.youtube.com/watch?v=q78cnYIoF9Y' },
  { country: 'Portugal', artist: 'Bandidos do Cante', song: 'Rosa', performanceOrder: 28, flagEmoji: '🇵🇹', youtubeUrl: 'https://www.youtube.com/watch?v=jyHaE6GqaaQ' },
  { country: 'Romania', artist: 'Alexandra Căpitănescu', song: 'Choke Me', performanceOrder: 29, flagEmoji: '🇷🇴', youtubeUrl: 'https://www.youtube.com/watch?v=yn0YmI0dPb8' },
  { country: 'San Marino', artist: 'Senhit', song: 'Superstar', performanceOrder: 30, flagEmoji: '🇸🇲', youtubeUrl: 'https://www.youtube.com/watch?v=wOQe-fQSFxg' },
  { country: 'Serbia', artist: 'LAVINA', song: 'Kraj Mene', performanceOrder: 31, flagEmoji: '🇷🇸', youtubeUrl: 'https://www.youtube.com/watch?v=FJTLKBOOE98' },
  { country: 'Sweden', artist: 'FELICIA', song: 'My System', performanceOrder: 32, flagEmoji: '🇸🇪', youtubeUrl: 'https://www.youtube.com/watch?v=ibbfS8iG450' },
  { country: 'Switzerland', artist: 'Veronica Fusaro', song: 'Alice', performanceOrder: 33, flagEmoji: '🇨🇭', youtubeUrl: 'https://www.youtube.com/watch?v=PfpYGAzW5dM' },
  { country: 'Ukraine', artist: 'LELÉKA', song: 'Ridnym', performanceOrder: 34, flagEmoji: '🇺🇦', youtubeUrl: 'https://www.youtube.com/watch?v=SoEXezpblAc' },
  { country: 'United Kingdom', artist: 'LOOK MUM NO COMPUTER', song: 'Eins, Zwei, Drei', performanceOrder: 35, flagEmoji: '🇬🇧', youtubeUrl: 'https://www.youtube.com/watch?v=niMKvJ-Itq8' },
]

async function main() {
  console.log('Cleaning up existing data...')
  // Delete all members, scores and watch parties to avoid conflicts and satisfy user request
  await prisma.score.deleteMany({})
  await prisma.member.deleteMany({})
  await prisma.watchParty.deleteMany({})

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
