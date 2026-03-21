import Link from 'next/link'
import Image from 'next/image'
import FaqAccordion from '@/components/marketing/FaqAccordion'

const PLANS = [
  {
    name: 'Coaching',
    price: '$150',
    period: 'per block of training',
    description: 'A structured, periodized training plan built around your goal race and current fitness — with personal coaching from Tyler based on your Strava data.',
    features: [
      'Custom training plan (12–20 weeks)',
      'Strava auto-sync',
      'Weekly mileage dashboard',
      'Daily workout schedule',
      'Pace targets for every run',
      'Race-day pacing guide',
      'Weekly coaching note from Tyler',
      'Plan adjustments when life happens',
      'HR and pace analysis',
      'Pre-race and post-race debriefs',
      'Race strategy sessions',
      'Strength & cross-training guidance',
    ],
    cta: 'Start Coaching',
    highlight: true,
    tier: 'coaching',
  },
]

const WHAT_TO_EXPECT = [
  {
    week: 'Week 1',
    title: 'Onboarding',
    description: 'You share your goal race, current mileage, and training history. I build your first plan within 48 hours.',
  },
  {
    week: 'Ongoing',
    title: 'Strava syncs automatically',
    description: 'Every run you log appears in your dashboard instantly. No manual entry, no check-ins required.',
  },
  {
    week: 'Every Monday',
    title: 'Your coaching note',
    description: 'I review your week — what you hit, what you missed, how your paces trended — and write you a direct note with what\'s coming.',
  },
  {
    week: 'Race week',
    title: 'Race-ready',
    description: 'A full race-day guide: splits, warm-up, pacing strategy, and what to do if things go sideways.',
  },
]

const FAQS = [
  {
    q: 'Do I need to be an experienced runner?',
    a: 'No. Plans are built for beginners through competitive athletes. You tell me where you are, I build from there.',
  },
  {
    q: 'What if I miss a workout?',
    a: 'Life happens. Missed runs are absorbed into the plan — I adjust the following week to keep you on track without digging a hole.',
  },
  {
    q: 'How does Strava sync work?',
    a: 'You connect your Strava account once. After that, every run syncs automatically the moment you finish. No app switching.',
  },
  {
    q: 'Can I switch plans?',
    a: 'Yes, at any time. Upgrade, downgrade, or cancel from your dashboard settings.',
  },
  {
    q: 'What races do you coach for?',
    a: '5K through ultramarathon. Road, trail, track. If you\'re racing it, I\'ve coached it.',
  },
  {
    q: 'Is there a free trial?',
    a: 'No free trial, but you can cancel anytime before your next billing date — no questions asked.',
  },
]

