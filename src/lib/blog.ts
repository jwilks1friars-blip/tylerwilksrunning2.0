export interface Post {
  slug: string
  title: string
  date: string
  category: string
  excerpt: string
  sections: { heading?: string; body: string }[]
}

export const POSTS: Post[] = [
  {
    slug: 'how-to-build-aerobic-base',
    title: 'How to Build Your Aerobic Base (Without Burning Out)',
    date: '2026-02-17',
    category: 'Training',
    excerpt: 'Most runners go too hard on easy days and not hard enough on hard days. Here\'s how to fix that — and why the boring runs are the most important ones you\'ll do all year.',
    sections: [
      {
        body: 'The most common mistake I see in runners — from beginners to people chasing Boston — is running too hard on easy days. It feels productive. The heart rate climbs, you\'re sweating, the pace is respectable. But you\'re not building your aerobic base. You\'re just accumulating fatigue.',
      },
      {
        heading: 'What the aerobic base actually is',
        body: 'Your aerobic base is your engine. It\'s built through volume at low intensity — runs where you can hold a full conversation, where your heart rate stays below 75% of max, where you finish feeling like you could have gone further. These runs develop the mitochondrial density, capillary networks, and fat-oxidation capacity that make every other run better.',
      },
      {
        heading: 'The 80/20 rule',
        body: 'Elite runners do roughly 80% of their training at low intensity and 20% at moderate to high intensity. Most recreational runners invert this accidentally — they push on easy days, skip the real hard workouts, and wonder why they\'re always tired and not improving. The fix isn\'t complicated: slow down on easy days. Deliberately, uncomfortably slow. Use heart rate if pace feels too humbling.',
      },
      {
        heading: 'How to build it without burning out',
        body: 'Start by identifying your easy pace. For most runners this is 60–90 seconds per mile slower than marathon pace — slower than you think. Then increase weekly mileage by no more than 10% per week. Add a weekly long run. Keep 80% of your runs genuinely easy. Do this for 8–12 weeks before adding intensity and watch your fitness compound.',
      },
      {
        heading: 'What your data tells you',
        body: 'If you\'re on Strava, look at your heart rate on easy runs. If it\'s above 150 bpm for most of the run, you\'re running too hard. Over a properly built base block, you\'ll see the same paces at lower heart rates — that\'s aerobic adaptation happening in real time.',
      },
    ],
  },
  {
    slug: 'reading-strava-data-like-a-coach',
    title: 'How to Read Your Strava Data Like a Coach',
    date: '2026-02-03',
    category: 'Data',
    excerpt: 'Strava gives you more information than most runners know what to do with. Here are the five numbers I look at first when reviewing an athlete\'s week — and what they actually mean.',
    sections: [
      {
        body: 'Every week I review Strava data for the athletes I coach. After years of doing this, I\'ve narrowed it down to five metrics that tell me almost everything I need to know about how training is going. Here\'s what I look at — and how to interpret it yourself.',
      },
      {
        heading: '1. Average heart rate on easy runs',
        body: 'This is the single best indicator of aerobic fitness and recovery. If an athlete\'s easy runs are trending toward higher heart rates at the same pace, something\'s wrong — overtraining, poor sleep, illness, or life stress. If heart rate is dropping at the same pace over weeks, the base is building. I look at this before anything else.',
      },
      {
        heading: '2. Pace consistency on tempo and interval sessions',
        body: 'On a well-executed tempo run, your pace should be nearly identical across all miles. If you go out too fast and fade, the workout didn\'t do what it was supposed to. I look at the pace per lap or mile splits on every quality session. Wild variation tells me the athlete doesn\'t know their zones yet — or isn\'t recovered enough to hit them.',
      },
      {
        heading: '3. Weekly mileage trend over 4 weeks',
        body: 'One big week doesn\'t mean much. Four weeks of consistent or gently rising mileage means a lot. I look at the 4-week trend, not the most recent number. A spike often precedes an injury. A dip is fine — it might be intentional recovery. The trend is the signal.',
      },
      {
        heading: '4. Long run effort vs. distance',
        body: 'The long run should feel easy. If an athlete is running 18 miles at marathon effort, they\'re racing their long run — and they\'ll be wrecked for the rest of the week. I look at average heart rate on long runs relative to the distance. The longer the run, the lower the effort should be.',
      },
      {
        heading: '5. Days between hard sessions',
        body: 'Most recreational runners don\'t give themselves enough recovery between hard workouts. I count the days between any session with elevated heart rate or significant pace work. Two hard sessions in 48 hours with no easy day between them is a red flag. Recovery is where adaptation happens — compress it and you\'re just accumulating damage.',
      },
    ],
  },
  {
    slug: 'what-to-do-the-week-before-your-race',
    title: 'What to Do the Week Before Your Race',
    date: '2026-01-20',
    category: 'Racing',
    excerpt: 'The week before a race is not the time to cram in extra mileage or test new gear. It\'s the time to get out of your own way. Here\'s exactly what I tell my athletes in race week.',
    sections: [
      {
        body: 'Race week is the week most runners ruin races they\'ve trained well for. They panic about fitness they can\'t gain in seven days, run too much, eat differently, buy new shoes, or spiral into anxiety. Here\'s what to do instead.',
      },
      {
        heading: 'Monday–Wednesday: keep moving, cut volume',
        body: 'Run easy every day but cut your total mileage to about 40–50% of your normal week. Include one short shakeout with a few strides on Wednesday or Thursday — just enough to remind your legs what fast feels like. Nothing heroic. Nothing new.',
      },
      {
        heading: 'Sleep is your most important workout',
        body: 'Two nights before the race matters more than the night before — most people sleep poorly the night before a race and that\'s fine. Prioritize sleep Monday through Thursday. Limit alcohol. Protect your sleep environment. The fitness you\'ve built all season is stored in your body — rest lets you access it.',
      },
      {
        heading: 'Eat what you know',
        body: 'Race week is not the time to experiment with carb loading if you\'ve never done it. Eat normally. Keep carbohydrate intake moderate to high. Avoid anything your stomach doesn\'t know well. The night before, eat something familiar and low-fiber — pasta, rice, whatever you\'ve had before long runs.',
      },
      {
        heading: 'Gear check on Thursday',
        body: 'Lay out your entire race kit on Thursday. Shoes you\'ve run in. Socks you know. Race kit you\'ve tested. Fuel you\'ve practiced with. Charge your watch. Pin your bib. Do not wear anything on race day that you haven\'t run in before.',
      },
      {
        heading: 'The mindset',
        body: 'By Friday, your fitness is set. Nothing you do in the next 48 hours will meaningfully improve or hurt your aerobic capacity. Your job now is to stay calm, stay off your feet, and trust the training. The fitness is there. You just have to show up and run.',
      },
    ],
  },
]

export function getPost(slug: string): Post | undefined {
  return POSTS.find(p => p.slug === slug)
}
