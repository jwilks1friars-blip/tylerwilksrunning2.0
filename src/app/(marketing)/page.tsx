import Link from 'next/link'
import Image from 'next/image'

const FEATURES = [
  {
    title: 'Strava Sync',
    description: 'Every run automatically pulled from Strava the moment you finish. No manual logging, no gaps.',
  },
  {
    title: 'Weekly Coaching Notes',
    description: 'A personal note from Tyler every Monday reviewing your week — what worked, what to adjust, what\'s coming.',
  },
  {
    title: 'AI-Powered Plans',
    description: 'Training plans built around your goal race, current fitness, and available days. Adapted as you go.',
  },
  {
    title: 'Race-Ready Insights',
    description: 'Pace trends, heart rate zones, mileage progression — the data that actually tells you if you\'re ready.',
  },
]

const PLANS = [
  {
    name: 'Plan',
    price: '$29',
    description: 'A structured training plan built for your goal race. Updated monthly.',
    features: [
      'Custom training plan',
      'Strava sync',
      'Weekly mileage dashboard',
      'Race-day pacing guide',
    ],
    cta: 'Get the Plan',
    tier: 'plan',
    highlight: false,
  },
  {
    name: 'Coaching',
    price: '$99',
    description: 'Everything in Plan plus weekly coaching notes from Tyler, written for you.',
    features: [
      'Everything in Plan',
      'Weekly coaching note from Tyler',
      'Insight approval & editing',
      'Priority support',
    ],
    cta: 'Start Coaching',
    tier: 'coaching',
    highlight: true,
  },
  {
    name: 'Elite',
    price: '$249',
    description: 'Full-access coaching with direct communication and real-time plan adjustments.',
    features: [
      'Everything in Coaching',
      'Direct messaging with Tyler',
      'Real-time plan adjustments',
      'Monthly video call',
    ],
    cta: 'Go Elite',
    tier: 'elite',
    highlight: false,
  },
]

const STEPS = [
  { number: '01', title: 'Sign up & set your goal', description: 'Tell us your target race, goal time, and current weekly mileage.' },
  { number: '02', title: 'Connect Strava', description: 'Your runs sync automatically. No manual entry ever.' },
  { number: '03', title: 'Get your plan', description: 'A structured training plan built around your schedule and fitness level.' },
  { number: '04', title: 'Train with coaching', description: 'Every Monday, a coaching note in your dashboard reviewing your week.' },
]

export default function HomePage() {
  return (
    <div>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p
              className="text-xs uppercase tracking-widest mb-6"
              style={{ color: '#6b6560' }}
            >
              Online Running Coach
            </p>
            <h1
              className="text-6xl md:text-8xl font-semibold uppercase tracking-tight leading-none mb-8"
              style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}
            >
              Train Smarter.<br />Race Faster.
            </h1>
            <p
              className="text-lg leading-8 mb-10"
              style={{ color: '#6b6560' }}
            >
              Data-driven training plans and weekly coaching from Tyler Wilks — built around your Strava data, your goal race, and your life.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="px-6 py-3 text-xs uppercase tracking-widest font-medium transition-opacity hover:opacity-80"
                style={{ backgroundColor: '#e8e0d4', color: '#0a0908', borderRadius: '2px' }}
              >
                Start Training
              </Link>
              <Link
                href="/coaching"
                className="px-6 py-3 text-xs uppercase tracking-widest transition-opacity hover:opacity-80"
                style={{ border: '1px solid #2a2521', color: '#e8e0d4', borderRadius: '2px' }}
              >
                View Plans
              </Link>
            </div>
          </div>
          <div className="relative aspect-[3/4] hidden md:block">
            <Image
              src="/IMG_2270.jpg"
              alt="Tyler Wilks finishing a race"
              fill
              className="object-cover object-top"
              priority
            />
          </div>
        </div>
      </section>

      {/* Divider */}
      <div style={{ borderTop: '1px solid #1e1b18' }} />

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <p
          className="text-xs uppercase tracking-widest mb-16"
          style={{ color: '#6b6560' }}
        >
          What you get
        </p>
        <div className="grid md:grid-cols-2 gap-px" style={{ border: '1px solid #1e1b18' }}>
          {FEATURES.map((feature, i) => (
            <div
              key={feature.title}
              className="p-8"
              style={{
                backgroundColor: '#0a0908',
                borderRight: i % 2 === 0 ? '1px solid #1e1b18' : 'none',
                borderBottom: i < 2 ? '1px solid #1e1b18' : 'none',
              }}
            >
              <h3
                className="text-2xl font-semibold uppercase tracking-widest mb-3"
                style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}
              >
                {feature.title}
              </h3>
              <p className="text-sm leading-7" style={{ color: '#6b6560' }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div style={{ borderTop: '1px solid #1e1b18' }} />

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <p
          className="text-xs uppercase tracking-widest mb-16"
          style={{ color: '#6b6560' }}
        >
          How it works
        </p>
        <div className="grid md:grid-cols-4 gap-8">
          {STEPS.map(step => (
            <div key={step.number}>
              <p
                className="text-4xl font-semibold mb-4"
                style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#1e1b18' }}
              >
                {step.number}
              </p>
              <h3
                className="text-lg font-semibold uppercase tracking-widest mb-2"
                style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}
              >
                {step.title}
              </h3>
              <p className="text-sm leading-7" style={{ color: '#6b6560' }}>
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div style={{ borderTop: '1px solid #1e1b18' }} />

      {/* Pricing */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <p
          className="text-xs uppercase tracking-widest mb-16"
          style={{ color: '#6b6560' }}
        >
          Pricing
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          {PLANS.map(plan => (
            <div
              key={plan.name}
              className="p-8 flex flex-col"
              style={{
                backgroundColor: plan.highlight ? '#141210' : 'transparent',
                border: plan.highlight ? '1px solid #e8e0d4' : '1px solid #1e1b18',
              }}
            >
              <div className="mb-6">
                <p
                  className="text-xs uppercase tracking-widest mb-4"
                  style={{ color: plan.highlight ? '#e8e0d4' : '#6b6560' }}
                >
                  {plan.name}
                </p>
                <div className="flex items-baseline gap-2 mb-4">
                  <span
                    className="text-5xl font-semibold"
                    style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}
                  >
                    {plan.price}
                  </span>
                  <span className="text-xs uppercase tracking-widest" style={{ color: '#6b6560' }}>
                    / mo
                  </span>
                </div>
                <p className="text-sm leading-7" style={{ color: '#6b6560' }}>
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-2 mb-8 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-3 text-sm" style={{ color: '#e8e0d4' }}>
                    <span style={{ color: '#6b6560' }}>—</span>
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

      {/* Divider */}
      <div style={{ borderTop: '1px solid #1e1b18' }} />

      {/* CTA banner */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <h2
          className="text-5xl md:text-7xl font-semibold uppercase tracking-tight mb-6"
          style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}
        >
          Ready to race?
        </h2>
        <p className="text-sm mb-10 max-w-md mx-auto leading-7" style={{ color: '#6b6560' }}>
          Join athletes training with data-driven plans and real coaching from Tyler Wilks.
        </p>
        <Link
          href="/signup"
          className="inline-block px-8 py-3 text-xs uppercase tracking-widest font-medium transition-opacity hover:opacity-80"
          style={{ backgroundColor: '#e8e0d4', color: '#0a0908', borderRadius: '2px' }}
        >
          Start for Free
        </Link>
      </section>

      {/* Footer */}
      <footer
        className="px-6 py-10"
        style={{ borderTop: '1px solid #1e1b18' }}
      >
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