export default function CoachingPage() {
  return (
    <div>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-10">
        <p className="text-xs uppercase tracking-widest mb-6" style={{ color: '#6b6560' }}>
          Coaching Plans
        </p>
        <h1
          className="text-6xl md:text-8xl font-semibold uppercase tracking-tight leading-none mb-8 w-full"
          style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}
        >
          Real Coaching. Real Results.
        </h1>
        <p className="text-lg leading-8 max-w-xl" style={{ color: '#6b6560' }}>
          Every plan is built around your data — your runs, your paces, your schedule. Not a template. Not a generic 16-week PDF.
        </p>
      </section>

      <div style={{ borderTop: '1px solid #1e1b18' }} />

      {/* About Tyler */}
      <section className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="relative aspect-[4/3]">
            <Image
              src="/479005126.jpg"
              alt="Tyler Wilks in a race"
              fill
              className="object-cover"
            />
          </div>
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-widest mb-6" style={{ color: '#6b6560' }}>
            About Tyler
          </p>
          <h2
            className="text-4xl font-semibold uppercase tracking-widest mb-6"
            style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}
          >
            Coached by someone who actually runs
          </h2>
          <p className="text-sm leading-8 mb-4" style={{ color: '#6b6560' }}>
            I'm Tyler Wilks. I've been running competitively for over a decade — from 5Ks to 100-milers, roads to trails. I've made every mistake there is to make in training, and I've learned from all of them.
          </p>
          <p className="text-sm leading-8 mb-8" style={{ color: '#6b6560' }}>
            My coaching is built on one principle: the plan has to fit your life. Not the other way around. I use your Strava data to understand how you're actually responding to training, then adjust accordingly. No guessing. No templates.
          </p>
          <Link
            href="/about"
            className="text-xs uppercase tracking-widest transition-colors hover:text-[#f5f2ee]"
            style={{ color: '#e8e0d4' }}
          >
            More about Tyler →
          </Link>
        </div>
        </div>
      </section>

      <div style={{ borderTop: '1px solid #1e1b18' }} />

      {/* Pricing */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="flex justify-center">
          {PLANS.map(plan => (
            <div
              key={plan.name}
              className="p-8 flex flex-col w-full max-w-4xl"
              style={{
                backgroundColor: plan.highlight ? '#141210' : 'transparent',
                border: plan.highlight ? '1px solid #e8e0d4' : '1px solid #1e1b18',
              }}
            >
              {plan.highlight && (
                <p className="text-xs uppercase tracking-widest mb-4" style={{ color: '#fc4c02' }}>
                  Most popular
                </p>
              )}

              <p
                className="text-xs uppercase tracking-widest mb-4"
                style={{ color: plan.highlight ? '#e8e0d4' : '#6b6560' }}
              >
                {plan.name}
              </p>

              <div className="flex items-baseline gap-2 mb-3">
                <span
                  className="text-5xl font-semibold"
                  style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}
                >
                  {plan.price}
                </span>
                <span className="text-xs uppercase tracking-widest" style={{ color: '#6b6560' }}>
                  {plan.period}
                </span>
              </div>

              <p className="text-sm leading-7 mb-8" style={{ color: '#6b6560' }}>
                {plan.description}
              </p>

              <ul className="grid grid-cols-2 gap-x-12 gap-y-3 mb-10 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-3 text-sm" style={{ color: '#e8e0d4' }}>
                    <span className="mt-0.5 shrink-0" style={{ color: '#6b6560' }}>—</span>
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className="block text-center py-3 text-xs uppercase tracking-widest font-medium transition-opacity hover:opacity-80"
                style={plan.highlight
                  ? { backgroundColor: '#e8e0d4', color: '#0a0908', borderRadius: '2px' }
                  : { border: '1px solid #2a2521', color: '#e8e0d4', borderRadius: '2px' }
                }
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <div style={{ borderTop: '1px solid #1e1b18' }} />

      {/* What to expect */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <p className="text-xs uppercase tracking-widest mb-16" style={{ color: '#6b6560' }}>
          What to expect
        </p>
        <div className="grid md:grid-cols-4 gap-8">
          {WHAT_TO_EXPECT.map(item => (
            <div key={item.week}>
              <p
                className="text-xs uppercase tracking-widest mb-3"
                style={{ color: '#fc4c02' }}
              >
                {item.week}
              </p>
              <h3
                className="text-xl font-semibold uppercase tracking-widest mb-3"
                style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}
              >
                {item.title}
              </h3>
              <p className="text-sm leading-7" style={{ color: '#6b6560' }}>
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div style={{ borderTop: '1px solid #1e1b18' }} />

      {/* FAQ */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <p className="text-xs uppercase tracking-widest mb-12" style={{ color: '#6b6560' }}>
          FAQ
        </p>
        <FaqAccordion faqs={FAQS} />
      </section>

      <div style={{ borderTop: '1px solid #1e1b18' }} />

      {/* Bottom CTA */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <h2
          className="text-5xl md:text-7xl font-semibold uppercase tracking-tight mb-6"
          style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}
        >
          Ready to race?
        </h2>
        <p className="text-sm mb-10 max-w-sm mx-auto leading-7" style={{ color: '#6b6560' }}>
          One block. One coach. Training built around you.
        </p>
        <Link
          href="/signup"
          className="inline-block px-8 py-3 text-xs uppercase tracking-widest font-medium transition-opacity hover:opacity-80"
          style={{ backgroundColor: '#e8e0d4', color: '#0a0908', borderRadius: '2px' }}
        >
          Get Started
        </Link>
      </section>

      {/* Footer */}
      <footer className="px-6 py-10" style={{ borderTop: '1px solid #1e1b18' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span
            className="text-sm uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#6b6560' }}
          >
            Tyler Wilks Running
          </span>
          <div className="flex gap-6">
            {[
              { href: '/coaching', label: 'Coaching' },
              { href: '/about', label: 'About' },
              { href: '/blog', label: 'Blog' },
              { href: '/login', label: 'Sign in' },
            ].map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs uppercase tracking-widest transition-colors hover:text-[#f5f2ee]"
                style={{ color: '#6b6560' }}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <p className="text-xs" style={{ color: '#2a2521' }}>
            © {new Date().getFullYear()} Tyler Wilks Running
          </p>
        </div>
      </footer>

    </div>
  )
}
