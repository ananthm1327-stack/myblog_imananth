// Seeds dummy content into localStorage on first load, so the site
// doesn't feel empty. Runs once per browser (guarded by a flag).
// Delete the flag key `ia_seeded` from localStorage to re-seed.

const SEED_FLAG = 'ia_seeded_v1'

const iso = (daysAgo) => {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString()
}

const id = (n) => `seed-${n}-${Math.random().toString(36).slice(2, 7)}`

// Unsplash photos — free to use, no attribution required.
const PHOTO_URLS = {
  mountains: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
  ocean: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
  street: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=80',
  coffee: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
  books: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80',
  city: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80',
  desk: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80',
  road: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80'
}

const SEED = {
  journal: [
    {
      id: id(1),
      title: 'On starting again',
      body: `There's a particular kind of quiet that comes with beginning something new. Not the loud, celebratory kind — the small, private one. This morning I opened a blank page and just sat with it for a while.\n\nI've been thinking about how much of life is spent not on the doing, but on the getting-ready-to-do. I want to spend less time preparing and more time just being here.`,
      image: '',
      createdAt: iso(2)
    },
    {
      id: id(2),
      title: 'A slow Sunday',
      body: `Nothing to report. Made coffee, re-read a book I've read three times already, watched the light move across the floor. Some days are just for that.`,
      image: PHOTO_URLS.coffee,
      createdAt: iso(9)
    },
    {
      id: id(3),
      title: 'Late night, half thoughts',
      body: `Can't sleep. Writing this down so it stops circling in my head:\n\n- I keep confusing being busy with being useful.\n- The best conversations I had this year were with people who asked me questions I couldn't answer immediately.\n- I should call my grandmother more often.`,
      image: '',
      createdAt: iso(21)
    }
  ],

  photos: [
    { id: id(10), title: 'Morning fog, somewhere north', body: 'Woke up at 5am for this. Worth every yawn.', image: PHOTO_URLS.mountains, createdAt: iso(4) },
    { id: id(11), title: 'The sea does not care', body: 'A reminder I needed.', image: PHOTO_URLS.ocean, createdAt: iso(12) },
    { id: id(12), title: 'Between two buildings', body: 'Old city, new light.', image: PHOTO_URLS.street, createdAt: iso(18) },
    { id: id(13), title: 'City after rain', body: '', image: PHOTO_URLS.city, createdAt: iso(30) }
  ],

  experiences: [
    {
      id: id(20),
      title: 'A week without a phone',
      body: `I left the phone in a drawer for seven days. Told two people where I'd be. Read three books.\n\nWhat surprised me wasn't the boredom — it was the number of times my hand reached for a pocket that had nothing in it. Muscle memory, apparently, is a real thing. By day four the reflex faded. By day six I forgot which day it was, and honestly, it was fine.`,
      image: PHOTO_URLS.books,
      createdAt: iso(6)
    },
    {
      id: id(21),
      title: 'Learning to cook, badly',
      body: `Set the smoke alarm off twice this week. Made one dish my mother said was "not bad" — which, from her, is a standing ovation.`,
      image: '',
      createdAt: iso(15)
    },
    {
      id: id(22),
      title: 'A road trip with no plan',
      body: `We drove east until we hit a coast, then turned around when we felt like it. No hotels booked. No itinerary. Highly recommend.`,
      image: PHOTO_URLS.road,
      createdAt: iso(28)
    }
  ],

  articles: [
    {
      id: id(30),
      title: 'Why I keep a paper notebook',
      body: `Every productivity app I've tried has one thing in common: I stop using it. Notion, Obsidian, Bear, Apple Notes — all abandoned within a month.\n\nMy paper notebook has survived seven years.\n\nI think it's because a notebook doesn't ask for anything. It doesn't sync, notify, or suggest a template. It just sits there, patient, until I open it. There's no dashboard telling me my "streak" is at risk. There's no algorithm quietly deciding what I should see first.\n\nThe act of writing by hand is also slower — which sounds like a bug and is actually the feature. Slow writing forces slow thinking. And slow thinking, it turns out, is the only kind worth doing.`,
      image: PHOTO_URLS.desk,
      createdAt: iso(3)
    },
    {
      id: id(31),
      title: 'The overrated art of the hot take',
      body: `We reward speed of opinion far more than quality of opinion. I've been trying to notice how often I form a view within seconds of hearing something — and how often, on reflection a day later, that view was lazy.\n\nA quiet suggestion: hold your take for 24 hours before publishing it. Half the time, you won't want to publish it at all.`,
      image: '',
      createdAt: iso(11)
    },
    {
      id: id(32),
      title: 'On working alone vs. working with people',
      body: `I used to think I preferred working alone. Turns out I preferred working around people who let me think. There's a difference between solitude and silence.`,
      image: '',
      createdAt: iso(25)
    }
  ],

  views: [
    {
      id: id(40),
      title: 'AI is not the villain in your story',
      body: `Every generation gets a technology it's told to be afraid of. Ours is AI. But the more time I spend around these tools, the more I think the real risk isn't that they replace us — it's that we hand them the parts of ourselves we should have kept: our curiosity, our willingness to be wrong, our patience for the slow answer.\n\nUse the tools. But keep the thinking.`,
      image: '',
      createdAt: iso(1)
    },
    {
      id: id(41),
      title: 'Cities are for walking',
      body: `A city that punishes you for not owning a car is a city that has forgotten what it's for. The best hours I've spent in any city have been on foot, with no destination.`,
      image: '',
      createdAt: iso(8)
    },
    {
      id: id(42),
      title: 'Books over podcasts, most of the time',
      body: `Podcasts are great for the commute. Books are for the argument you want to have with yourself. Both matter. But if I had to pick one for the next decade, it's books, every time.`,
      image: '',
      createdAt: iso(19)
    },
    {
      id: id(43),
      title: 'The best productivity advice is boring',
      body: `Sleep enough. Eat properly. Move your body. Do the hard thing first. Stop reading productivity content (including, ironically, this).`,
      image: '',
      createdAt: iso(27)
    }
  ]
}

export function seedIfEmpty() {
  if (localStorage.getItem(SEED_FLAG)) return
  Object.entries(SEED).forEach(([key, items]) => {
    const storageKey = `ia_${key}`
    // Only seed if the section is currently empty — don't overwrite user posts.
    const existing = localStorage.getItem(storageKey)
    if (!existing || existing === '[]') {
      localStorage.setItem(storageKey, JSON.stringify(items))
    }
  })
  localStorage.setItem(SEED_FLAG, '1')
}
